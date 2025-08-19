import { DaytonaService } from '../../../lib/daytona.js';
import { verifyUserToken, getUserData } from '../../../lib/firebase-admin.js';

const daytonaService = new DaytonaService();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.authorization;
    const userInfo = await verifyUserToken(authHeader);
    const userId = userInfo.userId;

    // Get user's sandbox info from Firestore
    const userData = await getUserData(userId);
    const sandboxId = userData?.sandboxId;

    if (!sandboxId) {
      return res.status(200).json({ 
        sandbox: null,
        message: 'No sandbox found for user'
      });
    }

    // Get sandbox status from Daytona API
    const headers = await daytonaService.createHeaders();
    const response = await fetch(`${daytonaService.baseUrl}/sandbox/${sandboxId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to get sandbox status: ${response.status}`);
    }

    const sandbox = await response.json();
    
    // Check if preview is accessible
    const previewUrl = `https://22222-${sandboxId}.proxy.daytona.work`;
    let previewStatus = 'unknown';
    
    try {
      const previewResponse = await fetch(previewUrl, {
        method: 'HEAD',
        timeout: 3000,
        headers: { 'x-daytona-preview-token': process.env.DAYTONA_PREVIEW_TOKEN || 'default' }
      });
      previewStatus = previewResponse.ok ? 'accessible' : 'inaccessible';
    } catch (error) {
      previewStatus = 'offline';
    }

    // Get usage data from user data
    const usage = {
      apiCalls: userData?.totalApiCalls || 0,
      sandboxHours: userData?.sandboxHours || 0,
      storageGB: userData?.storageGB || 0,
      estimatedCost: userData?.estimatedCost || 0
    };

    res.status(200).json({
      success: true,
      sandbox: {
        id: sandbox.id,
        name: sandbox.name,
        state: sandbox.state,
        snapshot: sandbox.snapshot,
        previewUrl: previewUrl,
        previewStatus: previewStatus,
        accessible: previewStatus === 'accessible',
        resources: sandbox.resources,
        createdAt: sandbox.createdAt
      },
      usage: usage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting sandbox status:', error);
    res.status(500).json({ 
      error: 'Failed to get sandbox status',
      details: error.message 
    });
  }
}
