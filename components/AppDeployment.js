import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

export default function AppDeployment() {
  const { user } = useAuth();
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [showDeployForm, setShowDeployForm] = useState(false);
  
  // Form state
  const [appName, setAppName] = useState('');
  const [modelType, setModelType] = useState('gpt-20b');
  const [appType, setAppType] = useState('chatbot');
  const [customCode, setCustomCode] = useState('');

  useEffect(() => {
    if (user) {
      loadDeployments();
    }
  }, [user]);

  const loadDeployments = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/apps/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDeployments(data.deployments || []);
      }
    } catch (error) {
      console.error('Error loading deployments:', error);
    } finally {
      setLoading(false);
    }
  };

  const deployApp = async () => {
    if (!appName.trim()) {
      toast.error('Please enter an app name');
      return;
    }

    setDeploying(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/apps/deploy', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appName: appName.trim(),
          modelType,
          appType,
          customCode: customCode.trim() || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`${appName} is being deployed! Available in 2-3 minutes.`);
        setShowDeployForm(false);
        setAppName('');
        setCustomCode('');
        loadDeployments(); // Refresh list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to deploy app');
      }
    } catch (error) {
      console.error('Error deploying app:', error);
      toast.error('Failed to deploy app');
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white">Loading your apps...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">AI App Deployment</h2>
          <p className="text-gray-400">Deploy GPU-powered apps with your models</p>
        </div>
        <button
          onClick={() => setShowDeployForm(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium"
        >
          Deploy New App
        </button>
      </div>

      {/* Deploy Form Modal */}
      {showDeployForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Deploy AI App</h3>
            
            <div className="space-y-4">
              {/* App Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  App Name
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  placeholder="my-ai-chatbot"
                />
              </div>

              {/* Model Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  AI Model
                </label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  <option value="gpt-20b">GPT-OSS-20B (All Plans)</option>
                  <option value="gpt-120b">GPT-OSS-120B (Pro+ Only)</option>
                </select>
              </div>

              {/* App Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  App Template
                </label>
                <select
                  value={appType}
                  onChange={(e) => setAppType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  <option value="chatbot">Chatbot (Web UI)</option>
                  <option value="api">REST API Service</option>
                  <option value="webapp">Full Web App</option>
                  <option value="custom">Custom Code</option>
                </select>
              </div>

              {/* Custom Code */}
              {appType === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Custom Python Code (app.py)
                  </label>
                  <textarea
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white h-32"
                    placeholder="# Your custom Python app code here..."
                  />
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDeployForm(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={deployApp}
                disabled={deploying}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
              >
                {deploying ? 'Deploying...' : 'Deploy App'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deployments List */}
      <div className="grid gap-4">
        {deployments.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium text-white mb-2">No Apps Deployed</h3>
            <p className="text-gray-400 mb-4">Deploy your first AI-powered app to get started</p>
            <button
              onClick={() => setShowDeployForm(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
            >
              Deploy Your First App
            </button>
          </div>
        ) : (
          deployments.map((deployment) => (
            <div key={deployment.id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{deployment.appName}</h3>
                  <p className="text-gray-400">Model: {deployment.modelType.toUpperCase()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    deployment.status === 'running' ? 'bg-green-900 text-green-200' :
                    deployment.status === 'deploying' ? 'bg-yellow-900 text-yellow-200' :
                    'bg-red-900 text-red-200'
                  }`}>
                    {deployment.status}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">App URL</p>
                  <a 
                    href={deployment.appUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm break-all"
                  >
                    {deployment.appUrl}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Estimated Cost</p>
                  <p className="text-white">${deployment.estimatedCost}/hour</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <a
                  href={deployment.appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white"
                >
                  Open App
                </a>
                <button className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm text-white">
                  View Logs
                </button>
                <button className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm text-white">
                  Stop App
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* App Templates Info */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Available App Templates</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-700 rounded p-4">
            <h4 className="font-medium text-white mb-2">Chatbot</h4>
            <p className="text-gray-400 text-sm">Web-based chat interface with your AI model</p>
          </div>
          <div className="border border-gray-700 rounded p-4">
            <h4 className="font-medium text-white mb-2">REST API</h4>
            <p className="text-gray-400 text-sm">FastAPI service for programmatic access</p>
          </div>
          <div className="border border-gray-700 rounded p-4">
            <h4 className="font-medium text-white mb-2">Custom App</h4>
            <p className="text-gray-400 text-sm">Deploy your own Python application</p>
          </div>
        </div>
      </div>
    </div>
  );
}
