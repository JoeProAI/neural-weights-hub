'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  HardDrive,
  DollarSign,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';

interface ModelInfo {
  model: string;
  displayName: string;
  description: string;
  parameters: string;
  contextWindow: number;
  estimatedSize: string;
  capabilities: string[];
  isAvailable: boolean;
  volumeStatus?: 'ready' | 'uploading' | 'error' | 'not-created';
}

interface ModelDeploymentStatus {
  model: string;
  status: 'pending' | 'downloading' | 'uploading' | 'configuring' | 'ready' | 'error';
  progress: number;
  message: string;
  estimatedTimeRemaining?: string;
}

export function ModelManager() {
  const { getIdToken } = useAuth();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [deploymentStatuses, setDeploymentStatuses] = useState<ModelDeploymentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
    fetchDeploymentStatuses();
    
    // Poll for deployment status updates
    const interval = setInterval(fetchDeploymentStatuses, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchModels = async () => {
    try {
      const token = await getIdToken();
      const response = await fetch('/api/models', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      if (result.success) {
        setModels(result.data);
      } else {
        toast.error('Failed to fetch models');
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error('Failed to fetch models');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeploymentStatuses = async () => {
    try {
      const token = await getIdToken();
      const response = await fetch('/api/models/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      if (result.success) {
        setDeploymentStatuses(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching deployment statuses:', error);
    }
  };

  const deployModel = async (model: string) => {
    try {
      setDeploying(model);
      const token = await getIdToken();
      
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ model }),
      });
      
      const result = await response.json();
      if (result.success) {
        toast.success(`Started deploying ${model}`);
        fetchDeploymentStatuses();
      } else {
        toast.error(result.error || 'Failed to start deployment');
      }
    } catch (error) {
      console.error('Error deploying model:', error);
      toast.error('Failed to start deployment');
    } finally {
      setDeploying(null);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'uploading':
      case 'downloading':
      case 'configuring':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <HardDrive className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (model: ModelInfo) => {
    const deploymentStatus = deploymentStatuses.find(s => s.model === model.model);
    
    if (deploymentStatus) {
      const variant = deploymentStatus.status === 'ready' ? 'default' : 
                    deploymentStatus.status === 'error' ? 'destructive' : 'secondary';
      
      return (
        <Badge variant={variant as any}>
          {deploymentStatus.status === 'ready' ? 'Available' : 
           deploymentStatus.status === 'error' ? 'Error' : 'Deploying'}
        </Badge>
      );
    }
    
    if (model.isAvailable) {
      return <Badge>Available</Badge>;
    }
    
    return <Badge variant="outline">Not Deployed</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Model Volume Manager
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Deploy and manage open weight models on Daytona volumes
          </p>
        </div>
        <Button onClick={fetchModels} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {models.map((model) => {
          const deploymentStatus = deploymentStatuses.find(s => s.model === model.model);
          const isDeploying = deploying === model.model || 
                             (deploymentStatus && !['ready', 'error'].includes(deploymentStatus.status));

          return (
            <Card key={model.model} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="h-6 w-6 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{model.displayName}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        {getStatusIcon(model.volumeStatus)}
                        {model.parameters} parameters
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(model)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {model.description}
                </p>

                {/* Model Specs */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-slate-500" />
                    <span>Size: {model.estimatedSize}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-slate-500" />
                    <span>Context: {model.contextWindow.toLocaleString()}</span>
                  </div>
                </div>

                {/* Capabilities */}
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Capabilities:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {model.capabilities.slice(0, 3).map((capability) => (
                      <Badge key={capability} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                    {model.capabilities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{model.capabilities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Deployment Progress */}
                {deploymentStatus && !['ready', 'error'].includes(deploymentStatus.status) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        {deploymentStatus.message}
                      </span>
                      <span className="text-slate-500">
                        {deploymentStatus.progress}%
                      </span>
                    </div>
                    <Progress value={deploymentStatus.progress} className="h-2" />
                    {deploymentStatus.estimatedTimeRemaining && (
                      <p className="text-xs text-slate-500">
                        Estimated time remaining: {deploymentStatus.estimatedTimeRemaining}
                      </p>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {deploymentStatus?.status === 'error' && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {deploymentStatus.message}
                    </p>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <DollarSign className="h-3 w-3" />
                    <span>~${model.model === 'gpt-oss-20b' ? '12' : '60'}/month</span>
                  </div>
                  
                  {model.isAvailable || deploymentStatus?.status === 'ready' ? (
                    <Button size="sm" disabled>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Deployed
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => deployModel(model.model)}
                      disabled={isDeploying}
                    >
                      {isDeploying ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Deploy Model
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cost Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Storage Cost Summary
          </CardTitle>
          <CardDescription>
            Estimated monthly costs for deployed models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                ${models.filter(m => m.isAvailable).length * 36}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Current Monthly Cost
              </p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                $72
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Max Monthly Cost (Both Models)
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {models.filter(m => m.isAvailable).length}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Models Deployed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
