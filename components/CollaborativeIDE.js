import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { Play, Save, Download, Share2, Users, Zap, Brain, Code, Terminal, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function CollaborativeIDE({ sandboxId, onClose }) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [aiAssistant, setAiAssistant] = useState(false);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [language, setLanguage] = useState('python');
  const [modelConnected, setModelConnected] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [sandboxConnected, setSandboxConnected] = useState(false);
  const [availableSandboxes, setAvailableSandboxes] = useState([]);
  const [currentSandboxId, setCurrentSandboxId] = useState(sandboxId);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const wsRef = useRef(null);
  const codeEditorRef = useRef(null);
  const outputRef = useRef(null);

  // Initialize WebSocket connection for real-time collaboration
  useEffect(() => {
    if (user && currentSandboxId) {
      loadAvailableSandboxes();
      initializeWebSocket();
      connectToSandbox();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, currentSandboxId]);

  const initializeWebSocket = useCallback(async () => {
    try {
      const token = await user.getIdToken();
      const wsUrl = `wss://${window.location.host}/api/ws/collaborate?sandbox=${sandboxId}&token=${token}`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setWsConnected(true);
        toast.success('🚀 Connected to collaborative session');
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      wsRef.current.onclose = () => {
        setWsConnected(false);
        setTimeout(initializeWebSocket, 3000); // Reconnect after 3s
      };
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }, [user, sandboxId]);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'code_update':
        if (data.userId !== user.uid) {
          setCode(data.code);
        }
        break;
      case 'collaborator_joined':
        setCollaborators(prev => [...prev, data.user]);
        toast(`👋 ${data.user.name} joined the session`);
        break;
      case 'collaborator_left':
        setCollaborators(prev => prev.filter(c => c.id !== data.userId));
        break;
      case 'execution_result':
        setOutput(data.output);
        setIsRunning(false);
        break;
      case 'ai_suggestion':
        if (aiAssistant) {
          showAISuggestion(data.suggestion);
        }
        break;
    }
  };

  const loadAvailableSandboxes = async () => {
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
        setAvailableSandboxes(data.sandboxes || []);
      }
    } catch (error) {
      console.error('Failed to load sandboxes:', error);
    }
  };

  const connectToSandbox = async () => {
    setConnectionStatus('connecting');
    try {
      const token = await user.getIdToken();
      
      // First check sandbox status
      const statusResponse = await fetch('/api/sandbox/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statusResponse.ok) {
        const data = await statusResponse.json();
        const currentSandbox = data.sandboxes?.find(sb => sb.id === currentSandboxId);
        
        if (!currentSandbox) {
          setConnectionStatus('error');
          toast.error('Sandbox not found');
          return;
        }

        if (currentSandbox.state !== 'STARTED') {
          setConnectionStatus('starting');
          toast('Starting sandbox...', { icon: '🚀' });
          
          // Start the sandbox
          const startResponse = await fetch('/api/sandbox/start', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sandboxId: currentSandboxId })
          });

          if (!startResponse.ok) {
            setConnectionStatus('error');
            toast.error('Failed to start sandbox');
            return;
          }

          // Wait for startup
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // Connect to model
        const modelResponse = await fetch('/api/sandbox/connect-model', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sandboxId: currentSandboxId })
        });

        if (modelResponse.ok) {
          setModelConnected(true);
          setSandboxConnected(true);
          setConnectionStatus('connected');
          toast.success('🧠 Connected to sandbox and AI models');
        } else {
          setConnectionStatus('partial');
          setSandboxConnected(true);
          toast.warning('Sandbox connected, but AI models unavailable');
        }
      }
    } catch (error) {
      console.error('Sandbox connection failed:', error);
      setConnectionStatus('error');
      toast.error('Connection failed');
    }
  };

  const switchSandbox = async (newSandboxId) => {
    if (newSandboxId === currentSandboxId) return;
    
    setCurrentSandboxId(newSandboxId);
    setSandboxConnected(false);
    setModelConnected(false);
    setConnectionStatus('disconnected');
    
    // WebSocket will reconnect due to useEffect dependency
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    
    // Send code update to collaborators
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'code_update',
        code: newCode,
        userId: user.uid,
      }));
    }
  };

  const saveProject = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/projects/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sandboxId: currentSandboxId,
          projectName,
          code,
          language,
          collaborators: collaborators.map(c => c.id)
        })
      });

      if (response.ok) {
        toast.success('💾 Project saved');
      } else {
        toast.error('Failed to save project');
      }
    } catch (error) {
      toast.error('Save failed');
    }
  };

  const deployProject = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/projects/deploy', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sandboxId: currentSandboxId,
          projectName,
          code,
          language
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`🚀 Deployed to ${result.url}`);
        window.open(result.url, '_blank');
      } else {
        toast.error('Deployment failed');
      }
    } catch (error) {
      toast.error('Deployment error');
    }
  };

  const exportProject = () => {
    const projectData = {
      name: projectName,
      code,
      language,
      timestamp: new Date().toISOString(),
      collaborators
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('📁 Project exported');
  };

  const askAI = async () => {
    if (!modelConnected) {
      toast.error('AI model not connected');
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          language,
          prompt: 'Help me improve this code and suggest optimizations'
        })
      });

      if (response.ok) {
        const result = await response.json();
        showAISuggestion(result.suggestion);
      }
    } catch (error) {
      toast.error('AI assistance failed');
    }
  };

  const showAISuggestion = (suggestion) => {
    toast((t) => (
      <div className="max-w-md">
        <div className="flex items-center mb-2">
          <Brain className="w-4 h-4 mr-2 text-blue-500" />
          <span className="font-medium">AI Suggestion</span>
        </div>
        <p className="text-sm text-gray-600 mb-3">{suggestion}</p>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              // Apply suggestion logic here
              toast.dismiss(t.id);
            }}
            className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
          >
            Apply
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs"
          >
            Dismiss
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1 rounded border-none text-lg font-medium"
          />
          
          {/* Sandbox Selector */}
          <div className="flex items-center space-x-2">
            <select
              value={currentSandboxId}
              onChange={(e) => switchSandbox(e.target.value)}
              className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
            >
              {availableSandboxes.map((sandbox) => (
                <option key={sandbox.id} value={sandbox.id}>
                  {sandbox.name || `Lab-${sandbox.id.substring(0, 8)}`} ({sandbox.state})
                </option>
              ))}
            </select>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 ${
              connectionStatus === 'connected' ? 'text-green-400' : 
              connectionStatus === 'connecting' || connectionStatus === 'starting' ? 'text-yellow-400' :
              connectionStatus === 'partial' ? 'text-orange-400' : 'text-red-400'
            }`}>
              {connectionStatus === 'connected' ? <Wifi className="w-4 h-4" /> : 
               connectionStatus === 'connecting' || connectionStatus === 'starting' ? <RefreshCw className="w-4 h-4 animate-spin" /> :
               <WifiOff className="w-4 h-4" />}
              <span className="text-sm">
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 connectionStatus === 'starting' ? 'Starting...' :
                 connectionStatus === 'partial' ? 'Partial' : 'Disconnected'}
              </span>
            </div>
            
            {connectionStatus !== 'connected' && connectionStatus !== 'connecting' && connectionStatus !== 'starting' && (
              <button
                onClick={connectToSandbox}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
              >
                Connect
              </button>
            )}
          </div>

          <div className={`flex items-center space-x-1 ${modelConnected ? 'text-green-400' : 'text-gray-500'}`}>
            <Brain className="w-4 h-4" />
            <span className="text-sm">AI {modelConnected ? 'Ready' : 'Offline'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Collaborators */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">{collaborators.length + 1}</span>
          </div>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
          </select>

          {/* AI Assistant Toggle */}
          <button
            onClick={() => setAiAssistant(!aiAssistant)}
            className={`p-2 rounded ${aiAssistant ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
            title="AI Assistant"
          >
            <Brain className="w-4 h-4" />
          </button>

          {/* Action Buttons */}
          <button
            onClick={runCode}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center space-x-1 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>

          <button
            onClick={saveProject}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center space-x-1"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>

          <button
            onClick={deployProject}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded flex items-center space-x-1"
          >
            <Zap className="w-4 h-4" />
            <span>Deploy</span>
          </button>

          <button
            onClick={exportProject}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded flex items-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>

          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Code Editor */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span>⚡</span> Lightning Code Editor
              </h3>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="bash">Bash</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={executeCode}
                disabled={isRunning}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center space-x-2 transform hover:scale-105 transition-all"
              >
                <Play size={18} />
                <span>{isRunning ? '⚡ Running...' : '⚡ Execute'}</span>
              </button>
            </div>
          </div>
          
          <textarea
            ref={codeEditorRef}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="w-full h-80 bg-gray-900 text-white p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="# Enter your code here - lightning-fast execution ready!
print('Hello, Neural Weights Hub!')

# Try some quick examples:
# import numpy as np
# import pandas as pd
# 
# Your code runs instantly in the cloud sandbox..."
            spellCheck={false}
          />
        </div>

        {/* Output Panel */}
        <div className="w-1/3 border-l border-gray-700 flex flex-col">
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Output</span>
          </div>
          <div
            ref={outputRef}
            className="flex-1 bg-black text-green-400 p-4 font-mono text-sm overflow-auto whitespace-pre-wrap"
          >
            {output || 'Ready to run code...\n'}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Sandbox: {currentSandboxId.substring(0, 8)}...</span>
          <span>Language: {language}</span>
          <span>Lines: {code.split('\n').length}</span>
          <span className={`${sandboxConnected ? 'text-green-400' : 'text-red-400'}`}>
            {sandboxConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {collaborators.map((collaborator, index) => (
            <div key={collaborator.id} className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>{collaborator.name}</span>
            </div>
          ))}
          {collaborators.length === 0 && (
            <span className="text-gray-500">Solo session</span>
          )}
        </div>
      </div>
    </div>
  );
}
