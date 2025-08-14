import { DaytonaService } from './daytona.js';
import { db } from './firebase.js';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export class ResourceManager {
  constructor() {
    this.daytona = new DaytonaService();
  }

  // Create complete user environment with sandbox, volumes, and API endpoints
  async createUserEnvironment(userId, subscriptionPlan) {
    try {
      console.log(`Creating environment for user ${userId} with plan ${subscriptionPlan}`);
      
      // Get plan limits
      const planLimits = this.getPlanLimits(subscriptionPlan);
      
      // Create sandbox with proper resources
      const sandbox = await this.daytona.createSandbox({
        name: `user-${userId}-env`,
        resources: {
          cpu: planLimits.cpu,
          memory: planLimits.memory,
          disk: planLimits.disk
        },
        volumes: planLimits.volumes,
        autoStop: planLimits.autoStop
      });

      // Create user resource record
      const resourceData = {
        userId,
        sandboxId: sandbox.id,
        subscriptionPlan,
        status: 'active',
        createdAt: new Date(),
        lastUsed: new Date(),
        resources: {
          cpu: planLimits.cpu,
          memory: planLimits.memory,
          disk: planLimits.disk
        },
        usage: {
          apiCalls: 0,
          sandboxHours: 0,
          deployments: 0,
          estimatedCost: 0
        },
        endpoints: {
          sandbox: sandbox.connectionUrl,
          api: `https://${sandbox.id}.api.neural-weights.com`,
          chatbot: `https://${sandbox.id}.chat.neural-weights.com`
        }
      };

      if (db) {
        await setDoc(doc(db, 'user-resources', userId), resourceData);
      }

      return resourceData;
    } catch (error) {
      console.error('Failed to create user environment:', error);
      throw error;
    }
  }

  // Start user resources
  async startUserResources(userId) {
    try {
      const userResources = await this.getUserResources(userId);
      if (!userResources) {
        throw new Error('User resources not found');
      }

      // Start sandbox
      await this.daytona.startSandbox(userResources.sandboxId);
      
      // Update status
      if (db) {
        await updateDoc(doc(db, 'user-resources', userId), {
          status: 'active',
          lastUsed: new Date()
        });
      }

      return { status: 'started', sandboxId: userResources.sandboxId };
    } catch (error) {
      console.error('Failed to start user resources:', error);
      throw error;
    }
  }

  // Stop user resources
  async stopUserResources(userId) {
    try {
      const userResources = await this.getUserResources(userId);
      if (!userResources) {
        throw new Error('User resources not found');
      }

      // Stop sandbox
      await this.daytona.stopSandbox(userResources.sandboxId);
      
      // Update status
      if (db) {
        await updateDoc(doc(db, 'user-resources', userId), {
          status: 'stopped',
          lastUsed: new Date()
        });
      }

      return { status: 'stopped', sandboxId: userResources.sandboxId };
    } catch (error) {
      console.error('Failed to stop user resources:', error);
      throw error;
    }
  }

  // Deploy user API/chatbot
  async deployUserApplication(userId, appConfig) {
    try {
      const userResources = await this.getUserResources(userId);
      if (!userResources) {
        throw new Error('User resources not found');
      }

      // Ensure sandbox is running
      await this.startUserResources(userId);

      // Deploy application to sandbox
      const deployment = await this.daytona.deployApplication(
        userResources.sandboxId,
        appConfig
      );

      // Update deployment count
      if (db) {
        await updateDoc(doc(db, 'user-resources', userId), {
          'usage.deployments': userResources.usage.deployments + 1,
          lastUsed: new Date()
        });
      }

      return deployment;
    } catch (error) {
      console.error('Failed to deploy user application:', error);
      throw error;
    }
  }

  // Track usage and update billing
  async trackUsage(userId, usageType, amount = 1) {
    try {
      if (!db) return;

      const userResources = await this.getUserResources(userId);
      if (!userResources) return;

      const updates = {
        lastUsed: new Date()
      };

      switch (usageType) {
        case 'api_call':
          updates['usage.apiCalls'] = userResources.usage.apiCalls + amount;
          break;
        case 'sandbox_hour':
          updates['usage.sandboxHours'] = userResources.usage.sandboxHours + amount;
          break;
        case 'deployment':
          updates['usage.deployments'] = userResources.usage.deployments + amount;
          break;
      }

      // Calculate estimated cost
      const planLimits = this.getPlanLimits(userResources.subscriptionPlan);
      updates['usage.estimatedCost'] = this.calculateCost(
        { ...userResources.usage, ...updates },
        planLimits
      );

      await updateDoc(doc(db, 'user-resources', userId), updates);
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
  }

  // Get user resources
  async getUserResources(userId) {
    try {
      if (!db) return null;
      
      const docRef = doc(db, 'user-resources', userId);
      const docSnap = await getDoc(docRef);
      
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error('Failed to get user resources:', error);
      return null;
    }
  }

  // Get plan limits
  getPlanLimits(plan) {
    const limits = {
      free: {
        cpu: 1,
        memory: 2,
        disk: 5,
        volumes: [],
        autoStop: 3600, // 1 hour
        apiCalls: 100,
        deployments: 1,
        sandboxHours: 10
      },
      developer: {
        cpu: 2,
        memory: 4,
        disk: 10,
        volumes: ['gpt-20b'],
        autoStop: 0, // No auto-stop
        apiCalls: 10000,
        deployments: 10,
        sandboxHours: 100
      },
      team: {
        cpu: 4,
        memory: 8,
        disk: 10,
        volumes: ['gpt-20b', 'gpt-120b'],
        autoStop: 0,
        apiCalls: 100000,
        deployments: 50,
        sandboxHours: 500
      },
      enterprise: {
        cpu: 4,
        memory: 8,
        disk: 10,
        volumes: ['gpt-20b', 'gpt-120b'],
        autoStop: 0,
        apiCalls: 1000000,
        deployments: 200,
        sandboxHours: 2000
      }
    };

    return limits[plan] || limits.free;
  }

  // Calculate usage cost
  calculateCost(usage, limits) {
    let cost = 0;
    
    // API call overages
    if (usage.apiCalls > limits.apiCalls) {
      cost += (usage.apiCalls - limits.apiCalls) * 0.001; // $0.001 per extra call
    }
    
    // Sandbox hour overages
    if (usage.sandboxHours > limits.sandboxHours) {
      cost += (usage.sandboxHours - limits.sandboxHours) * 0.50; // $0.50 per extra hour
    }
    
    // Deployment overages
    if (usage.deployments > limits.deployments) {
      cost += (usage.deployments - limits.deployments) * 2.00; // $2.00 per extra deployment
    }
    
    return Math.round(cost * 100) / 100; // Round to 2 decimal places
  }

  // Clean up inactive resources
  async cleanupInactiveResources() {
    try {
      if (!db) return;

      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      const q = query(
        collection(db, 'user-resources'),
        where('lastUsed', '<', cutoffTime),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const docSnap of querySnapshot.docs) {
        const userId = docSnap.id;
        const data = docSnap.data();
        
        // Stop inactive free tier resources
        if (data.subscriptionPlan === 'free') {
          await this.stopUserResources(userId);
          console.log(`Stopped inactive free tier resources for user ${userId}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup inactive resources:', error);
    }
  }
}
