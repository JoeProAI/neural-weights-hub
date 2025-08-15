/**
 * List existing Daytona volumes to get their IDs
 */

const { DaytonaService } = require('../lib/daytona');

async function listDaytonaVolumes() {
  console.log('📋 Listing existing Daytona volumes...');
  
  const daytonaService = new DaytonaService();
  
  try {
    const headers = await daytonaService.createHeaders();
    
    const response = await fetch(`${daytonaService.baseUrl}/volumes`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list volumes: ${response.status} ${errorText}`);
    }
    
    const volumes = await response.json();
    
    console.log(`\n✅ Found ${volumes.length} volumes:\n`);
    
    volumes.forEach((volume, index) => {
      console.log(`${index + 1}. ${volume.name}`);
      console.log(`   ID: ${volume.id}`);
      console.log(`   Size: ${volume.size || 'Unknown'}`);
      console.log(`   Created: ${volume.createdAt || 'Unknown'}`);
      console.log('');
    });
    
    // Look for GPT model volumes specifically
    const gpt20bVolume = volumes.find(v => v.name.includes('gpt-20b') || v.name.includes('20b'));
    const gpt120bVolume = volumes.find(v => v.name.includes('gpt-120b') || v.name.includes('120b'));
    
    console.log('🎯 GPT Model Volumes:');
    if (gpt20bVolume) {
      console.log(`   GPT-20B: ${gpt20bVolume.name} (ID: ${gpt20bVolume.id})`);
    } else {
      console.log('   GPT-20B: Not found');
    }
    
    if (gpt120bVolume) {
      console.log(`   GPT-120B: ${gpt120bVolume.name} (ID: ${gpt120bVolume.id})`);
    } else {
      console.log('   GPT-120B: Not found');
    }
    
    console.log('\n📝 Environment Variables for .env.local:');
    if (gpt20bVolume) {
      console.log(`DAYTONA_GPT_20B_VOLUME_ID=${gpt20bVolume.id}`);
    }
    if (gpt120bVolume) {
      console.log(`DAYTONA_GPT_120B_VOLUME_ID=${gpt120bVolume.id}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to list volumes:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  listDaytonaVolumes().catch(console.error);
}

module.exports = { listDaytonaVolumes };
