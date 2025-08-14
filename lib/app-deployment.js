// AI App Deployment Service - Deploy user apps with GPU model access
export class AppDeploymentService {
  constructor() {
    this.modalApiKey = process.env.MODAL_API_KEY;
    this.daytonaApiKey = process.env.DAYTONA_API_KEY;
    this.daytonaOrgId = process.env.DAYTONA_ORG_ID;
    this.baseUrl = 'https://api.daytona.io/v1';
  }

  // Deploy user's AI app with GPU model access
  async deployUserApp(userId, appConfig) {
    try {
      const { appName, modelType, appCode, requirements, plan } = appConfig;
      
      // Create deployment configuration
      const deploymentConfig = {
        name: `${appName}-${userId.slice(0, 8)}`,
        template: 'python-gpu-app',
        autoStop: plan === 'free' ? true : false,
        resources: this.getGPUResourcesForPlan(plan),
        environment: {
          'NEURAL_WEIGHTS_USER_ID': userId,
          'NEURAL_WEIGHTS_PLAN': plan,
          'APP_NAME': appName,
          'MODEL_TYPE': modelType,
          'GPT_20B_ENDPOINT': process.env.MODAL_GPT_20B_ENDPOINT,
          'GPT_120B_ENDPOINT': process.env.MODAL_GPT_120B_ENDPOINT,
          'MODAL_API_KEY': this.modalApiKey,
          'PORT': '8000'
        },
        volumes: this.getModelVolumesForApp(modelType, plan),
        ports: [{ port: 8000, public: true }],
        startup: this.generateStartupScript(appCode, requirements)
      };

      // Deploy to Daytona
      const headers = {
        'Authorization': `Bearer ${this.daytonaApiKey}`,
        'X-Daytona-Organization-ID': this.daytonaOrgId,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${this.baseUrl}/sandboxes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(deploymentConfig)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to deploy app: ${response.status} ${error}`);
      }

      const deployment = await response.json();
      
      return {
        deploymentId: deployment.id,
        appUrl: `https://${deployment.id}.proxy.daytona.work:8000`,
        status: 'deploying',
        resources: deploymentConfig.resources,
        modelAccess: modelType,
        estimatedCost: this.calculateDeploymentCost(plan)
      };

    } catch (error) {
      console.error('Error deploying user app:', error);
      throw error;
    }
  }

  // Get GPU resources based on plan
  getGPUResourcesForPlan(plan) {
    const gpuResources = {
      'free': { cpu: 2, memory: 4, disk: 10, gpu: 'none' },
      'pro': { cpu: 4, memory: 8, disk: 10, gpu: 'T4' },
      'team': { cpu: 4, memory: 8, disk: 10, gpu: 'A10G' },
      'enterprise': { cpu: 4, memory: 8, disk: 10, gpu: 'A100' }
    };
    return gpuResources[plan] || gpuResources['free'];
  }

  // Get model volume access for app
  getModelVolumesForApp(modelType, plan) {
    const volumes = [];
    
    // Mount appropriate model based on type and plan
    if (modelType === 'gpt-20b') {
      volumes.push({
        volumeId: '0ccfd7df-2945-4679-9688-20bc2f50e0d2', // GPT-20B volume
        mountPath: '/app/models/gpt-20b',
        readOnly: true
      });
    }
    
    if (modelType === 'gpt-120b' && ['pro', 'team', 'enterprise'].includes(plan)) {
      volumes.push({
        volumeId: '9e102245-93e4-45d0-a7f7-fa18df34944a', // GPT-120B volume
        mountPath: '/app/models/gpt-120b',
        readOnly: true
      });
    }
    
    return volumes;
  }

  // Generate startup script for user's app
  generateStartupScript(appCode, requirements) {
    return `#!/bin/bash
# Neural Weights Hub - User App Deployment
echo "Starting AI app deployment..."

# Install requirements
pip install -r requirements.txt

# Install additional packages if needed
pip install flask fastapi uvicorn torch transformers

# Set up environment
export PYTHONPATH="/app:$PYTHONPATH"
export CUDA_VISIBLE_DEVICES=0

# Start the user's app
echo "Launching user application..."
python app.py
`;
  }

  // Create app template for users
  generateAppTemplate(modelType, appType) {
    const templates = {
      'chatbot': this.getChatbotTemplate(modelType),
      'api': this.getAPITemplate(modelType),
      'webapp': this.getWebAppTemplate(modelType),
      'custom': this.getCustomTemplate(modelType)
    };
    
    return templates[appType] || templates['api'];
  }

  getChatbotTemplate(modelType) {
    return {
      'app.py': `
import os
from flask import Flask, request, jsonify, render_template
import requests

app = Flask(__name__)

# Neural Weights Hub Model Access
MODEL_ENDPOINT = os.getenv('${modelType.toUpperCase()}_ENDPOINT')
MODAL_API_KEY = os.getenv('MODAL_API_KEY')

@app.route('/')
def home():
    return render_template('chat.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')
    
    response = requests.post(f"{MODEL_ENDPOINT}/v1/chat/completions", 
        headers={'Authorization': f'Bearer {MODAL_API_KEY}'},
        json={
            'model': '${modelType}',
            'messages': [{'role': 'user', 'content': user_message}],
            'max_tokens': 150
        })
    
    if response.ok:
        ai_response = response.json()['choices'][0]['message']['content']
        return jsonify({'response': ai_response})
    else:
        return jsonify({'error': 'Model unavailable'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
`,
      'requirements.txt': 'flask==2.3.3\nrequests==2.31.0',
      'templates/chat.html': `
<!DOCTYPE html>
<html>
<head><title>AI Chatbot</title></head>
<body>
    <div id="chat"></div>
    <input type="text" id="message" placeholder="Type your message...">
    <button onclick="sendMessage()">Send</button>
    <script>
        function sendMessage() {
            const message = document.getElementById('message').value;
            fetch('/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message: message})
            }).then(r => r.json()).then(data => {
                document.getElementById('chat').innerHTML += 
                    '<p><b>You:</b> ' + message + '</p>' +
                    '<p><b>AI:</b> ' + data.response + '</p>';
                document.getElementById('message').value = '';
            });
        }
    </script>
</body>
</html>`
    };
  }

  getAPITemplate(modelType) {
    return {
      'app.py': `
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os

app = FastAPI(title="AI API Service", version="1.0.0")

MODEL_ENDPOINT = os.getenv('${modelType.toUpperCase()}_ENDPOINT')
MODAL_API_KEY = os.getenv('MODAL_API_KEY')

class ChatRequest(BaseModel):
    message: str
    max_tokens: int = 150

@app.post("/generate")
async def generate_text(request: ChatRequest):
    response = requests.post(f"{MODEL_ENDPOINT}/v1/chat/completions",
        headers={'Authorization': f'Bearer {MODAL_API_KEY}'},
        json={
            'model': '${modelType}',
            'messages': [{'role': 'user', 'content': request.message}],
            'max_tokens': request.max_tokens
        })
    
    if response.ok:
        return response.json()
    else:
        raise HTTPException(status_code=500, detail="Model unavailable")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`,
      'requirements.txt': 'fastapi==0.104.1\nuvicorn==0.24.0\nrequests==2.31.0'
    };
  }

  // Calculate deployment cost
  calculateDeploymentCost(plan) {
    const costs = {
      'free': 0,
      'pro': 0.10, // $0.10/hour
      'team': 0.25, // $0.25/hour
      'enterprise': 0.50 // $0.50/hour
    };
    return costs[plan] || 0;
  }

  // Get deployment status
  async getDeploymentStatus(deploymentId) {
    try {
      const headers = {
        'Authorization': `Bearer ${this.daytonaApiKey}`,
        'X-Daytona-Organization-ID': this.daytonaOrgId
      };

      const response = await fetch(`${this.baseUrl}/sandboxes/${deploymentId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to get deployment status: ${response.status}`);
      }

      const deployment = await response.json();
      return {
        status: deployment.status,
        appUrl: `https://${deploymentId}.proxy.daytona.work:8000`,
        resources: deployment.resources,
        uptime: deployment.uptime
      };

    } catch (error) {
      console.error('Error getting deployment status:', error);
      throw error;
    }
  }
}

export const appDeploymentService = new AppDeploymentService();
