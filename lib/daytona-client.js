// Daytona Client for Neural Weights Hub
export class DaytonaClient {
  constructor() {
    this.apiKey = process.env.DAYTONA_API_KEY;
    this.orgId = process.env.DAYTONA_ORG_ID;
    this.baseUrl = process.env.DAYTONA_API_URL || 'https://app.daytona.io/api';
  }

  async createHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Daytona-Organization-ID': this.orgId,
      'Content-Type': 'application/json'
    };
  }

  async getSandbox(sandboxId) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandbox/${sandboxId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to get sandbox: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting sandbox:', error);
      throw error;
    }
  }

  async createSandbox(config) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandbox`, {
        method: 'POST',
        headers,
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`Failed to create sandbox: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating sandbox:', error);
      throw error;
    }
  }

  async executeCommand(sandboxId, command) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandbox/${sandboxId}/execute`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          command,
          timeout: 30000
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to execute command: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing command:', error);
      return { output: `Error: ${error.message}`, exitCode: 1 };
    }
  }

  async startSandbox(sandboxId) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandbox/${sandboxId}/start`, {
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

  async stopSandbox(sandboxId) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandbox/${sandboxId}/stop`, {
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

  async deleteSandbox(sandboxId) {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandbox/${sandboxId}`, {
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

  async listSandboxes() {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandbox`, {
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
}
