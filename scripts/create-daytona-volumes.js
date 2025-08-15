/**
 * Create Daytona volumes for GPT models
 * This script creates the required volumes that can be mounted to sandboxes
 */

const { DaytonaService } = require('../lib/daytona');

async function createDaytonaVolumes() {
  console.log('🚀 Creating Daytona volumes for GPT models...');
  
  const daytonaService = new DaytonaService();
  
  try {
    const headers = await daytonaService.createHeaders();
    
    // Volume configurations
    const volumes = [
      {
        name: 'neural-weights-gpt-20b',
        description: 'GPT-20B model files for Neural Weights Hub',
        size: '50GB'
      },
      {
        name: 'neural-weights-gpt-120b', 
        description: 'GPT-120B model files for Neural Weights Hub',
        size: '200GB'
      }
    ];
    
    for (const volumeConfig of volumes) {
      console.log(`\n📦 Creating volume: ${volumeConfig.name}`);
      
      try {
        // Check if volume already exists
        const checkResponse = await fetch(`${daytonaService.baseUrl}/volume/${volumeConfig.name}`, {
          method: 'GET',
          headers
        });
        
        if (checkResponse.ok) {
          console.log(`✅ Volume ${volumeConfig.name} already exists`);
          continue;
        }
        
        // Create new volume
        const createResponse = await fetch(`${daytonaService.baseUrl}/volume`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: volumeConfig.name,
            description: volumeConfig.description,
            size: volumeConfig.size
          })
        });
        
        if (createResponse.ok) {
          const volume = await createResponse.json();
          console.log(`✅ Successfully created volume: ${volumeConfig.name}`);
          console.log(`   Volume ID: ${volume.id}`);
          console.log(`   Size: ${volumeConfig.size}`);
        } else {
          const errorText = await createResponse.text();
          console.error(`❌ Failed to create volume ${volumeConfig.name}: ${createResponse.status} ${errorText}`);
        }
        
      } catch (error) {
        console.error(`❌ Error creating volume ${volumeConfig.name}:`, error.message);
      }
    }
    
    console.log('\n🎉 Volume creation process completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Upload GPT model files to the created volumes');
    console.log('2. Test sandbox creation with volume mounting');
    console.log('3. Verify model files are accessible in sandboxes');
    
  } catch (error) {
    console.error('❌ Failed to create volumes:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createDaytonaVolumes().catch(console.error);
}

module.exports = { createDaytonaVolumes };
