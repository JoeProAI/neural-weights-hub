import { DaytonaService } from '../../../lib/daytona.js';
import { verifyUserToken, getUserData } from '../../../lib/firebase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.authorization;
    const userInfo = await verifyUserToken(authHeader);
    const userId = userInfo.userId;
    const userEmail = userInfo.email;

    // Initialize Daytona service
    const daytonaService = new DaytonaService();
    console.log(`Connecting to sandbox for user ${userId}`);

    // Try to get user's sandbox ID from Firestore first
    let userSandboxId = null;
    try {
      const userData = await getUserData(userId);
      if (userData && userData.sandboxId) {
        userSandboxId = userData.sandboxId;
        console.log(`Found user sandbox ID in Firestore: ${userSandboxId}`);
      }
    } catch (firestoreError) {
      console.warn('Firestore lookup failed:', firestoreError.message);
    }

    // Get ALL sandboxes directly from Daytona API
    const headers = await daytonaService.createHeaders();
    const response = await fetch(`${daytonaService.baseUrl}/sandbox`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to list sandboxes: ${response.status} ${response.statusText}`);
    }

    const allSandboxes = await response.json();
    console.log(`Found ${allSandboxes.length} total sandboxes for user ${userId}`);
    
    // Filter sandboxes that belong to this user - use broader matching
    const userSandboxes = allSandboxes.filter(sb => {
        // Check environment variables
        if (sb.env && sb.env['NEURAL_WEIGHTS_USER_ID'] === userId) return true;
        
        // Check labels
        if (sb.labels && sb.labels['neural-weights/user-id'] === userId) return true;
        
        // Check email in labels
        if (userInfo.email && sb.labels && sb.labels['neural-weights/user-email'] === userInfo.email) return true;
        
        // Also check if sandbox name contains user info or was created by this user
        if (sb.name && sb.name.includes(userId.substring(0, 8))) return true;
        
        // Check if sandbox was created by this user (fallback for older sandboxes)
        if (sb.createdBy === userId || sb.owner === userId) return true;
        
        return false;
      });

    console.log(`Found ${userSandboxes.length} user-specific sandboxes`);
    userSandboxes.forEach(sb => {
      console.log(`- ${sb.id}: ${sb.state}, snapshot: ${sb.snapshot}`);
    });

    let selectedSandbox = null;

    // If we have a specific sandbox ID from Firestore, try to find it
    if (userSandboxId) {
      selectedSandbox = userSandboxes.find(sb => sb.id === userSandboxId);
      if (selectedSandbox) {
        console.log(`Using Firestore sandbox: ${selectedSandbox.id}`);
      }
    }

    // If no specific sandbox or it wasn't found, pick the best available one
    if (!selectedSandbox) {
      // Prefer running sandboxes
      selectedSandbox = userSandboxes.find(sb => sb.state === 'STARTED');
      
      // If no running sandbox, pick the most recent one
      if (!selectedSandbox && userSandboxes.length > 0) {
        selectedSandbox = userSandboxes.sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        )[0];
      }
    }

    if (!selectedSandbox) {
      return res.status(404).json({
        error: 'No sandbox found',
        message: 'Please create a sandbox first',
        totalSandboxes: allSandboxes.length,
        userSandboxes: userSandboxes.length
      });
    }

    console.log(`Selected sandbox: ${selectedSandbox.id} (${selectedSandbox.state})`);

    // If sandbox is stopped, start it first
    if (selectedSandbox.state === 'STOPPED') {
      console.log('Starting stopped sandbox...');
      try {
        await fetch(`${daytonaService.baseUrl}/sandbox/${selectedSandbox.id}/start`, {
          method: 'POST',
          headers
        });
        console.log('Sandbox start command sent');
      } catch (startError) {
        console.warn('Failed to start sandbox:', startError.message);
      }
    }

    // Set sandbox to public for preview access
    try {
      await fetch(`${daytonaService.baseUrl}/sandbox/${selectedSandbox.id}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ public: true })
      });
      console.log('Sandbox set to public');
    } catch (publicError) {
      console.warn('Failed to set sandbox public:', publicError.message);
    }

    // Try to get preview link on port 22222 (VS Code)
    let connectionUrl = `https://app.daytona.io/sandbox/${selectedSandbox.id}`;
    let authToken = null;

    try {
      const previewResponse = await fetch(`${daytonaService.baseUrl}/sandbox/${selectedSandbox.id}/preview-link/22222`, {
        method: 'GET',
        headers
      });
      
      if (previewResponse.ok) {
        const previewInfo = await previewResponse.json();
        connectionUrl = previewInfo.url;
        authToken = previewInfo.token;
        console.log('Got preview link for port 22222');
      } else {
        console.log('Preview link not available, using dashboard URL');
      }
    } catch (previewError) {
      console.warn('Preview link error:', previewError.message);
    }

    // Return connection info
    if (authToken) {
      return res.status(200).json({
        success: true,
        sandbox: {
          id: selectedSandbox.id,
          name: selectedSandbox.name,
          state: selectedSandbox.state
        },
        connectionUrl: connectionUrl,
        authToken: authToken,
        instructions: 'Use the auth token in x-daytona-preview-token header'
      });
    } else {
      return res.status(200).json({
        success: true,
        sandbox: {
          id: selectedSandbox.id,
          name: selectedSandbox.name,
          state: selectedSandbox.state
        },
        connectionUrl: connectionUrl,
        instructions: 'Click to open your development environment'
      });
    }

  } catch (error) {
    console.error('Sandbox connection error:', error);
    return res.status(500).json({ 
      error: 'Failed to connect to sandbox',
      details: error.message 
    });
  }
}
