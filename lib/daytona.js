// Production-Compatible Daytona Service - Leverage your $20k credits
export class DaytonaService {
  constructor() {
    this.apiKey = process.env.DAYTONA_API_KEY;
    this.orgId = process.env.DAYTONA_ORG_ID;
    this.baseUrl = process.env.DAYTONA_SERVER_URL || 'https://app.daytona.io/api';
    
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
  async createUserSandbox(userId, plan, userEmail = null, userName = null) {
    try {
      const headers = await this.createHeaders();
      
      // Generate unique identifier
      const timestamp = Date.now();
      const shortId = userId.slice(0, 8);
      const uniqueId = `${shortId}-${timestamp}`;
      
      // Clean user name for labels (remove special characters)
      const cleanUserName = userName ? userName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase() : 'user';
      const cleanEmail = userEmail ? userEmail.split('@')[0].replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase() : 'unknown';
      
      // Create sandbox using REST API (with timeout to prevent 504 errors)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${this.baseUrl}/sandbox`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          name: `neural-weights-${cleanUserName}-${shortId}`,
          snapshot: 'daytonaio/sandbox:0.4.3',
          target: 'us',
          labels: {
            'neural-weights/user-id': userId,
            'neural-weights/user-email': cleanEmail,
            'neural-weights/user-name': cleanUserName,
            'neural-weights/plan': plan,
            'neural-weights/created': new Date().toISOString(),
            'neural-weights/unique-id': uniqueId,
            'neural-weights/platform': 'production',
            'code-toolbox-language': 'python'
          },
          envVars: {
            'NEURAL_WEIGHTS_USER_ID': userId,
            'NEURAL_WEIGHTS_USER_EMAIL': userEmail || 'unknown',
            'NEURAL_WEIGHTS_USER_NAME': userName || 'User',
            'NEURAL_WEIGHTS_PLAN': plan,
            'NEURAL_WEIGHTS_UNIQUE_ID': uniqueId,
            'GPT_20B_ENDPOINT': 'https://joe-9--neural-weights-hub-gpt-20b-inference.modal.run',
            'GPT_120B_ENDPOINT': 'https://joe-9--neural-weights-hub-gpt-120b-inference.modal.run',
            'NODE_ENV': 'production'
          }
        })
      });

      // Clear the timeout since request completed
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Daytona API Error Details:');
        console.error('- URL:', `${this.baseUrl}/sandbox`);
        console.error('- Method: POST');
        console.error('- Headers:', JSON.stringify(headers, null, 2));
        console.error('- Error:', errorText);
        
        // If it's a fetch error, try to get response details
        if (response) {
          console.error('- Response Status:', response.status);
          console.error('- Response Headers:', response.headers);
        }
        
        // Handle non-JSON responses - provide more specific error
        if (errorText.includes('JSON') || errorText.includes('Unexpected token')) {
          console.error('- This appears to be a JSON parsing error, likely due to non-JSON response from Daytona API');
          console.error('- The API may be returning HTML error page instead of JSON');
          
          // Extract the actual error from the JSON parse error message
          const match = errorText.match(/Unexpected token .+?, "(.+?)"/);
          const actualError = match ? match[1] : 'Unknown API error';
          
          throw new Error(`Daytona API Error: ${actualError}. This may be due to resource limits, authentication issues, or API constraints.`);
        }
        
        throw new Error(`Daytona API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      let sandbox;
      const responseText = await response.text();
      try {
        sandbox = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Failed to parse Daytona API response as JSON:', {
          status: response.status,
          responseText: responseText,
          jsonError: jsonError.message
        });
        throw new Error(`Daytona API returned non-JSON response: ${responseText}`);
      }

      // Return sandbox with consistent structure
      return {
        id: sandbox.id,
        status: 'ready',
        url: `https://app.daytona.io/sandbox/${sandbox.id}`,
        name: `neural-weights-${userId.slice(0, 8)}`,
        plan: plan,
        createdAt: new Date().toISOString(),
        daytonaResponse: sandbox // Keep reference to full Daytona response
      };
    } catch (error) {
      console.error('Error creating user sandbox:', error);
      throw error;
    }
  }

  // List user's existing sandboxes
  async listUserSandboxes(userId) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandbox`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to list sandboxes: ${response.status} ${response.statusText}`);
      }

      const sandboxes = await response.json();
      
      // First try to find Neural Weights labeled sandboxes
      const neuralWeightsSandboxes = sandboxes.filter(sandbox => 
        sandbox.labels && 
        sandbox.labels['neural-weights/user-id'] === userId
      );

      // If we have Neural Weights sandboxes, return those
      if (neuralWeightsSandboxes.length > 0) {
        return neuralWeightsSandboxes;
      }

      // Otherwise, return ALL sandboxes for instant connection
      // (User needs immediate access to any running sandbox)
      console.log('No Neural Weights sandboxes found, returning all sandboxes for instant connection');
      return sandboxes;
    } catch (error) {
      console.error('Error listing user sandboxes:', error);
      throw error;
    }
  }

  // Start a stopped sandbox
  async startSandbox(sandboxId) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandbox/${sandboxId}/start`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start sandbox: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return { success: true, message: 'Sandbox starting' };
    } catch (error) {
      console.error('Error starting sandbox:', error);
      throw error;
    }
  }

  // Delete a sandbox
  async deleteSandbox(sandboxId) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandbox/${sandboxId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete sandbox: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return { success: true, message: 'Sandbox deleted' };
    } catch (error) {
      console.error('Error deleting sandbox:', error);
      throw error;
    }
  }

  // Create snapshot from sandbox
  async createSnapshot(sandboxId, snapshotName) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandbox/${sandboxId}/snapshot`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: snapshotName
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create snapshot: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating snapshot:', error);
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
      const response = await fetch(`${this.baseUrl}/sandbox/${sandboxId}`, {
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

  // Stop user's sandbox (for free tier auto-stop)
  async stopSandbox(sandboxId) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandbox/${sandboxId}/stop`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to stop sandbox: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return { success: true, message: 'Sandbox stopping' };
    } catch (error) {
      console.error('Error stopping sandbox:', error);
      throw error;
    }
  }
}

export const daytonaService = new DaytonaService();
