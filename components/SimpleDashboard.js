import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import SandboxManager from './SandboxManager';

export default function SimpleDashboard({ defaultTab = 'overview' }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState({});

  const testAPI = async (endpoint, method = 'POST', body = {}) => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: method !== 'GET' ? JSON.stringify(body) : undefined
      });

      const data = await response.json();
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          data: data,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          status: 'ERROR',
          data: { error: error.message },
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold">Neural Weights Hub</h1>
              <p className="text-gray-400">Welcome back, {user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="flex space-x-8">
            {['overview', 'sandbox', 'models', 'billing'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Account Status</h3>
                <div className="text-green-400 text-2xl font-bold">Active</div>
                <p className="text-gray-400 text-sm">All systems operational</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Subscription</h3>
                <div className="text-blue-400 text-2xl font-bold">Free</div>
                <p className="text-gray-400 text-sm">Upgrade for more features</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Usage</h3>
                <div className="text-yellow-400 text-2xl font-bold">0/100</div>
                <p className="text-gray-400 text-sm">API calls this month</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('sandbox')}
                  className="bg-green-600 hover:bg-green-700 p-4 rounded text-left"
                >
                  <h4 className="font-semibold">Create Sandbox</h4>
                  <p className="text-sm text-gray-300">Set up your development environment</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('models')}
                  className="bg-blue-600 hover:bg-blue-700 p-4 rounded text-left"
                >
                  <h4 className="font-semibold">Test AI Models</h4>
                  <p className="text-sm text-gray-300">Try GPT-20B and GPT-120B</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sandbox Tab - Direct Access */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            {/* Instant Sandbox Access */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Lightning-Fast Development Environment</h3>
                <button
                  onClick={() => testAPI('/sandbox/cleanup', 'POST')}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm"
                >
                  {loading ? 'Cleaning...' : 'Cleanup'}
                </button>
              </div>
              
              {/* Direct Sandbox Manager - No Extra Navigation */}
              <SandboxManager />
            </div>
          </div>
        )}

        {/* Models Tab */}
        {activeTab === 'models' && (
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">AI Model Testing</h3>
              <p className="text-gray-400 mb-6">Test GPT models powered by Modal.com</p>
              
              <div className="space-y-4">
                <button
                  onClick={() => testAPI('/gpt/test', 'POST', { prompt: 'Hello, how are you?', model: 'gpt-20b' })}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded font-semibold"
                >
                  {loading ? 'Testing...' : 'Test GPT-20B Model'}
                </button>
                
                <button
                  onClick={() => testAPI('/gpt/test', 'POST', { prompt: 'Explain quantum computing', model: 'gpt-120b' })}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 px-6 py-3 rounded font-semibold ml-4"
                >
                  {loading ? 'Testing...' : 'Test GPT-120B Model'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Billing & Usage</h3>
              <p className="text-gray-400 mb-6">Manage your subscription and view usage</p>
              
              <div className="space-y-4">
                <button
                  onClick={() => testAPI('/user/billing', 'GET')}
                  disabled={loading}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-6 py-3 rounded font-semibold"
                >
                  {loading ? 'Loading...' : 'Check Billing Status'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold mb-4">API Test Results</h3>
            <div className="space-y-4">
              {Object.entries(testResults).map(([endpoint, result]) => (
                <div key={endpoint} className="border border-gray-700 rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{endpoint}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        result.status === 200 ? 'bg-green-600' : 
                        result.status < 500 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}>
                        {result.status}
                      </span>
                      <span className="text-xs text-gray-400">{result.timestamp}</span>
                    </div>
                  </div>
                  
                  {/* Show connection URL if available */}
                  {result.data.connectionUrl && (
                    <div className="mb-3">
                      <a 
                        href={result.data.connectionUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold inline-block"
                      >
                        Open Sandbox
                      </a>
                    </div>
                  )}
                  
                  <pre className="bg-gray-900 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
