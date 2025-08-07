// Updated Daytona API test with correct endpoints
const DAYTONA_API_KEY = "dtn_f57cfc812c645fb32d9d46166085f220314be715fd96a8e625e0951172caf6cc";
const BASE_URL = "https://api.daytona.io";

console.log('🚀 Testing Daytona API with correct endpoints...\n');

async function testAPI() {
  try {
    // Test different API endpoints with proper headers
    const endpoints = [
      '/users/me',
      '/sandbox',
      '/workspace', 
      '/volumes'
    ];

    for (const endpoint of endpoints) {
      const url = `${BASE_URL}${endpoint}`;
      console.log(`Testing: ${url}`);
      
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${DAYTONA_API_KEY}`,
            'Content-Type': 'application/json',
            // Note: X-Daytona-Organization-ID might be required for some endpoints
          }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Success! Data:', JSON.stringify(data, null, 2));
          
          // If this is workspace endpoint, extract workspace IDs
          if (endpoint === '/workspace' && Array.isArray(data)) {
            console.log('\n📋 Available Workspaces:');
            data.forEach((workspace, index) => {
              console.log(`  ${index + 1}. ID: ${workspace.id || workspace.workspaceId || 'N/A'}`);
              console.log(`     Name: ${workspace.name || 'N/A'}`);
              console.log(`     Status: ${workspace.status || workspace.state || 'N/A'}`);
            });
            
            if (data.length > 0) {
              const firstWorkspace = data[0];
              const workspaceId = firstWorkspace.id || firstWorkspace.workspaceId;
              console.log(`\n🎯 Suggested DAYTONA_WORKSPACE_ID: ${workspaceId}`);
            }
          }
          
        } else {
          const errorText = await response.text();
          console.log(`❌ Error: ${errorText.substring(0, 200)}...`);
          
          // Check if it's an organization ID issue
          if (response.status === 400 || response.status === 403) {
            console.log('💡 Tip: This endpoint might require X-Daytona-Organization-ID header');
          }
        }
      } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
      }
      
      console.log('');
    }

    // Test with organization header if we have user info
    console.log('🔄 Testing /users/me to get organization info...');
    try {
      const userResponse = await fetch(`${BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${DAYTONA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('👤 User data:', JSON.stringify(userData, null, 2));
        
        // Extract organization ID if available
        const orgId = userData.organizationId || userData.organization?.id;
        if (orgId) {
          console.log(`\n🏢 Found Organization ID: ${orgId}`);
          console.log('🔄 Retesting workspace endpoint with organization header...');
          
          const workspaceResponse = await fetch(`${BASE_URL}/workspace`, {
            headers: {
              'Authorization': `Bearer ${DAYTONA_API_KEY}`,
              'Content-Type': 'application/json',
              'X-Daytona-Organization-ID': orgId
            }
          });
          
          if (workspaceResponse.ok) {
            const workspaceData = await workspaceResponse.json();
            console.log('✅ Workspace data with org header:', JSON.stringify(workspaceData, null, 2));
          }
        }
      }
    } catch (error) {
      console.log(`❌ User info request failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPI();
