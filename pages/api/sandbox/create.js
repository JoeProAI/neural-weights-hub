import { DaytonaService } from '../../../lib/daytona.js';
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
    const userName = userInfo.name || userEmail;

    const { 
      name,
      language = 'python',
      plan = 'free' 
    } = req.body;
    
    // Initialize Daytona SDK
    const daytonaService = new DaytonaService();
    const headers = await daytonaService.createHeaders();
    console.log(`Creating sandbox for user ${userId} with plan: ${plan}`);
      
    // Get user's current sandboxes to check limits
    const response = await fetch(`${daytonaService.baseUrl}/sandbox`, {
      method: 'GET',
      headers
    });

    if (response.ok) {
      const allSandboxes = await response.json();
      const userSandboxes = allSandboxes.filter(sb => {
        if (sb.env && sb.env['NEURAL_WEIGHTS_USER_ID'] === userId) return true;
        if (sb.labels && sb.labels['neural-weights/user-id'] === userId) return true;
        if (userEmail && sb.labels && sb.labels['neural-weights/user-email'] === userEmail) return true;
        return false;
      });

      const maxSandboxes = plan === 'free' ? 2 : 10;
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
      const sandboxName = name;
      
      // Determine snapshot based on user plan
      let snapshotName;
      if (plan === 'free') {
        snapshotName = null; // Free users get default environment (no snapshot)
      } else {
        snapshotName = 'gpt-20b-production-snapshot'; // Paid users get 20B model access
      }

      const createPayload = {
        name: sandboxName,
        ...(snapshotName && { snapshot: snapshotName }),
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
          'neural-weights/created': new Date().toISOString(),
          'neural-weights/auto-stop': 'disabled'
        },
        resources: {
          cpu: plan === 'free' ? 1 : 4,
          memory: plan === 'free' ? 1024 : 8192, // 1GB free, 8GB paid
          disk: plan === 'free' ? 5120 : 10240   // 5GB free, 10GB paid
        },
        // CRITICAL: DISABLE AUTO-STOP - sandboxes run persistently
        autoStop: 0,
        autoArchive: 0,
        autoDelete: -1,
        // Additional settings to ensure persistence
        settings: {
          autoStop: false,
          autoArchive: false,
          autoDelete: false
        }
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
          id: sandbox.id,
          name: sandbox.name,
          state: sandbox.state,
          snapshot: snapshotName || 'default',
          plan: plan,
          created: true,
          previewUrl: `https://22222-${sandbox.id}.proxy.daytona.work`,
          note: plan === 'free' ? 'Basic development environment ready!' : 'Production sandbox with GPT model access ready!'
        }
      });
      
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
