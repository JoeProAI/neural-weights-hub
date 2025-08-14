// Real Daytona API Service - Leverage your $20k credits
export class DaytonaService {
  constructor() {
    this.apiKey = process.env.DAYTONA_API_KEY;
    this.orgId = process.env.DAYTONA_ORG_ID;
    this.baseUrl = 'https://api.daytona.io';
    
    // Pre-created volumes for models
    this.volumes = {
      'gpt-20b': process.env.DAYTONA_GPT_20B_VOLUME_ID || '3d7e7067-1bc1-4094-aaff-9d165fe153e4',
      'gpt-120b': process.env.DAYTONA_GPT_120B_VOLUME_ID || '612103f9-101c-4701-8a33-11f70ab58b1d'
    };
  }

  async createHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Daytona-Organization-ID': this.orgId,
      'Content-Type': 'application/json'
    };
  }

  // Create user's personal sandbox with access to GPT models
  async createUserSandbox(userId, plan) {
    try {
      const headers = await this.createHeaders();
      
      // Determine resources based on plan
      const resources = this.getResourcesForPlan(plan);
      
      const response = await fetch(`${this.baseUrl}/sandboxes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: `neural-weights-${userId.slice(0, 8)}`,
          template: 'python-ml', // Pre-configured ML environment
          autoStop: plan === 'free' ? true : false, // Free users get auto-stop
          resources: resources,
          volumes: this.getVolumesForPlan(plan),
          environment: {
            'NEURAL_WEIGHTS_USER_ID': userId,
            'NEURAL_WEIGHTS_PLAN': plan,
            'GPT_20B_ENDPOINT': 'https://joe-9--neural-weights-hub-gpt-20b-inference.modal.run',
            'GPT_120B_ENDPOINT': 'https://joe-9--neural-weights-hub-gpt-120b-inference.modal.run'
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create sandbox: ${response.status} ${error}`);
      }

      const sandbox = await response.json();
      return sandbox;
    } catch (error) {
      console.error('Error creating user sandbox:', error);
      throw error;
    }
  }

  // Get resources based on subscription plan (Daytona limits: max 4 CPU, 8GB RAM, 10GB disk)
  getResourcesForPlan(plan) {
    const planResources = {
      'free': { cpu: 1, memory: 1, disk: 10 },      // Basic resources
      'pro': { cpu: 2, memory: 4, disk: 10 },       // Mid-tier
      'team': { cpu: 4, memory: 8, disk: 10 },      // Max CPU/RAM
      'enterprise': { cpu: 4, memory: 8, disk: 10 } // Same as team (Daytona max)
    };
    return planResources[plan] || planResources['free'];
  }

  // Get volume access based on plan
  getVolumesForPlan(plan) {
    const volumes = [];
    
    // All plans get access to GPT-20B
    volumes.push({
      volumeId: this.volumes['gpt-20b'],
      mountPath: '/models/gpt-20b',
      readOnly: true
    });
    
    // Pro+ plans get access to GPT-120B
    if (['pro', 'team', 'enterprise'].includes(plan)) {
      volumes.push({
        volumeId: this.volumes['gpt-120b'],
        mountPath: '/models/gpt-120b',
        readOnly: true
      });
    }
    
    return volumes;
  }

  // Get user's sandbox status
  async getSandboxStatus(sandboxId) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandboxes/${sandboxId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to get sandbox status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting sandbox status:', error);
      throw error;
    }
  }

  // Start user's sandbox
  async startSandbox(sandboxId) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandboxes/${sandboxId}/start`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to start sandbox: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting sandbox:', error);
      throw error;
    }
  }

  // Stop user's sandbox (for free tier auto-stop)
  async stopSandbox(sandboxId) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandboxes/${sandboxId}/stop`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to stop sandbox: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error stopping sandbox:', error);
      throw error;
    }
  }

  // Delete user's sandbox
  async deleteSandbox(sandboxId) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandboxes/${sandboxId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to delete sandbox: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting sandbox:', error);
      throw error;
    }
  }

  // Get sandbox connection info (SSH, VS Code, etc.)
  async getSandboxConnection(sandboxId) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandboxes/${sandboxId}/connection`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to get connection info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting connection info:', error);
      throw error;
    }
  }

  // List user's sandboxes
  async listUserSandboxes(userId) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandboxes?filter=neural-weights-${userId.slice(0, 8)}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to list sandboxes: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing sandboxes:', error);
      throw error;
    }
  }

  // Create snapshot of user's work
  async createSnapshot(sandboxId, snapshotName, description) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/snapshots`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: snapshotName,
          sandboxId: sandboxId,
          description: description
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create snapshot: ${response.status} ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating snapshot:', error);
      throw error;
    }
  }

  // Get usage statistics for billing
  async getSandboxUsage(sandboxId, startDate, endDate) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandboxes/${sandboxId}/usage?start=${startDate}&end=${endDate}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to get usage: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting usage:', error);
      throw error;
    }
  }
}

export const daytonaService = new DaytonaService();
