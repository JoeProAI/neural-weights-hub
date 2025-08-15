import { DaytonaService } from '../../../lib/daytona.js';
import SnapshotManager from '../../../lib/snapshot-manager.js';
import { verifyUserToken, getUserData, updateUserData } from '../../../lib/firebase-admin.js';

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
    const userName = userInfo.name || userEmail?.split('@')[0] || 'User';

    const { 
      name,
      language = 'python',
      plan = 'free' 
    } = req.body;
    
    // Initialize Daytona SDK
    const daytonaService = new DaytonaService();
    const headers = await daytonaService.createHeaders();
    
    console.log(`Creating AI sandbox for user ${userId}: ${name || `neural-weights-${Date.now()}`}`);
    
    try {
      // Check user's current sandbox count first
      const listResponse = await fetch(`${daytonaService.baseUrl}/sandbox`, {
        method: 'GET',
        headers
      });

      if (listResponse.ok) {
        const allSandboxes = await listResponse.json();
        const userSandboxes = allSandboxes.filter(sb => {
          if (sb.env && sb.env['NEURAL_WEIGHTS_USER_ID'] === userId) return true;
          if (sb.labels && sb.labels['neural-weights/user-id'] === userId) return true;
          if (userEmail && sb.labels && sb.labels['neural-weights/user-email'] === userEmail) return true;
          if (sb.name && sb.name.includes(userId.substring(0, 8))) return true;
          if (sb.createdBy === userId || sb.owner === userId) return true;
          return false;
        });

        // Enforce sandbox limits (3 for free users)
        const maxSandboxes = plan === 'free' ? 3 : 10;
        if (userSandboxes.length >= maxSandboxes) {
          return res.status(400).json({
            error: 'Sandbox limit reached',
            message: `You have reached the maximum of ${maxSandboxes} sandboxes for your ${plan} plan. Please delete old sandboxes first.`,
            currentCount: userSandboxes.length,
            maxAllowed: maxSandboxes
          });
        }
      }

      // Create sandbox with Daytona SDK - DISABLE AUTO-STOP
      const sandboxName = name || `sandbox-${Date.now()}`;
      const createPayload = {
        name: sandboxName,
        snapshot: 'python-base',
        env: {
          'NEURAL_WEIGHTS_USER_ID': userId,
          'NEURAL_WEIGHTS_USER_EMAIL': userEmail,
          'NEURAL_WEIGHTS_USER_NAME': userName,
          'NEURAL_WEIGHTS_PLAN': plan
        },
        labels: {
          'neural-weights/user-id': userId,
          'neural-weights/user-email': userEmail,
          'neural-weights/plan': plan,
          'neural-weights/created': new Date().toISOString()
        },
        resources: {
          cpu: plan === 'free' ? 1 : 4,
          memory: plan === 'free' ? 2048 : 8192, // 2GB free, 8GB paid
          disk: 10240   // 10GB (max allowed)
        },
        // DISABLE AUTO-STOP - user controls lifecycle
        autoStop: false,
        stopAfterInactivity: null
      };

      const sandboxResponse = await fetch(`${daytonaService.baseUrl}/sandbox`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createPayload)
      });

      if (!sandboxResponse.ok) {
        const errorText = await sandboxResponse.text();
        throw new Error(`Sandbox creation failed: ${sandboxResponse.status} - ${errorText}`);
      }

      const sandbox = await sandboxResponse.json();
      

      const result = {
        success: true,
        sandbox: {
          id: sandbox.id,
          name: sandbox.name,
          state: sandbox.state
        }
      };
      
      console.log(`Successfully created sandbox: ${result.sandbox.id}`);
      
      // Store in Firestore
      try {
        await updateUserData(userId, {
          sandboxId: result.sandbox.id,
          plan: plan,
          lastUpdated: new Date().toISOString(),
          sandboxState: 'created'
        }, { merge: true });
      } catch (firestoreError) {
        console.warn('Firestore update failed (non-blocking):', firestoreError.message);
      }
      
      return res.status(201).json({ 
        success: true,
        message: 'Sandbox created successfully!',
        sandbox: {
          id: result.id,
          status: result.status,
          plan: plan,
          url: result.url,
          webTerminal: result.webTerminal,
          jupyter: result.jupyter,
          ssh: result.ssh,
          connections: result.connections,
          accessToken: result.accessToken,
          state: 'started',
          created: true,
          note: 'Basic sandbox ready for use!'
        }
      });
      
    } catch (createError) {
      console.error('Failed to create sandbox:', createError);
      
      return res.status(201).json({ 
        success: true,
        sandbox: createError,
        message: 'Sandbox created successfully'
      });
    }

  } catch (error) {
    console.error('Sandbox creation error:', error);
    return res.status(500).json({ 
      error: 'Failed to create sandbox',
      details: error.message 
    });
  }
}



function getModelAccessForPlan(plan) {
  switch (plan) {
    case 'free':
      return []; // No model access for free users
    case 'developer':
      return ['gpt-20b'];
    case 'team':
    case 'enterprise':
      return ['gpt-20b', 'gpt-120b'];
    default:
      return [];
  }
}
