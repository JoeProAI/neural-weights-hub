/**
 * Clean up old Daytona snapshots and sandboxes
 */

const { DaytonaService } = require('../lib/daytona');

async function cleanupDaytona() {
  console.log('🧹 Starting Daytona cleanup...');
  
  const daytonaService = new DaytonaService();
  
  try {
    const headers = await daytonaService.createHeaders();
    
    // List all sandboxes
    console.log('\n📋 Listing all sandboxes...');
    const sandboxResponse = await fetch(`${daytonaService.baseUrl}/sandbox`, {
      method: 'GET',
      headers
    });
    
    if (!sandboxResponse.ok) {
      console.log('⚠️ Could not list sandboxes (may not have permission)');
    } else {
      const sandboxes = await sandboxResponse.json();
      console.log(`Found ${sandboxes.length} sandboxes`);
      
      // Sort by creation date
      sandboxes.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      
      console.log('\n📦 All Sandboxes:');
      sandboxes.forEach((sandbox, index) => {
        const age = sandbox.createdAt ? Math.floor((Date.now() - new Date(sandbox.createdAt)) / (1000 * 60 * 60 * 24)) : 'Unknown';
        console.log(`${index + 1}. ${sandbox.name || sandbox.id}`);
        console.log(`   ID: ${sandbox.id}`);
        console.log(`   Status: ${sandbox.status || 'Unknown'}`);
        console.log(`   Age: ${age} days`);
        console.log(`   Created: ${sandbox.createdAt || 'Unknown'}`);
        console.log('');
      });
      
      // Identify old sandboxes (>3 days, stopped)
      const oldSandboxes = sandboxes.filter(s => {
        const createdAt = new Date(s.createdAt);
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        return createdAt < threeDaysAgo && s.status !== 'running';
      });
      
      if (oldSandboxes.length > 0) {
        console.log(`\n🗑️ Found ${oldSandboxes.length} old sandboxes to delete:`);
        
        for (const sandbox of oldSandboxes) {
          console.log(`\nDeleting sandbox: ${sandbox.name || sandbox.id}`);
          try {
            const deleteResponse = await fetch(`${daytonaService.baseUrl}/sandbox/${sandbox.id}`, {
              method: 'DELETE',
              headers
            });
            
            if (deleteResponse.ok) {
              console.log(`✅ Deleted sandbox: ${sandbox.name || sandbox.id}`);
            } else {
              const errorText = await deleteResponse.text();
              console.log(`❌ Failed to delete sandbox ${sandbox.id}: ${errorText}`);
            }
          } catch (error) {
            console.log(`❌ Error deleting sandbox ${sandbox.id}: ${error.message}`);
          }
          
          // Wait a bit between deletions
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        console.log('\n✨ No old sandboxes found for cleanup');
      }
    }
    
    // List all snapshots using CLI since API might not work
    console.log('\n📋 Listing snapshots using CLI...');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

// Run the script
if (require.main === module) {
  cleanupDaytona().catch(console.error);
}

module.exports = { cleanupDaytona };
