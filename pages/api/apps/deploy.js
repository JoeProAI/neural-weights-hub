import { appDeploymentService } from '../../../lib/app-deployment';
import { verifyIdToken } from '../../../lib/auth';
import { db } from '../../../lib/firebase';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    // Get user's subscription plan
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const plan = userData.subscriptionPlan || 'free';

    const { appName, modelType, appType, customCode, requirements } = req.body;

    // Validate inputs
    if (!appName || !modelType || !appType) {
      return res.status(400).json({ error: 'App name, model type, and app type required' });
    }

    // Check model access based on plan
    if (modelType === 'gpt-120b' && !['pro', 'team', 'enterprise'].includes(plan)) {
      return res.status(403).json({ 
        error: 'GPT-120B requires Pro plan or higher',
        upgradeUrl: '/pricing'
      });
    }

    // Check deployment limits
    const deploymentLimits = {
      'free': 1,
      'pro': 5,
      'team': 20,
      'enterprise': -1 // unlimited
    };

    const userDeployments = userData.deployments || [];
    const limit = deploymentLimits[plan];
    
    if (limit !== -1 && userDeployments.length >= limit) {
      return res.status(403).json({
        error: `Plan limit reached. ${plan} plan allows ${limit} deployments.`,
        upgradeUrl: '/pricing'
      });
    }

    // Generate app code based on template or use custom code
    let appCode;
    if (customCode) {
      appCode = customCode;
    } else {
      const template = appDeploymentService.generateAppTemplate(modelType, appType);
      appCode = template;
    }

    // Deploy the app
    const deployment = await appDeploymentService.deployUserApp(userId, {
      appName,
      modelType,
      appCode,
      requirements: requirements || 'flask==2.3.3\nrequests==2.31.0',
      plan
    });

    // Store deployment info in Firestore
    await setDoc(doc(db, 'deployments', deployment.deploymentId), {
      userId: userId,
      appName: appName,
      modelType: modelType,
      appType: appType,
      deploymentId: deployment.deploymentId,
      appUrl: deployment.appUrl,
      status: 'deploying',
      plan: plan,
      createdAt: new Date(),
      estimatedCost: deployment.estimatedCost
    });

    // Update user's deployment count
    await updateDoc(doc(db, 'users', userId), {
      deployments: [...userDeployments, deployment.deploymentId],
      'usage.deployments': increment(1)
    });

    res.status(200).json({
      success: true,
      deployment: {
        id: deployment.deploymentId,
        appName: appName,
        appUrl: deployment.appUrl,
        status: 'deploying',
        modelType: modelType,
        estimatedCost: deployment.estimatedCost,
        message: 'App is being deployed. It will be available in 2-3 minutes.'
      }
    });

  } catch (error) {
    console.error('Error deploying app:', error);
    res.status(500).json({ error: 'Failed to deploy app' });
  }
}
