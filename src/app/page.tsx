'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NeuralNetworkBackground } from '@/components/neural-network-background';
import { 
  Zap, 
  Code, 
  Users, 
  ArrowRight, 
  CheckCircle,
  HardDrive,
  Layers,
  Cpu
} from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen relative">
      <NeuralNetworkBackground />
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <div className="flex items-center gap-3 mb-6 sm:justify-center lg:justify-start">
                  <Cpu className="h-12 w-12 text-blue-600" />
                  <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                    Neural Weights Hub
                  </h1>
                </div>
                
                <p className="text-xl text-slate-600 dark:text-slate-400 mb-2">
                  Test, Compare & Build with OpenAI's Open Weight Models
                </p>
                
                <p className="text-base text-slate-500 dark:text-slate-500 mb-8">
                  Built by a neuroscientist with deep expertise in neural networks - from mouse sensory processing to cutting-edge AI models.
                </p>
                
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start gap-3">
                  <div className="rounded-md shadow">
                    <Button 
                      size="lg" 
                      onClick={() => router.push('/auth')}
                      className="w-full flex items-center justify-center px-8 py-3 text-base font-medium"
                    >
                      Get Started Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 sm:mt-0">
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => router.push('/pricing')}
                      className="w-full flex items-center justify-center px-8 py-3 text-base font-medium"
                    >
                      View Pricing
                    </Button>
                  </div>
                  <div className="mt-3 sm:mt-0">
                    <Button 
                      variant="ghost" 
                      size="lg"
                      onClick={() => router.push('/auth')}
                      className="w-full flex items-center justify-center px-8 py-3 text-base font-medium text-slate-600 hover:text-slate-900"
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">
              Open Weight Models
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Everything you need to build with AI
            </p>
            <p className="mt-4 max-w-2xl text-xl text-slate-500 dark:text-slate-400 lg:mx-auto">
              Deploy, test, and compare OpenAI's newest open weight models with instant Daytona sandbox environments.
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Model Volumes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-blue-600" />
                    Model Volumes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Deploy gpt-oss-20b and gpt-oss-120b to Daytona volumes for instant access
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Sandbox Environments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-green-600" />
                    Sandbox Environments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Create isolated development environments with mounted model volumes
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Model Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    Model Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Side-by-side testing and performance analysis of different model sizes
                  </CardDescription>
                </CardContent>
              </Card>

              {/* App Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-purple-600" />
                    App Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Pre-built templates optimized for open weight model integration
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Models Section */}
      <div className="py-12 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Supported Models
            </h2>
            <p className="mt-4 text-xl text-slate-500 dark:text-slate-400">
              OpenAI's newest open weight models ready for deployment
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* GPT-OSS 20B */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-6 w-6 text-blue-600" />
                  GPT-OSS 20B
                </CardTitle>
                <CardDescription>
                  OpenAI's efficient open weight model with Apache 2.0 license. STEM, coding, and general knowledge focus.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">20B parameters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">32K context window</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">~40GB storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">$8/month hosting</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GPT-OSS 120B */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-6 w-6 text-purple-600" />
                  GPT-OSS 120B
                </CardTitle>
                <CardDescription>
                  OpenAI's flagship open weight model. Trained with 2.1M H100-hours using CoT RL techniques similar to o3.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">120B parameters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">32K context window</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">~240GB storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">$48/month hosting</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to start building?</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-200">
            Join Neural Weights Hub and get instant access to OpenAI's open weight models with powerful cloud deployment.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => router.push('/auth')}
            className="mt-8 w-full sm:w-auto bg-white text-blue-600 hover:bg-slate-50"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
