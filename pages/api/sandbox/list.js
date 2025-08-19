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
      return false;
    });

    // Sort by creation date (newest first)
    userSandboxes.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.status(200).json({
      success: true,
      sandboxes: userSandboxes.map(sb => ({
        id: sb.id,
        name: sb.name || 'Unnamed Sandbox',
        state: sb.state,
        createdAt: sb.createdAt,
        snapshot: sb.snapshot,
        volumes: sb.volumes || [],
        resources: {
          cpu: sb.cpu,
          memory: sb.memory,
          disk: sb.disk
        }
      })),
      total: userSandboxes.length,
      limits: {
        maxSandboxes: 10, // Typical Daytona limit
        currentCount: userSandboxes.length
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
