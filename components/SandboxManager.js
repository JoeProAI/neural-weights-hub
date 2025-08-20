import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import SandboxPreview from './SandboxPreview';
import CollaborativeIDE from './CollaborativeIDE';
import CreateSandboxButton from './CreateSandboxButton';

export default function SandboxManager() {
  const { user } = useAuth();
  const [sandboxes, setSandboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [previewSandbox, setPreviewSandbox] = useState(null);
  const [ideMode, setIdeMode] = useState(null);

  useEffect(() => {
    fetchSandboxes();
  }, [user]);

  const fetchSandboxes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/sandbox/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSandboxes(data.sandboxes || []);
      } else {
        console.error('Failed to fetch sandboxes');
        toast.error('Failed to load sandboxes');
      }
    } catch (error) {
      console.error('Error fetching sandboxes:', error);
      toast.error('Error loading sandboxes');
    } finally {
      setLoading(false);
    }
  };

  const openCollaborativeIDE = async (sandboxId) => {
    try {
      const token = await user.getIdToken();
      
      // First ensure sandbox is started
      const sandbox = sandboxes.find(sb => sb.id === sandboxId);
      if (sandbox && sandbox.state !== 'STARTED') {
        toast.loading('Starting sandbox for IDE...', { id: `ide-start-${sandboxId}` });
        const startResponse = await fetch('/api/sandbox/start', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sandboxId })
        });
        
        if (!startResponse.ok) {
          const errorData = await startResponse.json();
          toast.error(errorData.error || 'Failed to start sandbox', { id: `ide-start-${sandboxId}` });
          return;
        }
        toast.success('Sandbox started, launching IDE...', { id: `ide-start-${sandboxId}` });
        
        // Wait for startup and refresh sandbox list
        await new Promise(resolve => setTimeout(resolve, 5000));
        await fetchSandboxes();
      }
      
      // Get sandbox connection info with sandboxId parameter
      const response = await fetch('/api/sandbox/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sandboxId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.connection && data.connection.url) {
          // Open the actual Daytona IDE URL in a new window
          const ideUrl = data.connection.url;
          console.log('Opening IDE URL:', ideUrl);
          const newWindow = window.open(ideUrl, '_blank', 'noopener=yes,noreferrer=yes,width=1400,height=900');
          if (newWindow) {
            newWindow.opener = null;
            toast.success('IDE opened in new window!');
          } else {
            toast.error('Popup blocked - please allow popups for this site');
          }
        } else {
          toast.error('No IDE URL available - using fallback');
          setIdeMode(sandboxId);
        }
      } else {
        const error = await response.json();
        console.error('Connection API error:', error);
        toast.error(error.error || 'Failed to get IDE connection');
        setIdeMode(sandboxId);
      }
    } catch (error) {
      console.error('Error opening IDE:', error);
      toast.error('Error opening IDE: ' + error.message);
      setIdeMode(sandboxId);
    }
  };

  const stopSandbox = async (sandboxId) => {
    await handleSandboxAction(sandboxId, 'stop');
  };

  const handleSandboxAction = async (sandboxId, action) => {
    setActionLoading(prev => ({ ...prev, [sandboxId]: action }));
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/sandbox/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sandboxId })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchSandboxes(); // Reload to get updated status
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${action} sandbox`);
      }
    } catch (error) {
      console.error(`Error ${action} sandbox:`, error);
      toast.error(`Error ${action} sandbox`);
    } finally {
      setActionLoading(prev => ({ ...prev, [sandboxId]: null }));
    }
  };

  const refreshSandboxes = async () => {
    await fetchSandboxes();
    toast.success('Sandboxes refreshed');
  };

  const handleDelete = async (sandboxId) => {
    if (!confirm('Are you sure you want to delete this sandbox? This action cannot be undone.')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [sandboxId]: 'deleting' }));
    
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/sandbox/delete-selected', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sandboxIds: [sandboxId] })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Sandbox deleted successfully');
        fetchSandboxes(); // Reload the list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete sandbox');
      }
    } catch (error) {
      console.error('Error deleting sandbox:', error);
      toast.error('Error deleting sandbox');
    } finally {
      setActionLoading(prev => ({ ...prev, [sandboxId]: null }));
    }
  };

  const openPreview = async (sandbox) => {
    try {
      const token = await user.getIdToken();
      
      // If sandbox is stopped, start it first
      if (sandbox.state === 'STOPPED') {
        toast.loading('Starting sandbox for preview...', { id: `preview-start-${sandbox.id}` });
        const startResponse = await fetch('/api/sandbox/start', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sandboxId: sandbox.id })
        });
        
        if (!startResponse.ok) {
          const errorData = await startResponse.json();
          toast.error(errorData.error || 'Failed to start sandbox', { id: `preview-start-${sandbox.id}` });
          return;
        }
        toast.success('Sandbox started, opening preview...', { id: `preview-start-${sandbox.id}` });
        
        // Wait for startup and refresh sandbox list
        await new Promise(resolve => setTimeout(resolve, 5000));
        await fetchSandboxes();
      }
      
      // Get preview URL from API
      const previewResponse = await fetch('/api/sandbox/preview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sandboxId: sandbox.id })
      });

      if (previewResponse.ok) {
        const previewData = await previewResponse.json();
        if (previewData.preview && previewData.preview.url) {
          console.log('Opening preview URL:', previewData.preview.url);
          const newWindow = window.open(previewData.preview.url, '_blank', 'noopener=yes,noreferrer=yes,width=1200,height=800');
          if (newWindow) {
            newWindow.opener = null;
            toast.success('Preview opened in new window!');
          } else {
            toast.error('Popup blocked - please allow popups for this site');
          }
        } else {
          // Try direct URL as fallback
          const directUrl = `https://22222-${sandbox.id}.proxy.daytona.work`;
          console.log('Using direct preview URL:', directUrl);
          const newWindow = window.open(directUrl, '_blank', 'noopener=yes,noreferrer=yes,width=1200,height=800');
          if (newWindow) {
            newWindow.opener = null;
            toast.success('Preview opened with direct URL!');
          } else {
            // Final fallback to modal
            setPreviewSandbox({
              id: sandbox.id,
              name: sandbox.name || `Lab-${sandbox.id.substring(0, 8)}`,
              url: directUrl
            });
          }
        }
      } else {
        const errorData = await previewResponse.json();
        console.error('Preview API error:', errorData);
        
        // Try direct URL as fallback
        const directUrl = `https://22222-${sandbox.id}.proxy.daytona.work`;
        console.log('Preview API failed, trying direct URL:', directUrl);
        const newWindow = window.open(directUrl, '_blank', 'noopener=yes,noreferrer=yes,width=1200,height=800');
        if (newWindow) {
          newWindow.opener = null;
          toast.success('Preview opened with direct URL!');
        } else {
          // Final fallback to modal
          setPreviewSandbox({
            id: sandbox.id,
            name: sandbox.name || `Lab-${sandbox.id.substring(0, 8)}`,
            url: directUrl
          });
        }
      }
    } catch (error) {
      console.error('Error opening preview:', error);
      toast.error('Error opening preview: ' + error.message);
      
      // Final fallback
      const directUrl = `https://22222-${sandbox.id}.proxy.daytona.work`;
      setPreviewSandbox({
        id: sandbox.id,
        name: sandbox.name || `Lab-${sandbox.id.substring(0, 8)}`,
        url: directUrl
      });
    }
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'STARTED': return 'text-green-600 bg-green-100';
      case 'STOPPED': return 'text-red-600 bg-red-100';
      case 'STARTING': return 'text-yellow-600 bg-yellow-100';
      case 'STOPPING': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionButton = (sandbox) => {
    const sandboxId = sandbox.id;
    const currentAction = actionLoading[sandboxId];

    // Debug logging
    console.log('getActionButton called for sandbox:', sandboxId, 'state:', sandbox.state, 'protected:', sandbox.isProtected);

    if (sandbox.isProtected) {
      return (
        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Protected
        </span>
      );
    }

    if (['STARTING', 'STOPPING'].includes(sandbox.state)) {
      return (
        <div className="flex space-x-2">
          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            {sandbox.state === 'STARTING' ? 'Starting...' : 'Stopping...'}
          </span>
          {sandbox.state === 'STARTING' && (
            <button
              onClick={() => {
                console.log('Starting sandbox preview button clicked for:', sandbox.id);
                const previewUrl = `https://22222-${sandbox.id}.proxy.daytona.work`;
                console.log('Setting preview sandbox for starting state:', { id: sandbox.id, name: sandbox.name, url: previewUrl });
                setPreviewSandbox({
                  id: sandbox.id,
                  name: sandbox.name || `Lab-${sandbox.id.substring(0, 8)}`,
                  url: previewUrl
                });
                toast.success('Opening sandbox preview...');
              }}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Preview
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {(sandbox.state === 'STARTED' || sandbox.state === 'started') && (
          <>
            <button
              onClick={() => openCollaborativeIDE(sandboxId)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <span className="flex items-center gap-2">
                🚀 Launch IDE
              </span>
            </button>
            <button
              onClick={() => openPreview(sandbox)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <span className="flex items-center gap-2">
                👁️ Preview
              </span>
            </button>
            <button
              onClick={() => stopSandbox(sandboxId)}
              disabled={currentAction}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-sm rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
            >
              <span className="flex items-center gap-2">
                ⏹️ Stop
              </span>
            </button>
          </>
        )}
        
        {sandbox.state === 'STOPPED' && (
          <>
            <button
              onClick={() => handleSandboxAction(sandboxId, 'start')}
              disabled={currentAction}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
            >
              {currentAction === 'start' ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Starting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  ⚡ Power On
                </span>
              )}
            </button>
            <button
              onClick={() => openCollaborativeIDE(sandboxId)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <span className="flex items-center gap-2">
                🚀 Launch IDE
              </span>
            </button>
            <button
              onClick={() => openPreview(sandbox)}
              disabled={currentAction}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
            >
              {currentAction === 'preview' ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Starting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  👁️ Preview
                </span>
              )}
            </button>
          </>
        )}
        
        {sandbox.canDelete && (
          <button
            onClick={() => handleDelete(sandboxId)}
            disabled={currentAction}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-sm rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
          >
            {currentAction === 'deleting' ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Deleting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                🗑️ Delete
              </span>
            )}
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const summary = sandboxes.reduce((acc, sb) => {
    acc.total++;
    if (sb.state === 'STARTED') acc.running++;
    if (sb.state === 'STOPPED') acc.stopped++;
    if (sb.isProtected) acc.protected++;
    return acc;
  }, { total: 0, running: 0, stopped: 0, protected: 0 });

  return (
    <div className="space-y-6" data-sandbox-manager>
      {/* Header with Create and Refresh Buttons */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">My Sandboxes</h3>
        <div className="flex space-x-3">
          <CreateSandboxButton onSandboxCreated={fetchSandboxes} />
          <button
            onClick={refreshSandboxes}
            disabled={loading}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:bg-gray-500"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
          <div className="text-sm text-blue-800">Total Sandboxes</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{summary.running}</div>
          <div className="text-sm text-green-800">Running</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{summary.stopped}</div>
          <div className="text-sm text-red-800">Stopped</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{summary.protected}</div>
          <div className="text-sm text-yellow-800">Protected</div>
        </div>
      </div>

      {/* Sandboxes Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sandboxes.map((sandbox) => (
          <div key={sandbox.id} className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {sandbox.name || `Lab-${sandbox.id.substring(0, 8)}`}
                </h3>
                <p className="text-sm text-gray-500">{sandbox.id.substring(0, 12)}...</p>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStateColor(sandbox.state)}`}>
                {sandbox.state}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Snapshot:</span>
                <span className="text-gray-900 truncate ml-2">{sandbox.snapshot || 'Default'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Resources:</span>
                <span className="text-gray-900">{sandbox.resources.cpu}CPU / {sandbox.resources.memory}MB / {sandbox.resources.disk}MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Volumes:</span>
                <span className="text-gray-900">{sandbox.volumes?.length || 0} mounted</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-900">{sandbox.createdAt ? new Date(sandbox.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>

            <div className="flex justify-center">
              {getActionButton(sandbox)}
            </div>
          </div>
        ))}
      </div>

      {sandboxes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No sandboxes found</div>
          <p className="text-gray-400 mb-6">Create your first sandbox to get started with Neural Weights Hub</p>
          <CreateSandboxButton onSandboxCreated={fetchSandboxes} />
        </div>
      )}

      {/* Preview Modal */}
      {previewSandbox && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setPreviewSandbox(null)}
          ></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <SandboxPreview
              sandboxId={previewSandbox.id}
              previewUrl={previewSandbox.url}
              sandboxName={previewSandbox.name}
              onClose={() => {
                console.log('Closing preview modal');
                setPreviewSandbox(null);
              }}
            />
          </div>
        </>
      )}

      {/* Collaborative IDE Modal */}
      {ideMode && (
        <CollaborativeIDE
          sandboxId={ideMode.id}
          onClose={() => {
            console.log('Closing IDE modal');
            setIdeMode(null);
          }}
        />
      )}
    </div>
  );
}
