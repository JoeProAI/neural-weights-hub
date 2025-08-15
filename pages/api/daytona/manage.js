import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: require('firebase-admin').credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { action, sandboxId, snapshotName } = req.body;

    const { DaytonaService } = await import('../../../lib/daytona.js');
    const daytona = new DaytonaService();

    switch (action) {
      case 'cleanup':
        return await handleCleanup(daytona, userId, res);
      
      case 'snapshot':
        return await handleSnapshot(daytona, sandboxId, snapshotName, res);
      
      case 'connect':
        return await handleConnect(daytona, userId, res);
      
      case 'delete':
        return await handleDelete(daytona, sandboxId, res);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Daytona management error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleCleanup(daytona, userId, res) {
  try {
    const sandboxes = await daytona.listUserSandboxes(userId);
    
    // Find Neural Weights sandboxes that are stopped
    const stoppedNeuralWeights = sandboxes.filter(sb => 
      sb.labels && 
      sb.labels['neural-weights/user-id'] === userId &&
      sb.state === 'stopped'
    );

    const results = [];
    
    for (const sandbox of stoppedNeuralWeights) {
      try {
        await daytona.deleteSandbox(sandbox.id);
        results.push({
          id: sandbox.id,
          status: 'deleted',
          runnerDomain: sandbox.runnerDomain
        });
      } catch (error) {
        results.push({
          id: sandbox.id,
          status: 'error',
          error: error.message,
          runnerDomain: sandbox.runnerDomain
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Cleaned up ${results.filter(r => r.status === 'deleted').length} stopped Neural Weights sandboxes`,
      results
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleSnapshot(daytona, sandboxId, snapshotName, res) {
  try {
    const result = await daytona.createSnapshot(sandboxId, snapshotName);
    return res.status(200).json({
      success: true,
      message: `Snapshot '${snapshotName}' created for sandbox ${sandboxId}`,
      snapshot: result
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleConnect(daytona, userId, res) {
  try {
    const sandboxes = await daytona.listUserSandboxes(userId);
    
    // Find any active sandbox for instant connection
    const activeSandbox = sandboxes.find(sb => sb.state === 'started');
    
    if (activeSandbox) {
      return res.status(200).json({
        success: true,
        message: 'Connected to active sandbox',
        sandbox: {
          id: activeSandbox.id,
          status: 'ready',
          url: `https://app.daytona.io/sandbox/${activeSandbox.id}`,
          connectionUrl: `https://${activeSandbox.runnerDomain}`,
          directUrl: `https://${activeSandbox.runnerDomain}`,
          state: activeSandbox.state,
          runnerDomain: activeSandbox.runnerDomain,
          snapshot: activeSandbox.snapshot,
          volumes: activeSandbox.volumes,
          instant: true
        }
      });
    }

    return res.status(404).json({
      error: 'No active sandbox found',
      message: 'All sandboxes are currently stopped'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleDelete(daytona, sandboxId, res) {
  try {
    await daytona.deleteSandbox(sandboxId);
    return res.status(200).json({
      success: true,
      message: `Sandbox ${sandboxId} deleted successfully`
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
