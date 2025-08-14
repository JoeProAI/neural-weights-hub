import { verifyIdToken } from '../../../lib/auth';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { appDeploymentService } from '../../../lib/app-deployment';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user's deployments from Firestore
    const deploymentsQuery = query(
      collection(db, 'deployments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const deploymentsSnapshot = await getDocs(deploymentsQuery);
    const deployments = [];

    // Get current status for each deployment
    for (const doc of deploymentsSnapshot.docs) {
      const deploymentData = doc.data();
      
      try {
        // Get real-time status from Daytona
        const status = await appDeploymentService.getDeploymentStatus(deploymentData.deploymentId);
        
        deployments.push({
          id: deploymentData.deploymentId,
          appName: deploymentData.appName,
          modelType: deploymentData.modelType,
          appType: deploymentData.appType,
          appUrl: status.appUrl,
          status: status.status,
          estimatedCost: deploymentData.estimatedCost,
          createdAt: deploymentData.createdAt,
          uptime: status.uptime
        });
      } catch (error) {
        // If we can't get status, use stored data
        deployments.push({
          id: deploymentData.deploymentId,
          appName: deploymentData.appName,
          modelType: deploymentData.modelType,
          appType: deploymentData.appType,
          appUrl: deploymentData.appUrl,
          status: 'unknown',
          estimatedCost: deploymentData.estimatedCost,
          createdAt: deploymentData.createdAt
        });
      }
    }

    res.status(200).json({
      deployments,
      totalDeployments: deployments.length
    });

  } catch (error) {
    console.error('Error listing deployments:', error);
    res.status(500).json({ error: 'Failed to list deployments' });
  }
}
