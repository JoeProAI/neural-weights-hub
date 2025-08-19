import { verifyIdToken } from '../../../lib/auth';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import JSZip from 'jszip';

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

    const { projectId, format = 'zip', includeAssets = true } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID required' });
    }

    // Get project data
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectDoc.data();
    
    // Verify ownership
    if (project.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate export based on format
    let exportData;
    let filename;
    let contentType;

    switch (format) {
      case 'zip':
        exportData = await generateZipExport(project);
        filename = `${project.name.replace(/\s+/g, '-')}.zip`;
        contentType = 'application/zip';
        break;
        
      case 'json':
        exportData = generateJSONExport(project);
        filename = `${project.name.replace(/\s+/g, '-')}.json`;
        contentType = 'application/json';
        break;
        
      case 'github':
        exportData = await generateGitHubExport(project);
        filename = `${project.name.replace(/\s+/g, '-')}-github.zip`;
        contentType = 'application/zip';
        break;
        
      case 'docker':
        exportData = await generateDockerExport(project);
        filename = `${project.name.replace(/\s+/g, '-')}-docker.zip`;
        contentType = 'application/zip';
        break;
        
      default:
        return res.status(400).json({ error: 'Unsupported export format' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', exportData.length);

    res.status(200).send(exportData);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      error: 'Export failed',
      details: error.message 
    });
  }
}

async function generateZipExport(project) {
  const zip = new JSZip();
  
  // Add main code file
  const extension = getFileExtension(project.language);
  zip.file(`main.${extension}`, project.code);
  
  // Add README
  zip.file('README.md', generateREADME(project));
  
  // Add package files based on language
  if (project.language === 'python') {
    zip.file('requirements.txt', generatePythonRequirements(project.code));
    zip.file('app.py', generatePythonApp(project));
  } else if (project.language === 'javascript' || project.language === 'typescript') {
    zip.file('package.json', generatePackageJSON(project));
    zip.file('server.js', generateNodeServer(project));
  }
  
  // Add deployment files
  zip.file('Dockerfile', generateDockerfile(project));
  zip.file('.gitignore', generateGitignore(project.language));
  
  // Add Neural Weights integration
  zip.file('neural-weights.config.js', generateNeuralWeightsConfig(project));
  
  return await zip.generateAsync({ type: 'nodebuffer' });
}

function generateJSONExport(project) {
  const exportData = {
    ...project,
    exportedAt: new Date().toISOString(),
    exportFormat: 'json',
    neuralWeightsHub: {
      version: '1.0.0',
      platform: 'Neural Weights Hub',
      features: ['collaborative-ide', 'ai-assistance', 'fast-deployment']
    }
  };
  
  return JSON.stringify(exportData, null, 2);
}

async function generateGitHubExport(project) {
  const zip = new JSZip();
  
  // GitHub-ready structure
  zip.file('README.md', generateGitHubREADME(project));
  zip.file('.github/workflows/deploy.yml', generateGitHubActions(project));
  zip.file('.gitignore', generateGitignore(project.language));
  
  // Source code
  const extension = getFileExtension(project.language);
  zip.file(`src/main.${extension}`, project.code);
  
  // Package files
  if (project.language === 'python') {
    zip.file('requirements.txt', generatePythonRequirements(project.code));
    zip.file('setup.py', generatePythonSetup(project));
  } else if (project.language === 'javascript' || project.language === 'typescript') {
    zip.file('package.json', generatePackageJSON(project));
  }
  
  // License
  zip.file('LICENSE', generateMITLicense());
  
  return await zip.generateAsync({ type: 'nodebuffer' });
}

async function generateDockerExport(project) {
  const zip = new JSZip();
  
  // Docker files
  zip.file('Dockerfile', generateDockerfile(project));
  zip.file('docker-compose.yml', generateDockerCompose(project));
  zip.file('.dockerignore', generateDockerignore());
  
  // Application files
  const extension = getFileExtension(project.language);
  zip.file(`app/main.${extension}`, project.code);
  
  // Package files
  if (project.language === 'python') {
    zip.file('app/requirements.txt', generatePythonRequirements(project.code));
  } else if (project.language === 'javascript' || project.language === 'typescript') {
    zip.file('app/package.json', generatePackageJSON(project));
  }
  
  // README for Docker deployment
  zip.file('README.md', generateDockerREADME(project));
  
  return await zip.generateAsync({ type: 'nodebuffer' });
}

function getFileExtension(language) {
  const extensions = {
    python: 'py',
    javascript: 'js',
    typescript: 'ts',
    go: 'go',
    rust: 'rs'
  };
  return extensions[language] || 'txt';
}

function generateREADME(project) {
  return `# ${project.name}

Created with Neural Weights Hub - Lightning-fast collaborative development

## Description
${project.description || 'AI-powered application built with open weight models'}

## Language
${project.language}

## Features
- 🧠 AI-powered development
- ⚡ Lightning-fast execution
- 🤝 Real-time collaboration
- 🚀 One-click deployment

## Getting Started

1. Install dependencies
2. Run the application
3. Deploy to production

## Neural Weights Hub
This project was created using Neural Weights Hub's collaborative IDE with automatic LLM model inference.

Learn more: https://neural-weights-hub.com

## Created
${new Date(project.createdAt?.toDate?.() || project.createdAt).toLocaleDateString()}
`;
}

function generatePythonRequirements(code) {
  const requirements = ['flask==2.3.3', 'requests==2.31.0'];
  
  // Analyze code for common imports
  if (code.includes('numpy') || code.includes('np.')) requirements.push('numpy==1.24.3');
  if (code.includes('pandas') || code.includes('pd.')) requirements.push('pandas==2.0.3');
  if (code.includes('torch') || code.includes('pytorch')) requirements.push('torch==2.0.1');
  if (code.includes('transformers')) requirements.push('transformers==4.30.2');
  if (code.includes('fastapi')) requirements.push('fastapi==0.104.1', 'uvicorn==0.24.0');
  
  return requirements.join('\n');
}

function generateDockerfile(project) {
  const language = project.language;
  
  if (language === 'python') {
    return `FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "main.py"]
`;
  } else if (language === 'javascript' || language === 'typescript') {
    return `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8000

CMD ["npm", "start"]
`;
  }
  
  return `FROM alpine:latest
WORKDIR /app
COPY . .
EXPOSE 8000
CMD ["echo", "Configure Dockerfile for ${language}"]
`;
}

function generateNeuralWeightsConfig(project) {
  return `// Neural Weights Hub Configuration
module.exports = {
  project: {
    name: "${project.name}",
    language: "${project.language}",
    created: "${project.createdAt}",
    version: "1.0.0"
  },
  
  ai: {
    modelAccess: ["gpt-20b", "gpt-120b"],
    features: ["code-assistance", "real-time-collaboration", "fast-deployment"]
  },
  
  deployment: {
    platform: "daytona",
    autoScale: true,
    resources: {
      cpu: 4,
      memory: 8,
      disk: 10
    }
  },
  
  collaboration: {
    realTime: true,
    websocket: true,
    aiAssistance: true
  }
};
`;
}

function generateGitignore(language) {
  const common = `# Neural Weights Hub
.neural-weights/
*.log

# Environment
.env
.env.local
.env.production

# Dependencies
node_modules/
__pycache__/
*.pyc
`;

  if (language === 'python') {
    return common + `
# Python
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
`;
  } else if (language === 'javascript' || language === 'typescript') {
    return common + `
# Node.js
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.npm
.eslintcache
.node_repl_history
*.tgz
.yarn-integrity
.next/
out/
`;
  }
  
  return common;
}

function generateMITLicense() {
  return `MIT License

Copyright (c) ${new Date().getFullYear()} Neural Weights Hub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
}
