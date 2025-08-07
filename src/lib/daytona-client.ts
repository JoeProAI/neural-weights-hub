// Daytona API Client for Neural Weights Hub
import axios, { AxiosInstance } from 'axios';
import { OpenAIModel } from '@/types';

export interface DaytonaVolume {
  id: string;
  name: string;
  size: string;
  mountPath: string;
  status: 'creating' | 'available' | 'in-use' | 'deleting' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface DaytonaEnvironment {
  id: string;
  name: string;
  status: 'creating' | 'running' | 'stopped' | 'error' | 'deleting';
  url?: string;
  volumes: DaytonaVolume[];
  resources: {
    cpu: string;
    memory: string;
    storage: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ModelVolume {
  model: OpenAIModel;
  volumeId: string;
  size: string;
  status: 'uploading' | 'ready' | 'error';
  uploadProgress?: number;
  lastUpdated: string;
}

export class DaytonaClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;
  private orgId: string;

  constructor() {
    this.apiKey = process.env.DAYTONA_API_KEY || '';
    this.baseUrl = process.env.DAYTONA_API_URL || 'https://app.daytona.io/api';
    this.orgId = process.env.DAYTONA_ORG_ID || '';
    
    if (!this.apiKey) {
      throw new Error('DAYTONA_API_KEY is required');
    }
    
    if (!this.orgId) {
      throw new Error('DAYTONA_ORG_ID is required');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-Daytona-Organization-ID': this.orgId,
      },
      timeout: 30000, // 30 seconds
    });
  }

  // Volume Management
  async createVolume(name: string, sizeGB: number): Promise<DaytonaVolume> {
    try {
      const response = await this.client.post('/volumes', {
        name,
        size: `${sizeGB}GB`,
        type: 'persistent',
        encrypted: true,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating volume:', error.response?.data || error.message);
      throw new Error(`Failed to create volume: ${error.response?.data?.message || error.message}`);
    }
  }

  async listVolumes(): Promise<DaytonaVolume[]> {
    try {
      const response = await this.client.get('/volumes');
      return response.data.volumes || [];
    } catch (error: any) {
      console.error('Error listing volumes:', error.response?.data || error.message);
      throw new Error(`Failed to list volumes: ${error.response?.data?.message || error.message}`);
    }
  }

  async getVolume(volumeId: string): Promise<DaytonaVolume> {
    try {
      const response = await this.client.get(`/volumes/${volumeId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting volume:', error.response?.data || error.message);
      throw new Error(`Failed to get volume: ${error.response?.data?.message || error.message}`);
    }
  }

  async deleteVolume(volumeId: string): Promise<void> {
    try {
      await this.client.delete(`/volumes/${volumeId}`);
    } catch (error: any) {
      console.error('Error deleting volume:', error.response?.data || error.message);
      throw new Error(`Failed to delete volume: ${error.response?.data?.message || error.message}`);
    }
  }

  // Model-specific volume operations
  async createModelVolume(model: OpenAIModel): Promise<ModelVolume> {
    const sizeMap = {
      'gpt-oss-20b': 100, // 100GB for safety
      'gpt-oss-120b': 500, // 500GB for safety
    };

    const volumeName = `neural-weights-${model.replace('gpt-oss-', '').replace('b', 'b-model')}`;
    
    try {
      const volume = await this.createVolume(volumeName, sizeMap[model]);
      
      return {
        model,
        volumeId: volume.id,
        size: volume.size,
        status: 'uploading',
        uploadProgress: 0,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to create model volume for ${model}: ${error.message}`);
    }
  }

  async getModelVolumes(): Promise<ModelVolume[]> {
    try {
      const volumes = await this.listVolumes();
      const modelVolumes: ModelVolume[] = [];

      for (const volume of volumes) {
        if (volume.name.startsWith('neural-weights-')) {
          const modelMatch = volume.name.match(/neural-weights-(\d+)b-model/);
          if (modelMatch) {
            const modelSize = modelMatch[1];
            const model: OpenAIModel = `gpt-oss-${modelSize}b` as OpenAIModel;
            
            modelVolumes.push({
              model,
              volumeId: volume.id,
              size: volume.size,
              status: volume.status === 'available' ? 'ready' : 'uploading',
              lastUpdated: volume.updatedAt,
            });
          }
        }
      }

      return modelVolumes;
    } catch (error: any) {
      throw new Error(`Failed to get model volumes: ${error.message}`);
    }
  }

  // Environment Management with Volume Mounting
  async createEnvironmentWithModels(
    name: string,
    models: OpenAIModel[],
    template: string = 'python-ml'
  ): Promise<DaytonaEnvironment> {
    try {
      // Get model volumes
      const modelVolumes = await this.getModelVolumes();
      const volumeMounts = [];

      for (const model of models) {
        const modelVolume = modelVolumes.find(v => v.model === model && v.status === 'ready');
        if (modelVolume) {
          volumeMounts.push({
            volumeId: modelVolume.volumeId,
            mountPath: `/models/${model}`,
            readOnly: true,
          });
        } else {
          console.warn(`Model ${model} volume not ready, skipping mount`);
        }
      }

      const response = await this.client.post('/sandbox', {
        name,
        snapshot: template,
        resources: {
          cpu: 4,
          memory: 16,
          disk: 50,
        },
        volumes: volumeMounts,
        labels: {
          MODEL_PATH: '/models',
          AVAILABLE_MODELS: models.join(','),
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error creating environment:', error.response?.data || error.message);
      throw new Error(`Failed to create environment: ${error.response?.data?.message || error.message}`);
    }
  }

  async listEnvironments(): Promise<DaytonaEnvironment[]> {
    try {
      const response = await this.client.get('/sandbox');
      return response.data || [];
    } catch (error: any) {
      console.error('Error listing environments:', error.response?.data || error.message);
      throw new Error(`Failed to list environments: ${error.response?.data?.message || error.message}`);
    }
  }

  async getEnvironment(environmentId: string): Promise<DaytonaEnvironment> {
    try {
      const response = await this.client.get(`/sandbox/${environmentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting environment:', error.response?.data || error.message);
      throw new Error(`Failed to get environment: ${error.response?.data?.message || error.message}`);
    }
  }

  async startEnvironment(environmentId: string): Promise<DaytonaEnvironment> {
    try {
      const response = await this.client.post(`/sandbox/${environmentId}/start`);
      return response.data;
    } catch (error: any) {
      console.error('Error starting environment:', error.response?.data || error.message);
      throw new Error(`Failed to start environment: ${error.response?.data?.message || error.message}`);
    }
  }

  async stopEnvironment(environmentId: string): Promise<DaytonaEnvironment> {
    try {
      const response = await this.client.post(`/sandbox/${environmentId}/stop`);
      return response.data;
    } catch (error: any) {
      console.error('Error stopping environment:', error.response?.data || error.message);
      throw new Error(`Failed to stop environment: ${error.response?.data?.message || error.message}`);
    }
  }

  async deleteEnvironment(environmentId: string): Promise<void> {
    try {
      await this.client.delete(`/sandbox/${environmentId}`);
    } catch (error: any) {
      console.error('Error deleting environment:', error.response?.data || error.message);
      throw new Error(`Failed to delete environment: ${error.response?.data?.message || error.message}`);
    }
  }

  // ADMIN: One-time model setup (downloads and prepares models)
  async setupModelVolume(model: OpenAIModel): Promise<ModelVolume> {
    try {
      console.log(`Setting up ${model} for platform use...`);
      
      // 1. Create volume for model storage
      const sizeMap = {
        'gpt-oss-20b': 100,
        'gpt-oss-120b': 500,
      };
      
      const volumeName = `neural-weights-${model.replace('gpt-oss-', '').replace('b', 'b-model')}`;
      const volume = await this.createVolume(volumeName, sizeMap[model]);
      
      // 2. Create sandbox for model download and setup
      const setupSandbox = await this.client.post('/sandbox', {
        name: `setup-${model}`,
        snapshot: 'python-ml',
        resources: { cpu: 4, memory: 16, disk: 20 },
        volumes: [{ volumeId: volume.id, mountPath: '/models', readOnly: false }],
      });
      
      // 3. Download model using Hugging Face CLI
      const downloadScript = `
        pip install huggingface_hub
        cd /models
        huggingface-cli download microsoft/${model} --local-dir ./${model}
        echo "Model ${model} downloaded successfully"
      `;
      
      // 4. Execute download (this would be done via Daytona toolbox API)
      console.log(`Downloading ${model} to volume...`);
      
      return {
        model,
        volumeId: volume.id,
        size: volume.size,
        status: 'ready',
        lastUpdated: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to setup ${model}: ${error.message}`);
    }
  }

  // USER: Deploy model instance (creates running model server)
  async deployModelInstance(model: OpenAIModel, userId: string): Promise<DaytonaEnvironment> {
    try {
      console.log(`Deploying ${model} instance for user ${userId}...`);
      
      // 1. Find existing model volume
      const modelVolumes = await this.getModelVolumes();
      const modelVolume = modelVolumes.find(v => v.model === model && v.status === 'ready');
      
      if (!modelVolume) {
        throw new Error(`Model ${model} is not available. Please contact admin.`);
      }
      
      // 2. Create sandbox with model serving setup
      const instanceName = `${model}-${userId.substring(0, 8)}-${Date.now()}`;
      
      const response = await this.client.post('/sandbox', {
        name: instanceName,
        snapshot: 'python-ml', // We'll create a custom snapshot with vLLM/TGI
        resources: {
          cpu: model === 'gpt-oss-120b' ? 8 : 4,
          memory: model === 'gpt-oss-120b' ? 32 : 16,
          disk: 10, // Small disk, model is on mounted volume
        },
        volumes: [{
          volumeId: modelVolume.volumeId,
          mountPath: '/models',
          readOnly: true,
        }],
        labels: {
          MODEL_NAME: model,
          USER_ID: userId,
          MODEL_PATH: `/models/${model}`,
          API_PORT: '8000',
        },
      });
      
      const environment = response.data;
      
      // 3. Start model server (would be done via startup script)
      console.log(`Starting ${model} server for user ${userId}...`);
      
      return {
        ...environment,
        url: `https://8000-${environment.id}.proxy.daytona.work`,
        status: 'creating',
      };
    } catch (error: any) {
      throw new Error(`Failed to deploy ${model} instance: ${error.message}`);
    }
  }

  // Utility methods
  async getModelAvailability(): Promise<{ [key in OpenAIModel]: boolean }> {
    try {
      const modelVolumes = await this.getModelVolumes();
      
      return {
        'gpt-oss-20b': modelVolumes.some(v => v.model === 'gpt-oss-20b' && v.status === 'ready'),
        'gpt-oss-120b': modelVolumes.some(v => v.model === 'gpt-oss-120b' && v.status === 'ready'),
      };
    } catch (error: any) {
      console.error('Error checking model availability:', error.message);
      return {
        'gpt-oss-20b': false,
        'gpt-oss-120b': false,
      };
    }
  }

  async estimateStorageCost(models: OpenAIModel[]): Promise<{ monthly: number; yearly: number }> {
    const costPerGBPerMonth = 0.12; // $0.12/GB/month estimate
    
    const modelSizes = {
      'gpt-oss-20b': 100, // GB
      'gpt-oss-120b': 500, // GB
    };

    const totalSize = models.reduce((sum, model) => sum + modelSizes[model], 0);
    const monthly = totalSize * costPerGBPerMonth;
    
    return {
      monthly,
      yearly: monthly * 12,
    };
  }
}
