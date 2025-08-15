#!/usr/bin/env node

/**
 * Create Optimized Tier-Based Snapshots for Neural Weights Hub
 * Uses Daytona CLI to create snapshots with proper resource allocation and auto-stop disabled
 */

import { execSync } from 'child_process';
import fs from 'fs';

// Tier configurations with appropriate resource allocation
const TIER_CONFIGS = {
  'neural-weights-free': {
    name: 'neural-weights-free-v1',
    description: 'Free tier: 1 CPU, 1GB RAM, GPT-20B access, auto-stop disabled',
    cpu: 1,
    memory: 1,
    disk: 10,
    volumes: ['gpt-20b'],
    autoStop: 0,  // Disabled
    features: ['python', 'jupyter', 'gpt-20b', 'web-terminal']
  },
  'neural-weights-pro': {
    name: 'neural-weights-pro-v1', 
    description: 'Pro tier: 2 CPU, 4GB RAM, both models, auto-stop disabled',
    cpu: 2,
    memory: 4,
    disk: 10,
    volumes: ['gpt-20b', 'gpt-120b'],
    autoStop: 0,  // Disabled
    features: ['python', 'jupyter', 'gpt-20b', 'gpt-120b', 'web-terminal', 'enhanced-compute']
  },
  'neural-weights-team': {
    name: 'neural-weights-team-v1',
    description: 'Team tier: 4 CPU, 8GB RAM, all models, collaboration tools',
    cpu: 4,
    memory: 8,
    disk: 10,
    volumes: ['gpt-20b', 'gpt-120b'],
    autoStop: 0,  // Disabled
    features: ['python', 'jupyter', 'gpt-20b', 'gpt-120b', 'web-terminal', 'max-compute', 'collaboration']
  },
  'neural-weights-enterprise': {
    name: 'neural-weights-enterprise-v1',
    description: 'Enterprise tier: 4 CPU, 8GB RAM, all features, priority support',
    cpu: 4,
    memory: 8,
    disk: 10,
    volumes: ['gpt-20b', 'gpt-120b'],
    autoStop: 0,  // Disabled
    features: ['python', 'jupyter', 'gpt-20b', 'gpt-120b', 'web-terminal', 'max-compute', 'collaboration', 'priority-support']
  }
};

// Volume IDs
const VOLUMES = {
  'gpt-20b': process.env.DAYTONA_GPT_20B_VOLUME_ID || '3d7e7067-1bc1-4094-aaff-9d165fe153e4',
  'gpt-120b': process.env.DAYTONA_GPT_120B_VOLUME_ID || '612103f9-101c-4701-8a33-11f70ab58b1d'
};

function createDockerfile(config) {
  return `FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    gfortran \\
    build-essential \\
    git \\
    curl \\
    vim \\
    nano \\
    htop \\
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --upgrade pip

# Install Neural Weights specific packages
RUN pip install \\
    jupyter \\
    jupyterlab \\
    notebook \\
    torch \\
    transformers \\
    accelerate \\
    openai \\
    anthropic \\
    requests \\
    numpy \\
    pandas \\
    matplotlib \\
    seaborn \\
    plotly \\
    scikit-learn \\
    scipy \\
    huggingface_hub \\
    datasets \\
    tokenizers

# Configure Jupyter
RUN jupyter notebook --generate-config
RUN echo "c.NotebookApp.ip = '0.0.0.0'" >> ~/.jupyter/jupyter_notebook_config.py
RUN echo "c.NotebookApp.port = 8888" >> ~/.jupyter/jupyter_notebook_config.py
RUN echo "c.NotebookApp.open_browser = False" >> ~/.jupyter/jupyter_notebook_config.py
RUN echo "c.NotebookApp.allow_root = True" >> ~/.jupyter/jupyter_notebook_config.py

# Create workspace directories
RUN mkdir -p /workspace/notebooks /workspace/scripts /workspace/models

# Create startup script
RUN echo '#!/bin/bash' > /workspace/start-services.sh
RUN echo 'echo "🚀 Starting Neural Weights services..."' >> /workspace/start-services.sh
RUN echo 'nohup jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root > /workspace/jupyter.log 2>&1 &' >> /workspace/start-services.sh
RUN echo 'echo "✅ Services started!"' >> /workspace/start-services.sh
RUN echo 'echo "📊 Jupyter Lab: http://localhost:8888"' >> /workspace/start-services.sh
RUN chmod +x /workspace/start-services.sh

# Set working directory
WORKDIR /workspace

# Keep container running
CMD ["sleep", "infinity"]`;
}

async function createTierSnapshot(tierName, config) {
  console.log(`\n🚀 Creating ${tierName} snapshot...`);
  console.log(`   Resources: ${config.cpu} CPU, ${config.memory}GB RAM, ${config.disk}GB disk`);
  console.log(`   Volumes: ${config.volumes.join(', ')}`);
  console.log(`   Features: ${config.features.join(', ')}`);

  try {
    // Create Dockerfile
    const dockerfile = createDockerfile(config);
    const dockerfilePath = `./Dockerfile.${tierName}`;
    fs.writeFileSync(dockerfilePath, dockerfile);

    // Build and push snapshot using Daytona CLI
    const command = [
      'daytona snapshot create',
      config.name,
      `--dockerfile ${dockerfilePath}`,
      `--cpu ${config.cpu}`,
      `--memory ${config.memory}`,
      `--disk ${config.disk}`,
      '--auto-stop 0',  // Disable auto-stop
      '--auto-archive 0',  // Disable auto-archive
      '--auto-delete -1'   // Never auto-delete
    ].join(' ');

    console.log(`   📝 Running: ${command}`);
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });

    console.log(`✅ ${tierName} snapshot created successfully`);
    
    // Clean up Dockerfile
    fs.unlinkSync(dockerfilePath);

    // Extract snapshot ID from output (if available)
    const snapshotIdMatch = output.match(/Use '([^']+)' to create/);
    const snapshotId = snapshotIdMatch ? snapshotIdMatch[1] : config.name;

    return {
      tier: tierName,
      snapshotId: snapshotId,
      name: config.name,
      resources: {
        cpu: config.cpu,
        memory: config.memory,
        disk: config.disk
      },
      volumes: config.volumes,
      features: config.features,
      autoStop: config.autoStop,
      status: 'success',
      output: output
    };

  } catch (error) {
    console.error(`❌ Failed to create ${tierName} snapshot:`, error.message);
    
    // Clean up Dockerfile if it exists
    const dockerfilePath = `./Dockerfile.${tierName}`;
    if (fs.existsSync(dockerfilePath)) {
      fs.unlinkSync(dockerfilePath);
    }

    return {
      tier: tierName,
      name: config.name,
      error: error.message,
      status: 'failed'
    };
  }
}

async function createAllTierSnapshots() {
  console.log('🎯 Creating Neural Weights Hub tier-based snapshots');
  console.log('=' * 60);

  const results = [];

  for (const [tierName, config] of Object.entries(TIER_CONFIGS)) {
    const result = await createTierSnapshot(tierName, config);
    results.push(result);

    // Brief pause between snapshots
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Generate summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SNAPSHOT CREATION SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (successful.length > 0) {
    console.log('\n🎉 Successfully created snapshots:');
    successful.forEach(result => {
      console.log(`   • ${result.name}: ${result.snapshotId}`);
      console.log(`     Resources: ${result.resources.cpu} CPU, ${result.resources.memory}GB RAM`);
      console.log(`     Auto-stop: ${result.autoStop === 0 ? 'DISABLED' : 'ENABLED'}`);
      console.log(`     Features: ${result.features.join(', ')}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed snapshots:');
    failed.forEach(result => {
      console.log(`   • ${result.name}: ${result.error}`);
    });
  }

  // Generate environment variables
  console.log('\n📋 Environment Variables for .env.local:');
  console.log('# Neural Weights Tier-Based Snapshots');
  successful.forEach(result => {
    const tier = result.tier.replace('neural-weights-', '').toUpperCase();
    console.log(`NEURAL_WEIGHTS_${tier}_SNAPSHOT=${result.snapshotId}`);
  });

  // Save results to file
  fs.writeFileSync('tier-snapshots-results.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Results saved to tier-snapshots-results.json');

  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createAllTierSnapshots()
    .then(results => {
      const successfulCount = results.filter(r => r.status === 'success').length;
      const totalCount = results.length;

      if (successfulCount === totalCount) {
        console.log(`\n🎉 All ${totalCount} snapshots created successfully!`);
        process.exit(0);
      } else {
        console.log(`\n⚠️ ${successfulCount}/${totalCount} snapshots created successfully`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

export { createAllTierSnapshots, TIER_CONFIGS };
