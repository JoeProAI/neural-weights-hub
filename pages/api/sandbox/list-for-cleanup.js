import { DaytonaService } from '../../../lib/daytona.js';
import { verifyUserToken } from '../../../lib/firebase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Filter user sandboxes
    const userSandboxes = allSandboxes.filter(sb => {
      if (sb.env && sb.env['NEURAL_WEIGHTS_USER_ID'] === userId) return true;
      if (sb.labels && sb.labels['neural-weights/user-id'] === userId) return true;
      if (userEmail && sb.labels && sb.labels['neural-weights/user-email'] === userEmail) return true;
      if (sb.name && sb.name.includes(userId.substring(0, 8))) return true;
      if (sb.createdBy === userId || sb.owner === userId) return true;
      return false;
    });

    // Protected sandboxes that should never be deleted
    const protectedSandboxes = [
      '2a4c567a-5375-4a47-b356-68bbf5381930', // GPT-20B production
      'f8bf5d41-f332-4d69-b527-2636e4d5b897', // GPT-120B production
      'f93ec1b4-09cb-4f42-b1ba-f5602295c790', // GPT-20B production (new)
      '25dab552-6c1d-4c86-905e-0478ba544b71'  // GPT-120B production (new)
    ];

    // Categorize sandboxes for user selection
    const categorizedSandboxes = userSandboxes.map(sb => {
      const isProtected = protectedSandboxes.includes(sb.id);
      const age = sb.createdAt ? Math.floor((Date.now() - new Date(sb.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      return {
        id: sb.id,
        name: sb.name || 'Unnamed Sandbox',
        state: sb.state,
        snapshot: sb.snapshot,
        createdAt: sb.createdAt,
        age: `${age} days old`,
        isProtected: isProtected,
        canDelete: !isProtected && sb.state !== 'STARTED',
        reason: isProtected ? 'Production server' : 
                sb.state === 'STARTED' ? 'Currently running' : 
                'Available for cleanup',
        previewUrl: `https://22222-${sb.id}.proxy.daytona.work`,
        resources: sb.resources || { cpu: 'Unknown', memory: 'Unknown', disk: 'Unknown' }
      };
    });

    // Sort by creation date (newest first)
    categorizedSandboxes.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.status(200).json({
      success: true,
      sandboxes: categorizedSandboxes,
      summary: {
        total: categorizedSandboxes.length,
        running: categorizedSandboxes.filter(sb => sb.state === 'STARTED').length,
        stopped: categorizedSandboxes.filter(sb => sb.state === 'STOPPED').length,
        protected: categorizedSandboxes.filter(sb => sb.isProtected).length,
        canDelete: categorizedSandboxes.filter(sb => sb.canDelete).length
      }
    });

  } catch (error) {
    console.error('List sandboxes error:', error);
    return res.status(500).json({ 
      error: 'Failed to list sandboxes',
      details: error.message 
    });
  }
}
