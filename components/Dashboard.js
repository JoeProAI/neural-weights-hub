import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import AppDeployment from './AppDeployment';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/billing', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const billingData = await response.json();
        setUsage(billingData.usage);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testGPTModel = async (model) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/gpt/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          model: model,
          message: 'Hello! Please introduce yourself and explain what you can do.'
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`${model} is working! Check console for response.`);
        console.log(`${model} Response:`, data.response);
      } else {
        toast.error(`Failed to test ${model}`);
      }
    } catch (error) {
      console.error(`Error testing ${model}:`, error);
      toast.error(`Failed to test ${model}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Neural Weights Hub Dashboard</h1>
          <p className="text-gray-400">Welcome back, {user?.email}</p>
        </div>

        <div className="mb-8">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'apps', name: 'App Deployment' },
                { id: 'models', name: 'GPT Models' },
                { id: 'billing', name: 'Usage & Billing' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {usage && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Usage Overview</h2>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{usage.apiCalls || 0}</div>
                    <div className="text-gray-400 text-sm">API Calls</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{usage.sandboxHours || 0}</div>
                    <div className="text-gray-400 text-sm">Sandbox Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{usage.deployments || 0}</div>
                    <div className="text-gray-400 text-sm">Apps Deployed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">${usage.estimatedCost || 0}</div>
                    <div className="text-gray-400 text-sm">Estimated Cost</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'apps' && <AppDeployment />}

        {activeTab === 'models' && (
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">GPT Model Access</h2>
              <div className="space-y-4">
                <div className="border border-gray-700 rounded p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">GPT-OSS-20B</h3>
                    <span className="text-green-400 text-sm">Available</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">20 billion parameter model via Modal GPU</p>
                  <button
                    onClick={() => testGPTModel('gpt-20b')}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                  >
                    Test Model
                  </button>
                </div>
                <div className="border border-gray-700 rounded p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">GPT-OSS-120B</h3>
                    <span className="text-yellow-400 text-sm">Pro+ Only</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">120 billion parameter model via Modal GPU</p>
                  <button
                    onClick={() => testGPTModel('gpt-120b')}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                  >
                    Test Model
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-8">
            {usage && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{usage.apiCalls || 0}</div>
                    <div className="text-gray-400 text-sm">API Calls</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{usage.sandboxHours || 0}</div>
                    <div className="text-gray-400 text-sm">Sandbox Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{usage.deployments || 0}</div>
                    <div className="text-gray-400 text-sm">Apps Deployed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">${usage.estimatedCost || 0}</div>
                    <div className="text-gray-400 text-sm">Estimated Cost</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
