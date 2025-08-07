// Simple Daytona API test
const DAYTONA_API_KEY = "dtn_f57cfc812c645fb32d9d46166085f220314be715fd96a8e625e0951172caf6cc";

console.log('🚀 Testing Daytona API...\n');

async function testAPI() {
  try {
    // Test different API endpoints
    const endpoints = [
      'https://api.daytona.io/user',
      'https://api.daytona.io/workspaces',
      'https://api.daytona.io/v1/user',
      'https://api.daytona.io/v1/workspaces'
    ];

    for (const endpoint of endpoints) {
      console.log(`Testing: ${endpoint}`);
      
      try {
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${DAYTONA_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Success! Data:', JSON.stringify(data, null, 2));
          break;
        } else {
          const errorText = await response.text();
          console.log(`❌ Error: ${errorText.substring(0, 200)}...`);
        }
      } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
      }
      
      console.log('');
    }

    // Also test with curl-like approach
    console.log('📋 Manual test command:');
    console.log(`curl -H "Authorization: Bearer ${DAYTONA_API_KEY}" https://api.daytona.io/user`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPI();
