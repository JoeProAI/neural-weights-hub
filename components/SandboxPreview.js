import { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, RotateCcw, ExternalLink } from 'lucide-react';

export default function SandboxPreview({ sandboxId, previewUrl, onClose, sandboxName }) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    console.log('SandboxPreview mounted with:', { sandboxId, previewUrl, sandboxName });
    // Reset loading state when sandboxId changes
    setIsLoading(true);
    setError(null);
  }, [sandboxId, previewUrl, sandboxName]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load sandbox preview');
  };

  const refreshPreview = () => {
    setIsLoading(true);
    setError(null);
    // Force iframe reload by changing src
    const iframe = document.getElementById(`preview-iframe-${sandboxId}`);
    if (iframe) {
      const currentSrc = iframe.src;
      iframe.src = '';
      setTimeout(() => {
        iframe.src = currentSrc;
      }, 100);
    }
  };

  const openInNewTab = () => {
    window.open(previewUrl, '_blank');
  };

  console.log('SandboxPreview rendering with state:', { isLoading, error, previewUrl });
  
  return (
    <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-2xl flex flex-col border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} ${
      isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-7xl h-5/6'
    }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-t-lg`}>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
            <div className="ml-4">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                🧪 {sandboxName || 'Neural Lab'}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                ID: {sandboxId.substring(0, 8)}... • Neural Weights Hub
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
              title="Toggle Theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            
            <button
              onClick={refreshPreview}
              className={`p-2 rounded transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
              title="Refresh"
            >
              <RotateCcw size={18} />
            </button>
            
            <button
              onClick={openInNewTab}
              className={`p-2 rounded transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
              title="Open in New Tab"
            >
              <ExternalLink size={18} />
            </button>
            
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className={`p-2 rounded transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
              title={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            
            <button
              onClick={onClose}
              className={`p-2 rounded transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' : 'text-gray-600 hover:text-gray-900 hover:bg-red-200'}`}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 relative ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
          {isLoading && (
            <div className={`absolute inset-0 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">🧪</span>
                  </div>
                </div>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-lg font-medium`}>
                  Initializing Neural Lab...
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                  Preparing your scientific workspace
                </p>
                <div className="mt-4 flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className={`absolute inset-0 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="text-center">
                <div className="mb-6">
                  <div className="text-6xl mb-4">⚠️</div>
                </div>
                <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold mb-2 text-lg`}>
                  Lab Connection Issue
                </p>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}>{error}</p>
                <div className="space-x-3">
                  <button
                    onClick={refreshPreview}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    🔄 Reconnect Lab
                  </button>
                  <button
                    onClick={openInNewTab}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    🚀 Open Externally
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <iframe
            id={`preview-iframe-${sandboxId}`}
            src={previewUrl}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-modals allow-popups"
            title={`Sandbox Preview - ${sandboxName}`}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
          <span>Neural Weights Hub - Development Environment</span>
          <span className="font-mono">{previewUrl}</span>
        </div>
    </div>
  );
}
