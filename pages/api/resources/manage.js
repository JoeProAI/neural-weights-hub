import { ResourceManager } from '../../../lib/resource-manager.js';
import { verifyFirebaseToken } from '../../../lib/auth.js';

const resourceManager = new ResourceManager();

export default async function handler(req, res) {
  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decodedToken = await verifyFirebaseToken(token);
    const userId = decodedToken.uid;

    const { action } = req.body;

    switch (action) {
      case 'create':
        const { subscriptionPlan } = req.body;
        const environment = await resourceManager.createUserEnvironment(userId, subscriptionPlan);
        return res.json({ success: true, environment });

      case 'start':
        const startResult = await resourceManager.startUserResources(userId);
        await resourceManager.trackUsage(userId, 'sandbox_hour', 0.1); // Track startup
        return res.json({ success: true, result: startResult });

      case 'stop':
        const stopResult = await resourceManager.stopUserResources(userId);
        return res.json({ success: true, result: stopResult });

      case 'status':
        const resources = await resourceManager.getUserResources(userId);
        if (!resources) {
          return res.status(404).json({ error: 'No resources found' });
        }
        
        // Get real-time status from Daytona
        const sandboxStatus = await resourceManager.daytona.getSandboxStatus(resources.sandboxId);
        
        return res.json({
          success: true,
          resources: {
            ...resources,
            realTimeStatus: sandboxStatus.status,
            uptime: sandboxStatus.uptime
          }
        });

      case 'deploy':
        const { appConfig } = req.body;
        const deployment = await resourceManager.deployUserApplication(userId, appConfig);
        await resourceManager.trackUsage(userId, 'deployment');
        return res.json({ success: true, deployment });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Resource management error:', error);
    return res.status(500).json({ error: error.message });
  }
}
