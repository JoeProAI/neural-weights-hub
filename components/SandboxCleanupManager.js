import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

export default function SandboxCleanupManager() {
  const { user } = useAuth();
  const [sandboxes, setSandboxes] = useState([]);
  const [selectedSandboxes, setSelectedSandboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadSandboxes();
    }
  }, [user]);

  const loadSandboxes = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/sandbox/list-for-cleanup', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSandboxes(data.sandboxes);
      } else {
        toast.error('Failed to load sandboxes');
      }
    } catch (error) {
      console.error('Error loading sandboxes:', error);
      toast.error('Error loading sandboxes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSandbox = (sandboxId, checked) => {
    if (checked) {
      setSelectedSandboxes([...selectedSandboxes, sandboxId]);
    } else {
      setSelectedSandboxes(selectedSandboxes.filter(id => id !== sandboxId));
    }
  };

  const handleSelectAll = (category) => {
    const categoryIds = sandboxes
      .filter(sb => {
        if (category === 'deletable') return sb.canDelete;
        if (category === 'stopped') return sb.state === 'STOPPED' && !sb.isProtected;
        return false;
      })
      .map(sb => sb.id);
    
    setSelectedSandboxes([...new Set([...selectedSandboxes, ...categoryIds])]);
  };

  const handleDeleteSelected = async () => {
    if (selectedSandboxes.length === 0) {
      toast.error('No sandboxes selected');
      return;
    }

    setDeleting(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/sandbox/delete-selected', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sandboxIds: selectedSandboxes })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setSelectedSandboxes([]);
        loadSandboxes(); // Reload the list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete sandboxes');
      }
    } catch (error) {
      console.error('Error deleting sandboxes:', error);
      toast.error('Error deleting sandboxes');
    } finally {
      setDeleting(false);
    }
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'STARTED': return 'text-green-600 bg-green-100';
      case 'STOPPED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
    if (sb.canDelete) acc.canDelete++;
    return acc;
  }, { total: 0, running: 0, stopped: 0, protected: 0, canDelete: 0 });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{summary.canDelete}</div>
          <div className="text-sm text-purple-800">Can Delete</div>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => handleSelectAll('deletable')}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Select All Deletable
          </button>
          <button
            onClick={() => handleSelectAll('stopped')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Select All Stopped
          </button>
          <button
            onClick={() => setSelectedSandboxes([])}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Selection
          </button>
        </div>
        
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600">
            {selectedSandboxes.length} selected
          </span>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedSandboxes.length === 0 || deleting}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting...' : `Delete Selected (${selectedSandboxes.length})`}
          </button>
        </div>
      </div>

      {/* Sandboxes List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Select
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Snapshot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resources
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sandboxes.map((sandbox) => (
                <tr key={sandbox.id} className={selectedSandboxes.includes(sandbox.id) ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedSandboxes.includes(sandbox.id)}
                      onChange={(e) => handleSelectSandbox(sandbox.id, e.target.checked)}
                      disabled={!sandbox.canDelete}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{sandbox.name}</div>
                    <div className="text-sm text-gray-500">{sandbox.id.substring(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStateColor(sandbox.state)}`}>
                      {sandbox.state}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sandbox.age}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sandbox.snapshot || 'None'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sandbox.resources.cpu}CPU / {sandbox.resources.memory}MB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {sandbox.isProtected ? (
                      <span className="text-yellow-600 font-semibold">Protected</span>
                    ) : (
                      <>
                        <a
                          href={sandbox.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Preview
                        </a>
                        {sandbox.canDelete && (
                          <span className="text-green-600">Can Delete</span>
                        )}
                        {!sandbox.canDelete && !sandbox.isProtected && (
                          <span className="text-gray-500">{sandbox.reason}</span>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sandboxes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No sandboxes found
        </div>
      )}
    </div>
  );
}
