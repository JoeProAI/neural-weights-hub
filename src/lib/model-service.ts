// Model Management Service for Neural Weights Hub
import { DaytonaClient, ModelVolume } from './daytona-client';
import { OpenAIModel } from '@/types';

export interface ModelInfo {
  model: OpenAIModel;
  displayName: string;
  description: string;
  parameters: string;
  contextWindow: number;
  estimatedSize: string;
  capabilities: string[];
  isAvailable: boolean;
  volumeStatus?: 'ready' | 'uploading' | 'error' | 'not-created';
}

export interface ModelDeploymentStatus {
  model: OpenAIModel;
  status: 'pending' | 'downloading' | 'uploading' | 'configuring' | 'ready' | 'error';
  progress: number;
  message: string;
  estimatedTimeRemaining?: string;
}

export class ModelService {
  private daytonaClient: DaytonaClient;
  private deploymentStatus: Map<OpenAIModel, ModelDeploymentStatus> = new Map();

  constructor() {
    this.daytonaClient = new DaytonaClient();
  }

  // Get information about all supported models
  getModelInfo(): ModelInfo[] {
    return [
      {
        model: 'gpt-oss-20b',
        displayName: 'GPT-OSS 20B',
        description: 'OpenAI\'s efficient open weight model with 20B parameters. Apache 2.0 licensed with STEM, coding, and general knowledge focus.',
        parameters: '20B',
        contextWindow: 32768, // Based on transformer architecture standards
        estimatedSize: '~40GB', // More accurate for 20B model
        capabilities: [
          'Text Generation',
          'Code Completion',
          'STEM Problem Solving',
          'Web Browsing Tools',
          'Python/Jupyter Integration',
          'Chain-of-Thought Reasoning',
        ],
        isAvailable: false,
      },
      {
        model: 'gpt-oss-120b',
        displayName: 'GPT-OSS 120B',
        description: 'OpenAI\'s flagship open weight model with 120B parameters. Trained with 2.1M H100-hours using CoT RL techniques similar to o3.',
        parameters: '120B',
        contextWindow: 32768,
        estimatedSize: '~240GB', // More accurate for 120B model
        capabilities: [
          'Advanced Chain-of-Thought Reasoning',
          'Complex Code Generation',
          'Agentic Tool Usage',
          'Web Browsing & Search',
          'Scientific Research',
          'Multi-step Problem Solving',
          'Similar Personality to ChatGPT',
        ],
        isAvailable: false,
      },
    ];
  }

  // Check which models are currently available on volumes
  async updateModelAvailability(): Promise<ModelInfo[]> {
    try {
      const availability = await this.daytonaClient.getModelAvailability();
      const modelVolumes = await this.daytonaClient.getModelVolumes();
      
      const modelInfo = this.getModelInfo();
      
      return modelInfo.map(info => {
        const volume = modelVolumes.find(v => v.model === info.model);
        
        return {
          ...info,
          isAvailable: availability[info.model],
          volumeStatus: volume ? volume.status : 'not-created',
        };
      });
    } catch (error) {
      console.error('Error updating model availability:', error);
      return this.getModelInfo(); // Return default info if error
    }
  }

  // ADMIN: Setup model for platform (one-time)
  async setupModel(model: OpenAIModel): Promise<void> {
    try {
      this.deploymentStatus.set(model, {
        model,
        status: 'pending',
        progress: 0,
        message: 'Setting up model for platform...',
      });

      this.updateDeploymentStatus(model, {
        status: 'downloading',
        progress: 10,
        message: 'Creating storage volume...',
        estimatedTimeRemaining: '2-3 minutes',
      });

      this.updateDeploymentStatus(model, {
        status: 'downloading',
        progress: 30,
        message: 'Downloading model from Hugging Face...',
        estimatedTimeRemaining: '10-15 minutes',
      });

      const modelVolume = await this.daytonaClient.setupModelVolume(model);

      this.updateDeploymentStatus(model, {
        status: 'configuring',
        progress: 90,
        message: 'Finalizing model setup...',
        estimatedTimeRemaining: '1-2 minutes',
      });

      this.updateDeploymentStatus(model, {
        status: 'ready',
        progress: 100,
        message: 'Model ready for user deployments!',
      });

      console.log(`Successfully setup ${model} for platform use`);
    } catch (error: any) {
      this.updateDeploymentStatus(model, {
        status: 'error',
        progress: 0,
        message: `Setup failed: ${error.message}`,
      });
      throw error;
    }
  }

  // USER: Deploy model instance (creates running server)
  async deployModel(model: OpenAIModel, userId: string): Promise<string> {
    try {
      console.log(`Deploying ${model} instance for user ${userId}`);
      
      // Create model server instance
      const environment = await this.daytonaClient.deployModelInstance(model, userId);
      
      return environment.url || `https://8000-${environment.id}.proxy.daytona.work`;
    } catch (error: any) {
      console.error(`Failed to deploy ${model} for user ${userId}:`, error);
      throw error;
    }
  }

  // Get deployment status for a model
  getDeploymentStatus(model: OpenAIModel): ModelDeploymentStatus | null {
    return this.deploymentStatus.get(model) || null;
  }

  // Get all deployment statuses
  getAllDeploymentStatuses(): ModelDeploymentStatus[] {
    return Array.from(this.deploymentStatus.values());
  }

  // Update deployment status
  private updateDeploymentStatus(model: OpenAIModel, updates: Partial<ModelDeploymentStatus>): void {
    const current = this.deploymentStatus.get(model);
    if (current) {
      this.deploymentStatus.set(model, { ...current, ...updates });
    }
  }

  // Create environment with specific models
  async createEnvironmentWithModels(
    name: string,
    models: OpenAIModel[],
    userId: string
  ): Promise<{ environmentId: string; url?: string }> {
    try {
      // Check if all requested models are available
      const availability = await this.daytonaClient.getModelAvailability();
      const unavailableModels = models.filter(model => !availability[model]);
      
      if (unavailableModels.length > 0) {
        throw new Error(`Models not available: ${unavailableModels.join(', ')}`);
      }

      // Create environment with model volumes mounted
      const environment = await this.daytonaClient.createEnvironmentWithModels(
        `${name}-${userId.substring(0, 8)}`,
        models
      );

      return {
        environmentId: environment.id,
        url: environment.url,
      };
    } catch (error: any) {
      throw new Error(`Failed to create environment: ${error.message}`);
    }
  }

  // Get storage cost estimates
  async getStorageCostEstimate(models: OpenAIModel[]): Promise<{
    monthly: number;
    yearly: number;
    breakdown: { model: OpenAIModel; monthlyCost: number }[];
  }> {
    const estimate = await this.daytonaClient.estimateStorageCost(models);
    
    const modelCosts = {
      'gpt-oss-20b': 12, // $12/month for 100GB
      'gpt-oss-120b': 60, // $60/month for 500GB
    };

    const breakdown = models.map(model => ({
      model,
      monthlyCost: modelCosts[model],
    }));

    return {
      ...estimate,
      breakdown,
    };
  }

  // Get model usage statistics (placeholder for future implementation)
  async getModelUsageStats(model: OpenAIModel, timeframe: 'day' | 'week' | 'month'): Promise<{
    totalRequests: number;
    totalTokens: number;
    averageResponseTime: number;
    uniqueUsers: number;
  }> {
    // This would integrate with your analytics/logging system
    return {
      totalRequests: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      uniqueUsers: 0,
    };
  }

  // Health check for model volumes
  async healthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    models: { [key in OpenAIModel]: 'healthy' | 'unhealthy' };
    issues: string[];
  }> {
    try {
      const modelVolumes = await this.daytonaClient.getModelVolumes();
      const issues: string[] = [];
      const modelHealth: { [key in OpenAIModel]: 'healthy' | 'unhealthy' } = {
        'gpt-oss-20b': 'unhealthy',
        'gpt-oss-120b': 'unhealthy',
      };

      for (const volume of modelVolumes) {
        if (volume.status === 'ready') {
          modelHealth[volume.model] = 'healthy';
        } else {
          issues.push(`${volume.model} volume status: ${volume.status}`);
        }
      }

      const healthyModels = Object.values(modelHealth).filter(status => status === 'healthy').length;
      const overall = healthyModels === 2 ? 'healthy' : healthyModels === 1 ? 'degraded' : 'unhealthy';

      return {
        overall,
        models: modelHealth,
        issues,
      };
    } catch (error: any) {
      return {
        overall: 'unhealthy',
        models: {
          'gpt-oss-20b': 'unhealthy',
          'gpt-oss-120b': 'unhealthy',
        },
        issues: [`Health check failed: ${error.message}`],
      };
    }
  }

  // Cleanup unused volumes (cost optimization)
  async cleanupUnusedVolumes(): Promise<{ cleaned: number; savedMonthlyCost: number }> {
    try {
      const volumes = await this.daytonaClient.listVolumes();
      let cleaned = 0;
      let savedMonthlyCost = 0;

      for (const volume of volumes) {
        // Check if volume is unused (this would need more sophisticated logic)
        if (volume.status === 'available' && volume.name.includes('temp-')) {
          await this.daytonaClient.deleteVolume(volume.id);
          cleaned++;
          savedMonthlyCost += 12; // Estimate $12/month per volume
        }
      }

      return { cleaned, savedMonthlyCost };
    } catch (error: any) {
      throw new Error(`Cleanup failed: ${error.message}`);
    }
  }
}
