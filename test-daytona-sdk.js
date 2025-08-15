// Test Daytona SDK Integration
const { Daytona } = require('@daytonaio/sdk');

async function testDaytonaSDK() {
  console.log('Testing Daytona SDK...');
  
  try {
    // Initialize with your API key
    const daytona = new Daytona({
      apiKey: process.env.DAYTONA_API_KEY,
      apiUrl: 'https://app.daytona.io/api',
      target: 'us'
    });

    console.log('Daytona SDK initialized successfully');
    
    // Try to create a simple sandbox
    console.log('Creating test sandbox...');
    const sandbox = await daytona.create({
      language: 'python',
      envVars: {
        'TEST_VAR': 'test_value',
        'NODE_ENV': 'production'
      }
    });

    console.log('Sandbox created successfully:', sandbox.id);
    return sandbox;
    
  } catch (error) {
    console.error('Daytona SDK Error:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

// Run test if called directly
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  testDaytonaSDK()
    .then(sandbox => {
      console.log('✅ Test successful! Sandbox ID:', sandbox.id);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testDaytonaSDK };
