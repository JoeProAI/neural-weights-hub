import { DaytonaService } from '../../../lib/daytona.js';
import { verifyUserToken, getUserData, updateUserData } from '../../../lib/firebase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.authorization;
    const userInfo = await verifyUserToken(authHeader);
    const userId = userInfo.userId;
    const userEmail = userInfo.email;

    const { sandboxId } = req.body;

    if (!sandboxId) {
      return res.status(400).json({ error: 'Sandbox ID is required' });
    }

    // Initialize Daytona service
    const daytonaService = new DaytonaService();
    const headers = await daytonaService.createHeaders();

    console.log(`Starting sandbox ${sandboxId} for user ${userId}`);

    // Get sandbox details first to verify ownership
    const sandboxResponse = await fetch(`${daytonaService.baseUrl}/sandbox/${sandboxId}`, {
      method: 'GET',
      headers
    });

    if (!sandboxResponse.ok) {
      throw new Error(`Failed to get sandbox: ${sandboxResponse.status}`);
    }

    const sandbox = await sandboxResponse.json();

    // Verify user owns this sandbox
    const isOwner = (
      (sandbox.env && sandbox.env['NEURAL_WEIGHTS_USER_ID'] === userId) ||
      (sandbox.labels && sandbox.labels['neural-weights/user-id'] === userId) ||
      (userEmail && sandbox.labels && sandbox.labels['neural-weights/user-email'] === userEmail) ||
      (sandbox.name && sandbox.name.includes(userId.substring(0, 8))) ||
      (sandbox.createdBy === userId || sandbox.owner === userId)
    );

    if (!isOwner) {
      return res.status(403).json({ error: 'Access denied to this sandbox' });
    }

    // Start the sandbox
    const startResponse = await fetch(`${daytonaService.baseUrl}/sandbox/${sandboxId}/start`, {
      method: 'POST',
      headers
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      throw new Error(`Failed to start sandbox: ${startResponse.status} - ${errorText}`);
    }

    console.log(`Sandbox ${sandboxId} start command sent successfully`);

    // Update user data with sandbox activity
    try {
      await updateUserData(userId, {
        lastSandboxActivity: new Date().toISOString(),
        sandboxState: 'starting'
      }, { merge: true });
    } catch (firestoreError) {
      console.warn('Firestore update failed (non-blocking):', firestoreError.message);
    }

    // Wait a moment and check status
    await new Promise(resolve => setTimeout(resolve, 2000));

    const statusResponse = await fetch(`${daytonaService.baseUrl}/sandbox/${sandboxId}`, {
      method: 'GET',
      headers
    });

    let currentStatus = 'starting';
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      currentStatus = statusData.state || 'starting';
    }

    return res.status(200).json({
      success: true,
      message: 'Sandbox start command sent successfully',
      sandbox: {
        id: sandboxId,
        name: sandbox.name,
        state: currentStatus,
        snapshot: sandbox.snapshot
      },
      status: currentStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sandbox start error:', error);
    return res.status(500).json({ 
      error: 'Failed to start sandbox',
      details: error.message 
    });
  }
}
