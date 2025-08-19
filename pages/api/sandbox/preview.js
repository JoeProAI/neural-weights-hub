import { DaytonaService } from '../../../lib/daytona.js';
import { verifyUserToken } from '../../../lib/firebase-admin.js';

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

    console.log(`Getting preview for sandbox ${sandboxId} for user ${userId}`);

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

    // Check if sandbox is running
    if (sandbox.state !== 'STARTED') {
      return res.status(400).json({ 
        error: 'Sandbox must be running to get preview',
        state: sandbox.state,
        message: 'Please start the sandbox first'
      });
    }

    // Generate preview URL for port 22222 (VS Code/development environment)
    const previewUrl = `https://22222-${sandboxId}.proxy.daytona.work`;
    
    // Try to get auth token for preview access
    let authToken = null;
    try {
      const previewResponse = await fetch(`${daytonaService.baseUrl}/sandbox/${sandboxId}/preview`, {
        method: 'GET',
        headers
      });
      
      if (previewResponse.ok) {
        const previewData = await previewResponse.json();
        authToken = previewData.token || previewData.authToken;
      }
    } catch (previewError) {
      console.warn('Could not get preview auth token:', previewError.message);
    }

    // Test accessibility
    let accessible = false;
    try {
      const testResponse = await fetch(previewUrl, { 
        method: 'HEAD', 
        timeout: 5000,
        headers: authToken ? { 'x-daytona-preview-token': authToken } : {}
      });
      accessible = testResponse.ok;
    } catch (error) {
      console.warn('Preview URL not accessible:', error.message);
    }

    return res.status(200).json({
      success: true,
      sandbox: {
        id: sandboxId,
        name: sandbox.name,
        state: sandbox.state,
        snapshot: sandbox.snapshot
      },
      previewUrl: previewUrl,
      preview: {
        url: previewUrl,
        authToken: authToken,
        accessible: accessible,
        port: 22222,
        instructions: accessible 
          ? 'Preview is ready - click to open your development environment'
          : 'Preview is starting up - may take a few moments to become accessible'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sandbox preview error:', error);
    return res.status(500).json({ 
      error: 'Failed to get sandbox preview',
      details: error.message 
    });
  }
}
