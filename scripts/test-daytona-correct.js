// Test Daytona API with correct base URL
const DAYTONA_API_KEY = "dtn_f57cfc812c645fb32d9d46166085f220314be715fd96a8e625e0951172caf6cc";
const DAYTONA_ORG_ID = "ae461f26-2a56-4b64-b882-32405be66ffd";
const BASE_URL = "https://app.daytona.io/api";

console.log('🚀 Testing Daytona API with correct base URL...\n');

async function testAPI() {
  try {
    // Test user info first
    console.log('1. Testing user info...');
    const userResponse = await fetch(`${BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${DAYTONA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${userResponse.status} ${userResponse.statusText}`);

    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ User authenticated successfully');
      console.log(`   User ID: ${userData.id || 'N/A'}`);
      console.log(`   Email: ${userData.email || 'N/A'}`);
    } else {
      const errorText = await userResponse.text();
      console.log(`❌ User auth failed: ${userResponse.status}`);
      console.log(`   Error: ${errorText.substring(0, 200)}...`);
      return;
    }

    // Test workspace endpoint with organization header
    console.log('\n2. Testing workspace endpoint...');
    const workspaceResponse = await fetch(`${BASE_URL}/workspace`, {
      headers: {
        'Authorization': `Bearer ${DAYTONA_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Daytona-Organization-ID': DAYTONA_ORG_ID
      }
    });

    console.log(`   Status: ${workspaceResponse.status} ${workspaceResponse.statusText}`);

    if (workspaceResponse.ok) {
      const workspaceData = await workspaceResponse.json();
      console.log('✅ Workspace endpoint successful');
      console.log(`   Found ${workspaceData.length || 0} workspaces`);
      
      if (workspaceData.length > 0) {
        console.log('\n📋 Available Workspaces:');
        workspaceData.forEach((workspace, index) => {
          console.log(`   ${index + 1}. ID: ${workspace.id || 'N/A'}`);
          console.log(`      Name: ${workspace.name || 'N/A'}`);
          console.log(`      State: ${workspace.state || 'N/A'}`);
        });
        
        // Suggest first workspace ID for environment
        const firstWorkspace = workspaceData[0];
        const workspaceId = firstWorkspace.id;
        console.log(`\n🎯 Suggested DAYTONA_WORKSPACE_ID: ${workspaceId}`);
      }
    } else {
      const errorText = await workspaceResponse.text();
      console.log(`❌ Workspace request failed: ${workspaceResponse.status}`);
      console.log(`   Error: ${errorText.substring(0, 200)}...`);
    }

    // Test sandbox endpoint
    console.log('\n3. Testing sandbox endpoint...');
    const sandboxResponse = await fetch(`${BASE_URL}/sandbox`, {
      headers: {
        'Authorization': `Bearer ${DAYTONA_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Daytona-Organization-ID': DAYTONA_ORG_ID
      }
    });

    console.log(`   Status: ${sandboxResponse.status} ${sandboxResponse.statusText}`);

    if (sandboxResponse.ok) {
      const sandboxData = await sandboxResponse.json();
      console.log('✅ Sandbox endpoint successful');
      console.log(`   Found ${sandboxData.length || 0} sandboxes`);
      
      if (sandboxData.length > 0) {
        console.log('\n📋 Available Sandboxes:');
        sandboxData.slice(0, 3).forEach((sandbox, index) => {
          console.log(`   ${index + 1}. ID: ${sandbox.id || 'N/A'}`);
          console.log(`      State: ${sandbox.state || 'N/A'}`);
        });
      }
    } else {
      const errorText = await sandboxResponse.text();
      console.log(`❌ Sandbox request failed: ${sandboxResponse.status}`);
      console.log(`   Error: ${errorText.substring(0, 200)}...`);
    }

    // Test volumes endpoint
    console.log('\n4. Testing volumes endpoint...');
    const volumesResponse = await fetch(`${BASE_URL}/volumes`, {
      headers: {
        'Authorization': `Bearer ${DAYTONA_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Daytona-Organization-ID': DAYTONA_ORG_ID
      }
    });

    console.log(`   Status: ${volumesResponse.status} ${volumesResponse.statusText}`);

    if (volumesResponse.ok) {
      const volumesData = await volumesResponse.json();
      console.log('✅ Volumes endpoint successful');
      console.log(`   Found ${volumesData.length || 0} volumes`);
      
      if (volumesData.length > 0) {
        console.log('\n📋 Available Volumes:');
        volumesData.slice(0, 3).forEach((volume, index) => {
          console.log(`   ${index + 1}. ID: ${volume.id || 'N/A'}`);
          console.log(`      Name: ${volume.name || 'N/A'}`);
          console.log(`      Size: ${volume.size || 'N/A'}`);
        });
      }
    } else {
      const errorText = await volumesResponse.text();
      console.log(`❌ Volumes request failed: ${volumesResponse.status}`);
      console.log(`   Error: ${errorText.substring(0, 200)}...`);
    }

    console.log('\n🎉 API test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env.local with the correct API base URL');
    console.log('2. Replace simulated API calls in daytona-client.ts with real ones');
    console.log('3. Test model deployment workflow in the browser');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPI();
