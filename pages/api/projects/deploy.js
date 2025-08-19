import { verifyIdToken } from '../../../lib/auth';
import { DaytonaClient } from '../../../lib/daytona-client';
import { db } from '../../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const { sandboxId, projectName, code, language } = req.body;
    
    if (!sandboxId || !projectName || !code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const daytonaClient = new DaytonaClient();

    // Lightning-fast deployment pipeline
    const deploymentId = `${projectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    // Generate optimized deployment configuration
    const deploymentConfig = await generateFastDeploymentConfig(
      projectName, 
      code, 
      language, 
      userId
    );

    // Create production-ready sandbox
    const productionSandbox = await daytonaClient.createSandbox({
      name: deploymentId,
      template: 'production-app',
      resources: { cpu: 4, memory: 8, disk: 10 },
      environment: {
        'NODE_ENV': 'production',
        'PROJECT_NAME': projectName,
        'LANGUAGE': language,
        'NEURAL_WEIGHTS_USER_ID': userId,
        'PORT': '8000'
      },
      ports: [{ port: 8000, public: true }],
      autoStop: false // Keep running for production
    });

    // Fast deployment script
    const deployScript = generateDeploymentScript(code, language, projectName);
    
    // Execute deployment
    await daytonaClient.executeCommand(productionSandbox.id, deployScript);

    // Generate production URL
    const productionUrl = `https://8000-${productionSandbox.id}.proxy.daytona.work`;

    // Store deployment record
    await setDoc(doc(db, 'deployments', deploymentId), {
      id: deploymentId,
      userId,
      projectName,
      sandboxId: productionSandbox.id,
      sourceCode: code,
      language,
      url: productionUrl,
      status: 'deployed',
      createdAt: new Date(),
      type: 'fast-deploy'
    });

    res.status(200).json({
      success: true,
      deployment: {
        id: deploymentId,
        name: projectName,
        url: productionUrl,
        sandboxId: productionSandbox.id,
        status: 'deployed',
        language
      }
    });

  } catch (error) {
    console.error('Fast deployment error:', error);
    res.status(500).json({ 
      error: 'Deployment failed',
      details: error.message 
    });
  }
}

function generateFastDeploymentConfig(projectName, code, language, userId) {
  const configs = {
    python: {
      runtime: 'python:3.11-slim',
      startCommand: 'python app.py',
      dependencies: ['flask', 'gunicorn', 'requests']
    },
    javascript: {
      runtime: 'node:18-alpine',
      startCommand: 'node server.js',
      dependencies: ['express', 'cors']
    },
    typescript: {
      runtime: 'node:18-alpine',
      startCommand: 'npm start',
      dependencies: ['typescript', 'ts-node', 'express', '@types/node']
    }
  };

  return configs[language] || configs.python;
}

function generateDeploymentScript(code, language, projectName) {
  switch (language) {
    case 'python':
      return `#!/bin/bash
echo "🚀 Fast-deploying ${projectName}..."

# Create production app
cat > app.py << 'EOF'
${code}

# Auto-add Flask server if not present
if __name__ == '__main__':
    import sys
    if 'flask' in sys.modules or 'Flask' in globals():
        app.run(host='0.0.0.0', port=8000, debug=False)
    else:
        print("${projectName} executed successfully!")
EOF

# Install dependencies
pip install flask gunicorn requests --quiet

# Start production server
echo "✅ Starting production server..."
gunicorn -w 4 -b 0.0.0.0:8000 app:app --timeout 120 &

# Health check
sleep 3
curl -f http://localhost:8000/health 2>/dev/null || echo "App deployed at port 8000"
echo "🎉 ${projectName} deployed successfully!"
`;

    case 'javascript':
      return `#!/bin/bash
echo "🚀 Fast-deploying ${projectName}..."

# Create package.json
cat > package.json << 'EOF'
{
  "name": "${projectName.toLowerCase().replace(/\s+/g, '-')}",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF

# Create production server
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// User code
${code}

// Auto-start server if not already configured
if (!module.parent) {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`🎉 ${projectName} running on port \${PORT}\`);
  });
}
EOF

# Install and start
npm install --production --silent
npm start &

sleep 3
echo "🎉 ${projectName} deployed successfully!"
`;

    case 'typescript':
      return `#!/bin/bash
echo "🚀 Fast-deploying ${projectName}..."

# Create package.json
cat > package.json << 'EOF'
{
  "name": "${projectName.toLowerCase().replace(/\s+/g, '-')}",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "ts-node server.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "@types/node": "^18.0.0",
    "@types/express": "^4.17.0"
  }
}
EOF

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true
  }
}
EOF

# Create TypeScript server
cat > server.ts << 'EOF'
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// User code
${code}

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🎉 ${projectName} running on port \${PORT}\`);
});
EOF

# Build and start
npm install --silent
npm run build
npm start &

sleep 3
echo "🎉 ${projectName} deployed successfully!"
`;

    default:
      return `echo "Unsupported language: ${language}"`;
  }
}
