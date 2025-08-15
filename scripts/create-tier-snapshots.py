#!/usr/bin/env python3

"""
Create Optimized Tier-Based Snapshots for Neural Weights Hub
Creates snapshots with proper resource allocation and auto-stop disabled
"""

import os
import time
import json
from daytona import (
    Daytona,
    CreateSnapshotParams,
    Image,
    Resources,
    VolumeMount
)

# Initialize Daytona client
daytona = Daytona(
    api_key=os.getenv('DAYTONA_API_KEY'),
    api_url=os.getenv('DAYTONA_SERVER_URL', 'https://app.daytona.io/api'),
    target='us'
)

# Volume IDs from environment
GPT_20B_VOLUME = os.getenv('DAYTONA_GPT_20B_VOLUME_ID', '3d7e7067-1bc1-4094-aaff-9d165fe153e4')
GPT_120B_VOLUME = os.getenv('DAYTONA_GPT_120B_VOLUME_ID', '612103f9-101c-4701-8a33-11f70ab58b1d')

# Snapshot configurations for each tier
TIER_SNAPSHOTS = {
    'neural-weights-free': {
        'name': 'neural-weights-free-v1',
        'description': 'Free tier: 1 CPU, 1GB RAM, GPT-20B access, auto-stop disabled',
        'resources': Resources(cpu=1, memory=1, disk=10),
        'volumes': [
            VolumeMount(volumeId=GPT_20B_VOLUME, mountPath='/models/gpt-20b')
        ],
        'features': ['python', 'jupyter', 'gpt-20b', 'web-terminal']
    },
    'neural-weights-pro': {
        'name': 'neural-weights-pro-v1',
        'description': 'Pro tier: 2 CPU, 4GB RAM, both models, auto-stop disabled',
        'resources': Resources(cpu=2, memory=4, disk=10),
        'volumes': [
            VolumeMount(volumeId=GPT_20B_VOLUME, mountPath='/models/gpt-20b'),
            VolumeMount(volumeId=GPT_120B_VOLUME, mountPath='/models/gpt-120b')
        ],
        'features': ['python', 'jupyter', 'gpt-20b', 'gpt-120b', 'web-terminal', 'enhanced-compute']
    },
    'neural-weights-team': {
        'name': 'neural-weights-team-v1',
        'description': 'Team tier: 4 CPU, 8GB RAM, all models, collaboration tools',
        'resources': Resources(cpu=4, memory=8, disk=10),
        'volumes': [
            VolumeMount(volumeId=GPT_20B_VOLUME, mountPath='/models/gpt-20b'),
            VolumeMount(volumeId=GPT_120B_VOLUME, mountPath='/models/gpt-120b')
        ],
        'features': ['python', 'jupyter', 'gpt-20b', 'gpt-120b', 'web-terminal', 'max-compute', 'collaboration']
    },
    'neural-weights-enterprise': {
        'name': 'neural-weights-enterprise-v1',
        'description': 'Enterprise tier: 4 CPU, 8GB RAM, all features, priority support',
        'resources': Resources(cpu=4, memory=8, disk=10),
        'volumes': [
            VolumeMount(volumeId=GPT_20B_VOLUME, mountPath='/models/gpt-20b'),
            VolumeMount(volumeId=GPT_120B_VOLUME, mountPath='/models/gpt-120b')
        ],
        'features': ['python', 'jupyter', 'gpt-20b', 'gpt-120b', 'web-terminal', 'max-compute', 'collaboration', 'priority-support']
    }
}

def create_tier_snapshot(tier_name, config):
    """Create a snapshot for a specific tier"""
    print(f"\n🚀 Creating {tier_name} snapshot...")
    print(f"   Resources: {config['resources'].cpu} CPU, {config['resources'].memory}GB RAM, {config['resources'].disk}GB disk")
    print(f"   Volumes: {len(config['volumes'])} model volumes")
    print(f"   Features: {', '.join(config['features'])}")
    
    try:
        # Create snapshot with proper resource allocation
        snapshot = daytona.snapshot.create(
            CreateSnapshotParams(
                name=config['name'],
                image=Image.debian_slim("3.12"),  # Python 3.12 base
                resources=config['resources'],
                volumes=config['volumes'],
                labels={
                    'neural-weights/tier': tier_name.replace('neural-weights-', ''),
                    'neural-weights/auto-stop': 'disabled',
                    'neural-weights/features': ','.join(config['features']),
                    'neural-weights/created': time.strftime('%Y-%m-%d %H:%M:%S'),
                    'neural-weights/version': 'v1'
                },
                env_vars={
                    'NEURAL_WEIGHTS_TIER': tier_name.replace('neural-weights-', ''),
                    'PYTHON_VERSION': '3.12',
                    'JUPYTER_ENABLE': 'true',
                    'WEB_TERMINAL_ENABLE': 'true',
                    'AUTO_STOP': 'disabled',
                    'GPT_20B_PATH': '/models/gpt-20b',
                    'GPT_120B_PATH': '/models/gpt-120b' if len(config['volumes']) > 1 else '',
                    'NODE_ENV': 'production'
                }
            ),
            on_logs=lambda log: print(f"   📝 {log}")
        )
        
        print(f"✅ {tier_name} snapshot created: {snapshot.id}")
        return {
            'tier': tier_name,
            'snapshot_id': snapshot.id,
            'name': config['name'],
            'resources': {
                'cpu': config['resources'].cpu,
                'memory': config['resources'].memory,
                'disk': config['resources'].disk
            },
            'volumes': len(config['volumes']),
            'features': config['features'],
            'status': 'success'
        }
        
    except Exception as e:
        print(f"❌ Failed to create {tier_name} snapshot: {str(e)}")
        return {
            'tier': tier_name,
            'name': config['name'],
            'error': str(e),
            'status': 'failed'
        }

def wait_for_snapshot_ready(snapshot_id, max_wait=300):
    """Wait for snapshot to be ready"""
    print(f"⏳ Waiting for snapshot {snapshot_id} to be ready...")
    
    start_time = time.time()
    while time.time() - start_time < max_wait:
        try:
            snapshot = daytona.snapshot.get(snapshot_id)
            if snapshot.state == 'active':
                print(f"✅ Snapshot {snapshot_id} is ready")
                return True
            elif snapshot.state == 'failed':
                print(f"❌ Snapshot {snapshot_id} failed")
                return False
            else:
                print(f"⏳ Snapshot state: {snapshot.state}")
                time.sleep(10)
        except Exception as e:
            print(f"⏳ Checking snapshot status... ({str(e)})")
            time.sleep(10)
    
    print(f"⚠️ Snapshot {snapshot_id} not ready within {max_wait}s")
    return False

def create_all_tier_snapshots():
    """Create all tier-based snapshots"""
    print("🎯 Creating Neural Weights Hub tier-based snapshots")
    print("=" * 60)
    
    results = []
    
    for tier_name, config in TIER_SNAPSHOTS.items():
        result = create_tier_snapshot(tier_name, config)
        results.append(result)
        
        if result['status'] == 'success':
            # Wait for snapshot to be ready before proceeding
            wait_for_snapshot_ready(result['snapshot_id'])
        
        # Brief pause between snapshots
        time.sleep(5)
    
    # Generate summary
    print("\n" + "=" * 60)
    print("📊 SNAPSHOT CREATION SUMMARY")
    print("=" * 60)
    
    successful = [r for r in results if r['status'] == 'success']
    failed = [r for r in results if r['status'] == 'failed']
    
    print(f"✅ Successful: {len(successful)}")
    print(f"❌ Failed: {len(failed)}")
    
    if successful:
        print("\n🎉 Successfully created snapshots:")
        for result in successful:
            print(f"   • {result['name']}: {result['snapshot_id']}")
            print(f"     Resources: {result['resources']['cpu']} CPU, {result['resources']['memory']}GB RAM")
            print(f"     Features: {', '.join(result['features'])}")
    
    if failed:
        print("\n❌ Failed snapshots:")
        for result in failed:
            print(f"   • {result['name']}: {result['error']}")
    
    # Generate environment variables
    print("\n📋 Environment Variables for .env.local:")
    print("# Neural Weights Tier-Based Snapshots")
    for result in successful:
        tier = result['tier'].replace('neural-weights-', '').upper()
        print(f"NEURAL_WEIGHTS_{tier}_SNAPSHOT={result['snapshot_id']}")
    
    # Save results to file
    with open('tier-snapshots-results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Results saved to tier-snapshots-results.json")
    return results

if __name__ == "__main__":
    try:
        results = create_all_tier_snapshots()
        
        successful_count = len([r for r in results if r['status'] == 'success'])
        total_count = len(results)
        
        if successful_count == total_count:
            print(f"\n🎉 All {total_count} snapshots created successfully!")
            exit(0)
        else:
            print(f"\n⚠️ {successful_count}/{total_count} snapshots created successfully")
            exit(1)
            
    except Exception as e:
        print(f"\n💥 Script failed: {str(e)}")
        exit(1)
