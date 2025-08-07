// Final Daytona API test with organization ID
const DAYTONA_API_KEY = "dtn_f57cfc812c645fb32d9d46166085f220314be715fd96a8e625e0951172caf6cc";
const DAYTONA_ORG_ID = "ae461f26-2a56-4b64-b882-32405be66ffd";
const BASE_URL = "https://api.daytona.io";

console.log('🚀 Testing Daytona API with organization ID...\n');

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

    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ User authenticated successfully');
      console.log(`   User ID: ${userData.id || 'N/A'}`);
      console.log(`   Email: ${userData.email || 'N/A'}`);
    } else {
      console.log(`❌ User auth failed: ${userResponse.status}`);
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

    if (sandboxResponse.ok) {
      const sandboxData = await sandboxResponse.json();
      console.log('✅ Sandbox endpoint successful');
      console.log(`   Found ${sandboxData.length || 0} sandboxes`);
    } else {
      console.log(`❌ Sandbox request failed: ${sandboxResponse.status}`);
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

    if (volumesResponse.ok) {
      const volumesData = await volumesResponse.json();
      console.log('✅ Volumes endpoint successful');
      console.log(`   Found ${volumesData.length || 0} volumes`);
    } else {
      console.log(`❌ Volumes request failed: ${volumesResponse.status}`);
    }

    console.log('\n🎉 API test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env.local with any workspace ID found above');
    console.log('2. Replace simulated API calls in daytona-client.ts with real ones');
    console.log('3. Test model deployment workflow in the browser');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPI();
