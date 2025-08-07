// Admin script to setup OpenAI open weight models for the platform
// This should be run once by platform admin to prepare models for user deployments

require('dotenv').config({ path: '.env.local' });

const { DaytonaClient } = require('../src/lib/daytona-client.ts');

async function setupModels() {
  console.log('🚀 Setting up OpenAI open weight models for Neural Weights Hub...\n');
  
  try {
    const daytonaClient = new DaytonaClient();
    
    // Setup gpt-oss-20b first (smaller, faster to test)
    console.log('📦 Setting up gpt-oss-20b...');
    const model20b = await daytonaClient.setupModelVolume('gpt-oss-20b');
    console.log('✅ gpt-oss-20b setup complete');
    console.log(`   Volume ID: ${model20b.volumeId}`);
    console.log(`   Size: ${model20b.size}`);
    console.log('');
    
    // Setup gpt-oss-120b (larger, will take longer)
    console.log('📦 Setting up gpt-oss-120b...');
    const model120b = await daytonaClient.setupModelVolume('gpt-oss-120b');
    console.log('✅ gpt-oss-120b setup complete');
    console.log(`   Volume ID: ${model120b.volumeId}`);
    console.log(`   Size: ${model120b.size}`);
    console.log('');
    
    console.log('🎉 All models setup complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Models are now available for user deployments');
    console.log('2. Users can deploy model instances via the web interface');
    console.log('3. Each user deployment creates a new sandbox with model server');
    console.log('4. Monitor usage and costs in Daytona dashboard');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('1. Check your Daytona API credentials in .env.local');
    console.error('2. Ensure you have sufficient Daytona credits/limits');
    console.error('3. Verify network connectivity to Daytona API');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupModels();
}

module.exports = { setupModels };
