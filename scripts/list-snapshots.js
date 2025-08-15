/**
 * List all Daytona snapshots for cleanup
 */

const { DaytonaService } = require('../lib/daytona');

async function listSnapshots() {
  console.log('📋 Listing all Daytona snapshots...');
  
  const daytonaService = new DaytonaService();
  
  try {
    const headers = await daytonaService.createHeaders();
    
    const response = await fetch(`${daytonaService.baseUrl}/snapshots`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list snapshots: ${response.status} ${errorText}`);
    }
    
    const snapshots = await response.json();
    
    console.log(`\n✅ Found ${snapshots.length} snapshots:\n`);
    
    // Sort by creation date (newest first)
    snapshots.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    
    snapshots.forEach((snapshot, index) => {
      console.log(`${index + 1}. ${snapshot.name || snapshot.id}`);
      console.log(`   ID: ${snapshot.id}`);
      console.log(`   Created: ${snapshot.createdAt || 'Unknown'}`);
      console.log(`   Size: ${snapshot.size || 'Unknown'}`);
      console.log(`   Status: ${snapshot.status || 'Unknown'}`);
      console.log('');
    });
    
    // Identify potential cleanup candidates
    console.log('🧹 Cleanup Candidates:');
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const oldSnapshots = snapshots.filter(s => {
      const createdAt = new Date(s.createdAt);
      return createdAt < oneWeekAgo && !s.name?.includes('production') && !s.name?.includes('neural-weights');
    });
    
    if (oldSnapshots.length > 0) {
      console.log(`\n📦 ${oldSnapshots.length} old snapshots (>1 week, non-production):`);
      oldSnapshots.forEach(snapshot => {
        console.log(`   - ${snapshot.name || snapshot.id} (${snapshot.createdAt})`);
      });
    } else {
      console.log('\n✨ No obvious cleanup candidates found');
    }
    
    // Show production snapshots to keep
    const productionSnapshots = snapshots.filter(s => 
      s.name?.includes('production') || 
      s.name?.includes('neural-weights') ||
      s.name?.includes('gpt-')
    );
    
    if (productionSnapshots.length > 0) {
      console.log(`\n🔒 Production snapshots to KEEP (${productionSnapshots.length}):`);
      productionSnapshots.forEach(snapshot => {
        console.log(`   - ${snapshot.name || snapshot.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to list snapshots:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  listSnapshots().catch(console.error);
}

module.exports = { listSnapshots };
