/**
 * Snapshot Manager for Neural Weights Hub
 * Manages pre-built snapshots with proper user access and connection URLs
 */

export class SnapshotManager {
  constructor(daytonaService) {
    this.daytonaService = daytonaService;
    
    // Optimized tier-based snapshots with proper resource allocation
    this.snapshots = {
      'free': process.env.NEURAL_WEIGHTS_FREE_SNAPSHOT || 'neural-weights-free-v1',
      'pro': process.env.NEURAL_WEIGHTS_PRO_SNAPSHOT || 'neural-weights-pro-v1', 
      'team': process.env.NEURAL_WEIGHTS_TEAM_SNAPSHOT || 'neural-weights-team-v1',
      'enterprise': process.env.NEURAL_WEIGHTS_ENTERPRISE_SNAPSHOT || 'neural-weights-enterprise-v1'
    };
    
    // Fallback chain: tier snapshots -> production snapshots -> basic snapshot
    this.fallbackSnapshots = [
      'gpt-20b-production-snapshot',
      'gpt-120b-production-snapshot', 
      'daytonaio/sandbox:0.4.3'
    ];
  }

  // Create user sandbox from optimized snapshot with proper volume mounting
  async createUserSandboxFromSnapshot(userId, plan, userEmail, userName) {
    const snapshots = [
      this.snapshots[plan] || this.snapshots['free'],
      ...this.fallbackSnapshots
    ];
    
    let lastError;
    
    for (const snapshotId of snapshots) {
      try {
        console.log(`Attempting to create sandbox from snapshot: ${snapshotId}`);
        
        const headers = await this.daytonaService.createHeaders();
        
        // Generate unique identifier
        const timestamp = Date.now();
        const shortId = userId.slice(0, 8);
        const uniqueId = `${shortId}-${timestamp}`;
        
        // Clean user identifiers
        const cleanUserName = userName ? userName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase() : 'user';
        const cleanEmail = userEmail ? userEmail.split('@')[0].replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase() : 'unknown';

        // Get volumes for the plan using proper VolumeMount format
        const volumes = this.getVolumesForPlan(plan);

        const response = await fetch(`${this.daytonaService.baseUrl}/sandbox`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: `neural-weights-${cleanUserName}-${shortId}`,
            snapshot: snapshotId,
            target: 'us',
            volumes: volumes,
            labels: {
              'neural-weights/user-id': userId,
              'neural-weights/user-email': cleanEmail,
              'neural-weights/user-name': cleanUserName,
              'neural-weights/plan': plan,
              'neural-weights/created': new Date().toISOString(),
              'neural-weights/unique-id': uniqueId,
              'neural-weights/platform': 'production'
            },
            envVars: {
              'NEURAL_WEIGHTS_USER_ID': userId,
              'NEURAL_WEIGHTS_USER_EMAIL': userEmail || 'unknown',
              'NEURAL_WEIGHTS_USER_NAME': userName || 'User',
              'NEURAL_WEIGHTS_PLAN': plan,
              'NEURAL_WEIGHTS_UNIQUE_ID': uniqueId,
              'GPT_20B_ENDPOINT': 'https://joe-9--neural-weights-hub-gpt-20b-inference.modal.run',
              'GPT_120B_ENDPOINT': 'https://joe-9--neural-weights-hub-gpt-120b-inference.modal.run',
              'GPT_20B_PATH': '/home/daytona/models/gpt-20b',
              'GPT_120B_PATH': volumes.length > 1 ? '/home/daytona/models/gpt-120b' : '',
              'NODE_ENV': 'production'
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          lastError = new Error(`Snapshot ${snapshotId}: ${response.status} ${response.statusText} - ${errorText}`);
          console.log(`Failed with ${snapshotId}, trying next fallback...`);
          continue;
        }

        const sandbox = await response.json();
        console.log(`✅ Successfully created sandbox ${sandbox.id} from ${snapshotId}`);
        
        // Wait for sandbox to be ready and get connection info
        await this.waitForSandboxReady(sandbox.id);
        const connectionInfo = await this.getSandboxConnectionInfo(sandbox.id);

        return {
          id: sandbox.id,
          status: 'ready',
          plan: plan,
          snapshot: snapshotId,
          createdAt: new Date().toISOString(),
          ...connectionInfo
        };

      } catch (error) {
        lastError = error;
        console.log(`Failed with snapshot ${snapshotId}:`, error.message);
        continue;
      }
    }
    
    // If all snapshots failed, throw the last error
    throw lastError || new Error('All snapshot creation attempts failed');
  }

  // Get proper connection URLs with user access
  async getSandboxConnectionInfo(sandboxId) {
    try {
      const headers = await this.daytonaService.createHeaders();
      
      // Get sandbox details
      const sandboxResponse = await fetch(`${this.daytonaService.baseUrl}/sandbox/${sandboxId}`, {
        method: 'GET',
        headers
      });

      if (!sandboxResponse.ok) {
        throw new Error(`Failed to get sandbox details: ${sandboxResponse.status}`);
      }

      const sandbox = await sandboxResponse.json();
      const runnerDomain = sandbox.runnerDomain;

      if (!runnerDomain) {
        throw new Error('Sandbox runner domain not available');
      }

      // Generate user access token for this sandbox
      const accessToken = await this.generateUserAccessToken(sandboxId);

      return {
        url: `https://app.daytona.io/sandbox/${sandboxId}`,
        webTerminal: `https://${runnerDomain}:22222?token=${accessToken}`,
        jupyter: `https://${runnerDomain}:8888?token=${accessToken}`,
        ssh: `ssh daytona@${runnerDomain}`,
        directAccess: `https://${runnerDomain}?token=${accessToken}`,
        runnerDomain: runnerDomain,
        accessToken: accessToken,
        connections: {
          dashboard: `https://app.daytona.io/sandbox/${sandboxId}`,
          webTerminal: `https://${runnerDomain}:22222?token=${accessToken}`,
          jupyter: `https://${runnerDomain}:8888?token=${accessToken}`,
          ssh: `ssh daytona@${runnerDomain}`,
          direct: `https://${runnerDomain}?token=${accessToken}`
        }
      };

    } catch (error) {
      console.error('Error getting connection info:', error);
      // Return basic info without access tokens if detailed info fails
      return {
        url: `https://app.daytona.io/sandbox/${sandboxId}`,
        webTerminal: `https://app.daytona.io/sandbox/${sandboxId}`,
        message: 'Use Daytona dashboard for access'
      };
    }
  }

  // Generate user access token for sandbox
  async generateUserAccessToken(sandboxId) {
    try {
      const headers = await this.daytonaService.createHeaders();
      
      const response = await fetch(`${this.daytonaService.baseUrl}/sandbox/${sandboxId}/access-token`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          expiresIn: '24h',
          permissions: ['read', 'write', 'execute']
        })
      });

      if (!response.ok) {
        console.log('Access token generation failed, using basic access');
        return 'basic-access';
      }

      const result = await response.json();
      return result.token || 'basic-access';

    } catch (error) {
      console.log('Access token generation error, using basic access:', error.message);
      return 'basic-access';
    }
  }

  // Wait for sandbox to be ready
  async waitForSandboxReady(sandboxId, maxWaitTime = 120000) {
    console.log(`Waiting for sandbox ${sandboxId} to be ready...`);
    
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const headers = await this.daytonaService.createHeaders();
        const response = await fetch(`${this.daytonaService.baseUrl}/sandbox/${sandboxId}`, {
          method: 'GET',
          headers
        });

        if (response.ok) {
          const sandbox = await response.json();
          if (sandbox.state === 'started' && sandbox.runnerDomain) {
            console.log(`Sandbox ${sandboxId} is ready with domain: ${sandbox.runnerDomain}`);
            return true;
          }
          console.log(`Sandbox state: ${sandbox.state}, waiting...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      } catch (error) {
        console.log(`Still waiting for sandbox to be accessible...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    throw new Error(`Sandbox ${sandboxId} did not become ready within ${maxWaitTime/1000} seconds`);
  }

  // Add user to sandbox (for collaboration)
  async addUserToSandbox(sandboxId, userEmail, permissions = ['read']) {
    try {
      const headers = await this.daytonaService.createHeaders();
      
      const response = await fetch(`${this.daytonaService.baseUrl}/sandbox/${sandboxId}/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: userEmail,
          permissions: permissions
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add user to sandbox: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error adding user to sandbox:', error);
      throw error;
    }
  }

  // Get sandbox resources based on plan
  getResourcesForPlan(plan) {
    const planResources = {
      'free': { cpu: 1, memory: 1, disk: 10 },
      'pro': { cpu: 2, memory: 4, disk: 10 },
      'team': { cpu: 4, memory: 8, disk: 10 },
      'enterprise': { cpu: 4, memory: 8, disk: 10 }
    };
    return planResources[plan] || planResources['free'];
  }

  // Get volume access based on plan using existing Daytona volume IDs
  getVolumesForPlan(plan) {
    const volumes = [];
    
    // Use existing volume IDs from environment or known defaults
    const gpt20bVolumeId = process.env.DAYTONA_GPT_20B_VOLUME_ID || '3d7e7067-1bc1-4094-aaff-9d165fe153e4';
    const gpt120bVolumeId = process.env.DAYTONA_GPT_120B_VOLUME_ID || '612103f9-101c-4701-8a33-11f70ab58b1d';
    
    // All plans get access to GPT-20B volume
    volumes.push({
      volumeId: gpt20bVolumeId,
      mountPath: '/home/daytona/models/gpt-20b'
    });
    
    // Pro+ plans get access to GPT-120B volume
    if (['pro', 'team', 'enterprise'].includes(plan)) {
      volumes.push({
        volumeId: gpt120bVolumeId,
        mountPath: '/home/daytona/models/gpt-120b'
      });
    }
    
    return volumes;
  }

  // Get available features for plan
  getFeaturesForPlan(plan) {
    const planFeatures = {
      'free': ['web-terminal', 'ssh', 'python', 'gpt-20b'],
      'pro': ['web-terminal', 'ssh', 'python', 'jupyter', 'gpt-20b', 'gpt-120b'],
      'team': ['web-terminal', 'ssh', 'python', 'jupyter', 'gpt-20b', 'gpt-120b', 'collaboration'],
      'enterprise': ['web-terminal', 'ssh', 'python', 'jupyter', 'gpt-20b', 'gpt-120b', 'collaboration', 'priority-support']
    };
    return planFeatures[plan] || planFeatures['free'];
  }
}

export default SnapshotManager;
