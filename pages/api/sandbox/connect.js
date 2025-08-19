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

    // If sandbox is stopped, start it first with enhanced retry logic
    if (selectedSandbox.state === 'STOPPED') {
      console.log('Starting stopped sandbox...');
      try {
        const startResponse = await fetch(`${daytonaService.baseUrl}/sandbox/${selectedSandbox.id}/start`, {
          method: 'POST',
          headers
        });
        
        if (startResponse.ok) {
          console.log('Sandbox start command sent successfully');
          
          // Wait for sandbox to start (up to 30 seconds)
          let attempts = 0;
          const maxAttempts = 15; // 30 seconds with 2-second intervals
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const statusResponse = await fetch(`${daytonaService.baseUrl}/sandbox/${selectedSandbox.id}`, {
              method: 'GET',
              headers
            });
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData.state === 'STARTED') {
                console.log(`Sandbox started successfully after ${(attempts + 1) * 2} seconds`);
                selectedSandbox.state = 'STARTED';
                break;
              }
            }
            attempts++;
          }
          
          if (attempts >= maxAttempts) {
            console.warn('Sandbox start timeout - continuing with connection attempt');
          }
        } else {
          console.warn(`Failed to start sandbox: ${startResponse.status}`);
        }
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

    // Enhanced preview link retrieval with retry logic
    let connectionUrl = `https://app.daytona.io/sandbox/${selectedSandbox.id}`;
    let authToken = null;
    let previewAccessible = false;

    // Try to get preview link with retry logic (up to 3 attempts)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Preview link attempt ${attempt}/3`);
        
        const previewResponse = await fetch(`${daytonaService.baseUrl}/sandbox/${selectedSandbox.id}/preview-link/22222`, {
          method: 'GET',
          headers
        });
        
        if (previewResponse.ok) {
          const previewInfo = await previewResponse.json();
          connectionUrl = previewInfo.url;
          authToken = previewInfo.token;
          console.log(`Got preview link on attempt ${attempt}: ${connectionUrl}`);
          
          // Verify preview is accessible
          try {
            const verifyResponse = await fetch(connectionUrl, {
              method: 'HEAD',
              timeout: 5000,
              headers: authToken ? { 'x-daytona-preview-token': authToken } : {}
            });
            previewAccessible = verifyResponse.ok;
            console.log(`Preview accessibility check: ${previewAccessible ? 'accessible' : 'not accessible'}`);
            
            if (previewAccessible) break; // Success, exit retry loop
          } catch (verifyError) {
            console.warn(`Preview verification failed on attempt ${attempt}:`, verifyError.message);
          }
        }
        
        // Wait before retry (except on last attempt)
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (previewError) {
        console.warn(`Preview link error on attempt ${attempt}:`, previewError.message);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Always use port 22222 for production sandboxes (VS Code/development environment)
    connectionUrl = `https://22222-${selectedSandbox.id}.proxy.daytona.work`;
    console.log('Using production sandbox port 22222:', connectionUrl);
    
    // Test port 22222 accessibility
    try {
      const port22222Response = await fetch(connectionUrl, { 
        method: 'HEAD', 
        timeout: 5000,
        headers: authToken ? { 'x-daytona-preview-token': authToken } : {}
      });
      previewAccessible = port22222Response.ok;
      console.log(`Port 22222 accessibility: ${previewAccessible ? 'accessible' : 'not accessible'}`);
    } catch (error) {
      console.warn('Port 22222 not accessible:', error.message);
      previewAccessible = false;
    }

    // Return enhanced connection info with accessibility status
    return res.status(200).json({
      success: true,
      sandbox: {
        id: selectedSandbox.id,
        name: selectedSandbox.name,
        state: selectedSandbox.state,
        snapshot: selectedSandbox.snapshot
      },
      connection: {
        url: connectionUrl,
        authToken: authToken,
        accessible: previewAccessible,
        status: previewAccessible ? 'ready' : 'connecting',
        instructions: authToken 
          ? 'Use the auth token in x-daytona-preview-token header'
          : 'Click to open your development environment'
      },
      message: previewAccessible 
        ? 'Sandbox is ready! Click to open your development environment.'
        : 'Sandbox is starting up. Preview will be available shortly.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sandbox connection error:', error);
    return res.status(500).json({ 
      error: 'Failed to connect to sandbox',
      details: error.message 
    });
  }
}
