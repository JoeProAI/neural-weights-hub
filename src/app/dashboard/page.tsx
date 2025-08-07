'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModelManager } from '@/components/model-manager';
import { 
  Brain, 
  Zap, 
  Users, 
  Settings, 
  LogOut, 
  Plus,
  Play,
  Code,
  Layers,
  HardDrive,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/auth');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Neural Weights Hub
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {user.displayName || user.email}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: Brain },
              { id: 'models', name: 'Model Volumes', icon: HardDrive },
              { id: 'environments', name: 'Environments', icon: Code },
              { id: 'templates', name: 'Templates', icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Welcome to Neural Weights Hub! 🧠
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Built by a neuroscientist with deep expertise in neural networks - from mouse sensory processing to cutting-edge AI models.
              </p>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Model Comparison Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Model Comparison
              </CardTitle>
              <CardDescription>
                Compare gpt-oss-20b and gpt-oss-120b performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Sandbox Environments Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                Sandbox Environments
              </CardTitle>
              <CardDescription>
                Create and manage Daytona development environments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Templates Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-500" />
                App Templates
              </CardTitle>
              <CardDescription>
                Pre-built templates optimized for open weight models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* User Info Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your Neural Weights Hub profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Display Name
                  </label>
                  <p className="text-slate-900 dark:text-white">
                    {user.displayName || 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <p className="text-slate-900 dark:text-white">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Member Since
                  </label>
                  <p className="text-slate-900 dark:text-white">
                    {user.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>
          </>
        )}

        {activeTab === 'models' && (
          <ModelManager />
        )}

        {activeTab === 'environments' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Sandbox Environments
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Create and manage Daytona development environments with model volumes
              </p>
            </div>
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Code className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    Environment Management Coming Soon
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Deploy models first, then create environments with mounted volumes
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                App Templates
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Pre-built templates optimized for open weight models
              </p>
            </div>
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Layers className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    Templates Coming Soon
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Ready-to-use templates for common AI applications
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
