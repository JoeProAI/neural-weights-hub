// Test Daytona API connection and get workspace info
require('dotenv').config({ path: '.env.local' });

const DAYTONA_API_KEY = process.env.DAYTONA_API_KEY;
const DAYTONA_API_URL = process.env.DAYTONA_API_URL || 'https://api.daytona.io';

console.log('🚀 Testing Daytona API Connection...\n');

async function testDaytonaConnection() {
  try {
    console.log('API URL:', DAYTONA_API_URL);
    console.log('API Key:', DAYTONA_API_KEY ? `${DAYTONA_API_KEY.substring(0, 10)}...` : 'NOT SET');
    console.log('');

    if (!DAYTONA_API_KEY) {
      console.error('❌ DAYTONA_API_KEY not found in .env.local');
      return;
    }

    // Test 1: Get user info
    console.log('📋 Step 1: Getting user info...');
    const userResponse = await fetch(`${DAYTONA_API_URL}/user`, {
      headers: {
        'Authorization': `Bearer ${DAYTONA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      console.error(`❌ User API failed: ${userResponse.status} ${userResponse.statusText}`);
      const errorText = await userResponse.text();
      console.error('Error details:', errorText);
      return;
    }

    const userData = await userResponse.json();
    console.log('✅ User info retrieved:', userData.email || userData.username || 'Unknown');

    // Test 2: Get workspaces
    console.log('\n📋 Step 2: Getting workspaces...');
    const workspacesResponse = await fetch(`${DAYTONA_API_URL}/workspaces`, {
      headers: {
        'Authorization': `Bearer ${DAYTONA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!workspacesResponse.ok) {
      console.error(`❌ Workspaces API failed: ${workspacesResponse.status} ${workspacesResponse.statusText}`);
      const errorText = await workspacesResponse.text();
      console.error('Error details:', errorText);
      return;
    }

    const workspaces = await workspacesResponse.json();
    console.log('✅ Workspaces found:', workspaces.length);

    if (workspaces.length > 0) {
      console.log('\n🎯 Available Workspaces:');
      workspaces.forEach((workspace, index) => {
        console.log(`  ${index + 1}. Name: ${workspace.name}`);
        console.log(`     ID: ${workspace.id}`);
        console.log(`     Status: ${workspace.status || 'unknown'}`);
        console.log('');
      });

      // Suggest the first workspace
      const firstWorkspace = workspaces[0];
      console.log('💡 Suggested workspace for .env.local:');
      console.log(`DAYTONA_WORKSPACE_ID="${firstWorkspace.id}"`);
    } else {
      console.log('⚠️  No workspaces found. You may need to create one first.');
    }

    // Test 3: Get volumes (if workspace exists)
    if (workspaces.length > 0) {
      const workspaceId = workspaces[0].id;
      console.log(`\n📋 Step 3: Getting volumes for workspace ${workspaceId}...`);
      
      const volumesResponse = await fetch(`${DAYTONA_API_URL}/workspaces/${workspaceId}/volumes`, {
        headers: {
          'Authorization': `Bearer ${DAYTONA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (volumesResponse.ok) {
        const volumes = await volumesResponse.json();
        console.log('✅ Volumes found:', volumes.length);
        
        if (volumes.length > 0) {
          console.log('📦 Existing volumes:');
          volumes.forEach(volume => {
            console.log(`  - ${volume.name} (${volume.size || 'unknown size'})`);
          });
        }
      } else {
        console.log('⚠️  Could not fetch volumes (this is normal for new workspaces)');
      }
    }

    console.log('\n🎉 Daytona API connection successful!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env.local with the workspace ID above');
    console.log('2. Run the model deployment script');
    console.log('3. Start uploading OpenAI models to Daytona volumes');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check if your API key is correct');
    console.error('2. Verify you have access to the Daytona API');
    console.error('3. Make sure your internet connection is working');
  }
}

// Run the test
testDaytonaConnection();
