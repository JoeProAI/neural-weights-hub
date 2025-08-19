import { verifyUserToken } from '../../../lib/firebase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.authorization;
    if (authHeader) {
      await verifyUserToken(authHeader);
    }

    const start = Date.now();
    
    const servers = [
      { 
        name: 'GPT-20B Production Server', 
        id: process.env.DAYTONA_GPT_20B_SANDBOX_ID,
        endpoint: `https://22222-${process.env.DAYTONA_GPT_20B_SANDBOX_ID}.proxy.daytona.work`,
        model: 'gpt-20b',
        plan: 'free'
      },
      { 
        name: 'GPT-120B Production Server', 
        id: process.env.DAYTONA_GPT_120B_SANDBOX_ID,
        endpoint: `https://22222-${process.env.DAYTONA_GPT_120B_SANDBOX_ID}.proxy.daytona.work`,
        model: 'gpt-120b', 
        plan: 'paid'
      }
    ];

    const healthChecks = await Promise.all(
      servers.map(async (server) => {
        const checkStart = Date.now();
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(`${server.endpoint}/health`, { 
            signal: controller.signal,
            headers: { 
              'x-daytona-preview-token': process.env.DAYTONA_PREVIEW_TOKEN || 'default-token'
            }
          });
          
          clearTimeout(timeoutId);
          
          return {
            ...server,
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime: Date.now() - checkStart,
            statusCode: response.status,
            lastChecked: new Date().toISOString()
          };
        } catch (error) {
          return { 
            ...server, 
            status: error.name === 'AbortError' ? 'timeout' : 'offline', 
            error: error.message,
            responseTime: Date.now() - checkStart,
            lastChecked: new Date().toISOString()
          };
        }
      })
    );

    const overallStatus = healthChecks.every(s => s.status === 'healthy') ? 'healthy' : 'degraded';
    const healthyCount = healthChecks.filter(s => s.status === 'healthy').length;

    return res.json({ 
      status: overallStatus,
      servers: healthChecks, 
      summary: {
        total: servers.length,
        healthy: healthyCount,
        degraded: servers.length - healthyCount
      },
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - start
    });

  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({ 
      status: 'error',
      error: 'Health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
