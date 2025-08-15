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

    const daytona = new DaytonaService();
    const headers = await daytona.createHeaders();

    // Get all sandboxes
    const response = await fetch(`${daytona.baseUrl}/sandbox`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to list sandboxes: ${response.status}`);
    }

    const allSandboxes = await response.json();

    // Filter user sandboxes - use broader matching like connect.js
    const userSandboxes = allSandboxes.filter(sb => {
      if (sb.env && sb.env['NEURAL_WEIGHTS_USER_ID'] === userId) return true;
      if (sb.labels && sb.labels['neural-weights/user-id'] === userId) return true;
      if (userEmail && sb.labels && sb.labels['neural-weights/user-email'] === userEmail) return true;
      if (sb.name && sb.name.includes(userId.substring(0, 8))) return true;
      if (sb.createdBy === userId || sb.owner === userId) return true;
      return false;
    });

    // Find sandboxes to cleanup - SELECTIVE CLEANUP
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // NEVER delete production servers or important sandboxes
    const protectedSandboxes = [
      '2a4c567a-5375-4a47-b356-68bbf5381930', // GPT-20B production
      'f8bf5d41-f332-4d69-b527-2636e4d5b897'  // GPT-120B production
    ];

    let sandboxesToCleanup = userSandboxes.filter(sb => {
      // Never delete protected sandboxes
      if (protectedSandboxes.includes(sb.id)) return false;
      
      // Never delete running sandboxes
      if (sb.state === 'STARTED') return false;
      
      // Only delete old stopped sandboxes (7+ days old)
      const createdAt = new Date(sb.createdAt || 0);
      return createdAt < sevenDaysAgo && sb.state === 'STOPPED';
    });

    const cleanupResults = [];

    // Delete old sandboxes
    for (const sandbox of sandboxesToCleanup) {
      try {
        const deleteResponse = await fetch(`${daytona.baseUrl}/sandbox/${sandbox.id}`, {
          method: 'DELETE',
          headers
        });

        if (deleteResponse.ok) {
          cleanupResults.push({
            id: sandbox.id,
            name: sandbox.name || 'Unnamed',
            status: 'deleted',
            createdAt: sandbox.createdAt
          });
        } else {
          cleanupResults.push({
            id: sandbox.id,
            name: sandbox.name || 'Unnamed',
            status: 'failed',
            error: `HTTP ${deleteResponse.status}`
          });
        }
      } catch (error) {
        cleanupResults.push({
          id: sandbox.id,
          name: sandbox.name || 'Unnamed',
          status: 'error',
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Cleaned up ${cleanupResults.filter(r => r.status === 'deleted').length} old sandboxes`,
      results: cleanupResults,
      remaining: userSandboxes.length - sandboxesToCleanup.length,
      criteria: 'Deleted sandboxes older than 7 days and stopped (protected production servers preserved)'
    });

  } catch (error) {
    console.error('Cleanup sandboxes error:', error);
    return res.status(500).json({ 
      error: 'Failed to cleanup sandboxes',
      details: error.message 
    });
  }
}
