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

    // Initialize Daytona service
    const daytonaService = new DaytonaService();
    const headers = await daytonaService.createHeaders();

    console.log(`Refreshing sandboxes for user ${userId}`);

    // Get ALL sandboxes directly from Daytona API
    const response = await fetch(`${daytonaService.baseUrl}/sandbox`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to list sandboxes: ${response.status} ${response.statusText}`);
    }

    const allSandboxes = await response.json();
    console.log(`Found ${allSandboxes.length} total sandboxes`);
    
    // Filter sandboxes that belong to this user with comprehensive matching
    const userSandboxes = allSandboxes.filter(sb => {
      // Check environment variables
      if (sb.env && sb.env['NEURAL_WEIGHTS_USER_ID'] === userId) return true;
      
      // Check labels
      if (sb.labels && sb.labels['neural-weights/user-id'] === userId) return true;
      if (userEmail && sb.labels && sb.labels['neural-weights/user-email'] === userEmail) return true;
      
      // Check name contains user ID substring
      if (sb.name && sb.name.includes(userId.substring(0, 8))) return true;
      
      // Check ownership fields
      if (sb.createdBy === userId || sb.owner === userId) return true;
      
      return false;
    });

    console.log(`Found ${userSandboxes.length} user sandboxes`);

    // Enhanced sandbox data with additional metadata
    const enhancedSandboxes = userSandboxes.map(sb => {
      // Determine if this is a protected production server
      const isProtected = (
        sb.id === process.env.DAYTONA_GPT_20B_SANDBOX_ID ||
        sb.id === process.env.DAYTONA_GPT_120B_SANDBOX_ID ||
        (sb.labels && sb.labels['neural-weights/type'] === 'production-server') ||
        (sb.name && (sb.name.includes('gpt-20b') || sb.name.includes('gpt-120b')))
      );

      // Determine if sandbox can be deleted (not protected and not currently starting/stopping)
      const canDelete = !isProtected && !['STARTING', 'STOPPING'].includes(sb.state);

      return {
        id: sb.id,
        name: sb.name || 'Unnamed Sandbox',
        state: sb.state || 'UNKNOWN',
        createdAt: sb.createdAt,
        snapshot: sb.snapshot,
        volumes: sb.volumes || [],
        resources: {
          cpu: sb.cpu || 'Unknown',
          memory: sb.memory || 'Unknown',
          disk: sb.disk || 'Unknown'
        },
        isProtected,
        canDelete,
        previewUrl: `https://22222-${sb.id}.proxy.daytona.work`,
        labels: sb.labels || {},
        env: sb.env || {}
      };
    });

    // Sort by creation date (newest first)
    enhancedSandboxes.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Calculate summary statistics
    const summary = enhancedSandboxes.reduce((acc, sb) => {
      acc.total++;
      if (sb.state === 'STARTED') acc.running++;
      if (sb.state === 'STOPPED') acc.stopped++;
      if (sb.isProtected) acc.protected++;
      return acc;
    }, { total: 0, running: 0, stopped: 0, protected: 0 });

    return res.status(200).json({
      success: true,
      sandboxes: enhancedSandboxes,
      summary,
      limits: {
        maxSandboxes: 10, // Typical Daytona limit
        currentCount: enhancedSandboxes.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Refresh sandboxes error:', error);
    return res.status(500).json({ 
      error: 'Failed to refresh sandboxes',
      details: error.message 
    });
  }
}
