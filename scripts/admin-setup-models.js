// Admin script to setup OpenAI open weight models for the platform
// This should be run once by platform admin to prepare models for user deployments

require('dotenv').config({ path: '.env.local' });

// For now, let's test the API directly
const axios = require('axios');

const DAYTONA_API_KEY = process.env.DAYTONA_API_KEY;
const DAYTONA_API_URL = process.env.DAYTONA_API_URL;
const DAYTONA_ORG_ID = process.env.DAYTONA_ORG_ID;

async function setupModels() {
  console.log('🚀 Setting up OpenAI open weight models for Neural Weights Hub...\n');
  
  try {
    // Create axios client
    const client = axios.create({
      baseURL: DAYTONA_API_URL,
      headers: {
        'Authorization': `Bearer ${DAYTONA_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Daytona-Organization-ID': DAYTONA_ORG_ID,
      },
      timeout: 30000,
    });
    
    // Test API connection first
    console.log('🔗 Testing Daytona API connection...');
    const userResponse = await client.get('/users/me');
    console.log(`✅ Connected as: ${userResponse.data.email}`);
    console.log('');
    
    // Create volume for gpt-oss-20b
    console.log('📦 Creating volume for gpt-oss-20b (100GB)...');
    const volume20b = await client.post('/volumes', {
      name: 'neural-weights-20b-model',
      size: '100GB',
      type: 'persistent',
      encrypted: true,
    });
    console.log('✅ Volume created for gpt-oss-20b');
    console.log(`   Volume ID: ${volume20b.data.id}`);
    console.log(`   Size: ${volume20b.data.size}`);
    console.log('');
    
    // Create volume for gpt-oss-120b
    console.log('📦 Creating volume for gpt-oss-120b (500GB)...');
    const volume120b = await client.post('/volumes', {
      name: 'neural-weights-120b-model',
      size: '500GB',
      type: 'persistent',
      encrypted: true,
    });
    console.log('✅ Volume created for gpt-oss-120b');
    console.log(`   Volume ID: ${volume120b.data.id}`);
    console.log(`   Size: ${volume120b.data.size}`);
    console.log('');
    
    console.log('🎉 Volume setup complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Download models to volumes using Daytona sandbox');
    console.log('2. Create model serving snapshots');
    console.log('3. Test model deployments via web interface');
    console.log('4. Monitor usage and costs in Daytona dashboard');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.response?.data || error.message);
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
