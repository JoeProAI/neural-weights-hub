#!/usr/bin/env node

// Daytona Cleanup and Snapshot Management Script
// Usage: node scripts/daytona-cleanup.js [action]
// Actions: cleanup, snapshot, connect, list

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

class DaytonaManager {
  constructor() {
    this.baseUrl = process.env.DAYTONA_SERVER_URL || 'https://app.daytona.io/api';
    this.apiKey = process.env.DAYTONA_API_KEY;
    this.orgId = process.env.DAYTONA_ORG_ID;
    
    if (!this.apiKey || !this.orgId) {
      console.error('❌ Missing DAYTONA_API_KEY or DAYTONA_ORG_ID in .env.local');
      process.exit(1);
    }
  }

  async createHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-Organization-ID': this.orgId
    };
  }

  async listSandboxes() {
    try {
      const headers = await this.createHeaders();
      const response = await fetch(`${this.baseUrl}/sandbox`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to list sandboxes: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing sandboxes:', error);
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
        const errorText = await response.text();
        throw new Error(`Failed to delete sandbox: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return { success: true };
    } catch (error) {
      console.error(`Error deleting sandbox ${sandboxId}:`, error);
      throw error;
    }
  }

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

      return await response.json();
    } catch (error) {
      console.error(`Error creating snapshot for ${sandboxId}:`, error);
      throw error;
    }
  }

  async cleanup() {
    console.log('🧹 Starting Daytona cleanup...');
    
    const sandboxes = await this.listSandboxes();
    console.log(`📊 Found ${sandboxes.length} total sandboxes`);

    // Find Neural Weights sandboxes that are stopped
    const stoppedNeuralWeights = sandboxes.filter(sb => 
      sb.labels && 
      sb.labels['neural-weights/user-id'] &&
      sb.state === 'stopped'
    );

    console.log(`🎯 Found ${stoppedNeuralWeights.length} stopped Neural Weights sandboxes to clean up`);

    if (stoppedNeuralWeights.length === 0) {
      console.log('✅ No cleanup needed - no stopped Neural Weights sandboxes found');
      return;
    }

    const results = [];
    
    for (const sandbox of stoppedNeuralWeights) {
      try {
        console.log(`🗑️  Deleting sandbox ${sandbox.id} (${sandbox.runnerDomain})`);
        await this.deleteSandbox(sandbox.id);
        results.push({
          id: sandbox.id,
          status: 'deleted',
          runnerDomain: sandbox.runnerDomain
        });
        console.log(`✅ Deleted ${sandbox.id}`);
      } catch (error) {
        results.push({
          id: sandbox.id,
          status: 'error',
          error: error.message,
          runnerDomain: sandbox.runnerDomain
        });
        console.log(`❌ Failed to delete ${sandbox.id}: ${error.message}`);
      }
    }

    console.log('\n📋 Cleanup Summary:');
    console.log(`✅ Successfully deleted: ${results.filter(r => r.status === 'deleted').length}`);
    console.log(`❌ Failed to delete: ${results.filter(r => r.status === 'error').length}`);
  }

  async createSnapshots() {
    console.log('📸 Creating snapshots of important sandboxes...');
    
    const sandboxes = await this.listSandboxes();
    const activeSandboxes = sandboxes.filter(sb => sb.state === 'started');
    
    console.log(`🎯 Found ${activeSandboxes.length} active sandboxes`);

    const snapshotTargets = [
      {
        filter: sb => sb.snapshot && sb.snapshot.includes('gpt-20b'),
        name: 'neural-weights-gpt-20b-production'
      },
      {
        filter: sb => sb.snapshot && sb.snapshot.includes('gpt-120b'),
        name: 'neural-weights-gpt-120b-production'
      },
      {
        filter: sb => sb.volumes && sb.volumes.some(v => v.mountPath === '/models'),
        name: 'neural-weights-model-server'
      },
      {
        filter: sb => sb.labels && sb.labels['neural-weights/user-id'],
        name: 'neural-weights-user-sandbox'
      }
    ];

    for (const target of snapshotTargets) {
      const matchingSandboxes = activeSandboxes.filter(target.filter);
      
      if (matchingSandboxes.length > 0) {
        const sandbox = matchingSandboxes[0];
        const snapshotName = `${target.name}-${Date.now()}`;
        
        try {
          console.log(`📸 Creating snapshot '${snapshotName}' from sandbox ${sandbox.id}`);
          await this.createSnapshot(sandbox.id, snapshotName);
          console.log(`✅ Created snapshot: ${snapshotName}`);
        } catch (error) {
          console.log(`❌ Failed to create snapshot: ${error.message}`);
        }
      }
    }
  }

  async listStatus() {
    console.log('📊 Daytona Sandbox Status Report\n');
    
    const sandboxes = await this.listSandboxes();
    
    const active = sandboxes.filter(sb => sb.state === 'started');
    const stopped = sandboxes.filter(sb => sb.state === 'stopped');
    const neuralWeights = sandboxes.filter(sb => 
      sb.labels && sb.labels['neural-weights/user-id']
    );

    console.log(`🟢 Active sandboxes: ${active.length}`);
    active.forEach(sb => {
      console.log(`   • ${sb.id} - ${sb.runnerDomain} (${sb.snapshot || 'custom'})`);
    });

    console.log(`\n🔴 Stopped sandboxes: ${stopped.length}`);
    stopped.forEach(sb => {
      console.log(`   • ${sb.id} - ${sb.runnerDomain} (${sb.snapshot || 'custom'})`);
    });

    console.log(`\n🧠 Neural Weights sandboxes: ${neuralWeights.length}`);
    neuralWeights.forEach(sb => {
      const status = sb.state === 'started' ? '🟢' : '🔴';
      console.log(`   ${status} ${sb.id} - ${sb.runnerDomain} (${sb.state})`);
    });

    console.log(`\n📈 Total sandboxes: ${sandboxes.length}`);
  }

  async findBestConnection() {
    console.log('🔍 Finding best sandbox for connection...');
    
    const sandboxes = await this.listSandboxes();
    const activeSandboxes = sandboxes.filter(sb => sb.state === 'started');
    
    if (activeSandboxes.length === 0) {
      console.log('❌ No active sandboxes found');
      return null;
    }

    // Priority order: Neural Weights > GPT servers > Any active
    let best = activeSandboxes.find(sb => 
      sb.labels && sb.labels['neural-weights/user-id']
    );
    
    if (!best) {
      best = activeSandboxes.find(sb => 
        sb.snapshot && (sb.snapshot.includes('gpt-20b') || sb.snapshot.includes('gpt-120b'))
      );
    }
    
    if (!best) {
      best = activeSandboxes[0];
    }

    console.log(`✅ Best connection: ${best.id}`);
    console.log(`🔗 URL: https://${best.runnerDomain}`);
    console.log(`📊 Resources: ${best.cpu} CPU, ${best.memory}GB RAM`);
    console.log(`📦 Snapshot: ${best.snapshot || 'custom'}`);
    
    return best;
  }
}

async function main() {
  const action = process.argv[2] || 'list';
  const manager = new DaytonaManager();

  try {
    switch (action) {
      case 'cleanup':
        await manager.cleanup();
        break;
      
      case 'snapshot':
        await manager.createSnapshots();
        break;
      
      case 'connect':
        await manager.findBestConnection();
        break;
      
      case 'list':
      default:
        await manager.listStatus();
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DaytonaManager;
