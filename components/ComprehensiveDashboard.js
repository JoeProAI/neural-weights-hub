import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

export default function ComprehensiveDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState(null);
  const [usage, setUsage] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [deploymentForm, setDeploymentForm] = useState({
    type: 'chatbot',
    name: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const token = await user.getIdToken();
      
      // Load resources and usage
      const [resourcesRes, usageRes] = await Promise.all([
        fetch('/api/resources/manage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'status' })
        }),
        fetch('/api/billing/manage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'get_usage' })
        })
      ]);

      if (resourcesRes.ok) {
        const resourcesData = await resourcesRes.json();
        setResources(resourcesData.resources);
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage(usageData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEnvironment = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/resources/manage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'create',
          subscriptionPlan: usage?.plan || 'free'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResources(data.environment);
        toast.success('Environment created successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create environment');
      }
    } catch (error) {
      toast.error('Failed to create environment');
    }
  };

  const startResources = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/resources/manage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'start' })
      });

      if (response.ok) {
        toast.success('Resources started successfully!');
        loadUserData(); // Refresh data
      } else {
        toast.error('Failed to start resources');
      }
    } catch (error) {
      toast.error('Failed to start resources');
    }
  };

  const stopResources = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/resources/manage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'stop' })
      });

      if (response.ok) {
        toast.success('Resources stopped successfully!');
        loadUserData(); // Refresh data
      } else {
        toast.error('Failed to stop resources');
      }
    } catch (error) {
      toast.error('Failed to stop resources');
    }
  };

  const deployApplication = async () => {
    if (!deploymentForm.name) {
      toast.error('Please enter an application name');
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/resources/manage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'deploy',
          appConfig: deploymentForm
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`${deploymentForm.type} deployed successfully!`);
        setDeploymentForm({ type: 'chatbot', name: '', description: '' });
        loadUserData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to deploy application');
      }
    } catch (error) {
      toast.error('Failed to deploy application');
    }
  };

  const openBillingPortal = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/billing/manage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'create_portal_session' })
      });

      if (response.ok) {
        const data = await response.json();
        window.open(data.url, '_blank');
      } else {
        toast.error('Failed to open billing portal');
      }
    } catch (error) {
      toast.error('Failed to open billing portal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading Neural Weights Hub...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Neural Weights Hub</h1>
          <p className="text-gray-400">Welcome back, {user?.email}</p>
          <div className="mt-4 flex items-center space-x-4">
            <span className="text-sm">Plan: <span className="font-semibold text-blue-400">{usage?.plan || 'Free'}</span></span>
            <span className="text-sm">Status: <span className={`font-semibold ${resources?.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
              {resources?.status || 'Not Created'}
            </span></span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'resources', name: 'Resources' },
                { id: 'deploy', name: 'Deploy Apps' },
                { id: 'billing', name: 'Billing' }
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {usage && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Usage Overview</h2>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{usage.usage?.apiCalls || 0}</div>
                    <div className="text-gray-400 text-sm">API Calls</div>
                    <div className="text-xs text-gray-500">Limit: {usage.limits?.apiCalls}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{usage.usage?.sandboxHours || 0}</div>
                    <div className="text-gray-400 text-sm">Sandbox Hours</div>
                    <div className="text-xs text-gray-500">Limit: {usage.limits?.sandboxHours}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{usage.usage?.deployments || 0}</div>
                    <div className="text-gray-400 text-sm">Deployments</div>
                    <div className="text-xs text-gray-500">Limit: {usage.limits?.deployments}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">${usage.usage?.estimatedCost || 0}</div>
                    <div className="text-gray-400 text-sm">Estimated Cost</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {!resources ? (
                  <button
                    onClick={createEnvironment}
                    className="bg-blue-600 hover:bg-blue-700 p-4 rounded text-left"
                  >
                    <h3 className="font-semibold mb-2">Create Environment</h3>
                    <p className="text-gray-400 text-sm">Set up your development environment</p>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={startResources}
                      className="bg-green-600 hover:bg-green-700 p-4 rounded text-left"
                    >
                      <h3 className="font-semibold mb-2">Start Resources</h3>
                      <p className="text-gray-400 text-sm">Boot up your sandbox and APIs</p>
                    </button>
                    <button
                      onClick={stopResources}
                      className="bg-red-600 hover:bg-red-700 p-4 rounded text-left"
                    >
                      <h3 className="font-semibold mb-2">Stop Resources</h3>
                      <p className="text-gray-400 text-sm">Save costs by stopping unused resources</p>
                    </button>
                  </>
                )}
                <button
                  onClick={openBillingPortal}
                  className="bg-gray-700 hover:bg-gray-600 p-4 rounded text-left"
                >
                  <h3 className="font-semibold mb-2">Billing Portal</h3>
                  <p className="text-gray-400 text-sm">Manage subscription and payments</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-8">
            {resources ? (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Your Resources</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">Sandbox Environment</h3>
                      <p className="text-gray-400 text-sm">ID: {resources.sandboxId}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={startResources}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
                      >
                        Start
                      </button>
                      <button
                        onClick={stopResources}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
                      >
                        Stop
                      </button>
                      <button
                        onClick={() => window.open(resources.endpoints?.sandbox, '_blank')}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="border border-gray-700 rounded p-4">
                      <h4 className="font-semibold mb-2">Resources</h4>
                      <div className="text-sm text-gray-400">
                        <div>CPU: {resources.resources?.cpu} cores</div>
                        <div>Memory: {resources.resources?.memory}GB</div>
                        <div>Disk: {resources.resources?.disk}GB</div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-700 rounded p-4">
                      <h4 className="font-semibold mb-2">Endpoints</h4>
                      <div className="text-sm text-gray-400">
                        <div>API: <a href={resources.endpoints?.api} target="_blank" className="text-blue-400 hover:underline">Open</a></div>
                        <div>Chatbot: <a href={resources.endpoints?.chatbot} target="_blank" className="text-blue-400 hover:underline">Open</a></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <h2 className="text-xl font-semibold mb-4">No Resources Created</h2>
                <p className="text-gray-400 mb-4">Create your development environment to get started</p>
                <button
                  onClick={createEnvironment}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-semibold"
                >
                  Create Environment
                </button>
              </div>
            )}
          </div>
        )}

        {/* Deploy Tab */}
        {activeTab === 'deploy' && (
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Deploy Application</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Application Type</label>
                  <select
                    value={deploymentForm.type}
                    onChange={(e) => setDeploymentForm({...deploymentForm, type: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  >
                    <option value="chatbot">AI Chatbot</option>
                    <option value="api">REST API</option>
                    <option value="webapp">Web Application</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Application Name</label>
                  <input
                    type="text"
                    value={deploymentForm.name}
                    onChange={(e) => setDeploymentForm({...deploymentForm, name: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    placeholder="my-awesome-app"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={deploymentForm.description}
                    onChange={(e) => setDeploymentForm({...deploymentForm, description: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 h-24"
                    placeholder="Describe your application..."
                  />
                </div>
                
                <button
                  onClick={deployApplication}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-semibold"
                >
                  Deploy Application
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-8">
            {usage && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Current Plan: {usage.plan}</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Usage This Month</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>API Calls:</span>
                        <span>{usage.usage?.apiCalls || 0} / {usage.limits?.apiCalls}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sandbox Hours:</span>
                        <span>{usage.usage?.sandboxHours || 0} / {usage.limits?.sandboxHours}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deployments:</span>
                        <span>{usage.usage?.deployments || 0} / {usage.limits?.deployments}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Estimated Cost:</span>
                        <span>${usage.usage?.estimatedCost || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">Plan Limits</h3>
                    <div className="space-y-2 text-sm text-gray-400">
                      <div>CPU: {usage.limits?.cpu} cores</div>
                      <div>Memory: {usage.limits?.memory}GB</div>
                      <div>Disk: {usage.limits?.disk}GB</div>
                      <div>Auto-stop: {usage.limits?.autoStop ? `${usage.limits.autoStop}s` : 'Disabled'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={openBillingPortal}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-semibold"
                  >
                    Manage Subscription
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
