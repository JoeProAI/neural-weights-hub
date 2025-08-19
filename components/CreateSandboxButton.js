import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { generateSandboxName } from '../lib/scientist-names';

export default function CreateSandboxButton({ onSandboxCreated }) {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const createSandbox = async () => {
    if (!user) {
      toast.error('Please sign in to create a sandbox');
      return;
    }

    setIsCreating(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/sandbox/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: generateSandboxName('Lab'),
          plan: 'free' // Will be determined by user's subscription
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        toast.success(`Sandbox created: ${data.sandbox.name}`);
        if (onSandboxCreated) {
          onSandboxCreated(data.sandbox);
        }
      } else {
        toast.error(data.error || 'Failed to create sandbox');
      }
    } catch (error) {
      console.error('Error creating sandbox:', error);
      toast.error('Error creating sandbox');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <button
      onClick={createSandbox}
      disabled={isCreating}
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {isCreating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Creating...
        </>
      ) : (
        '+ Create Sandbox'
      )}
    </button>
  );
}
