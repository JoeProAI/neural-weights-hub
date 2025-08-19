import { verifyIdToken } from '../../../lib/auth';
import { DaytonaClient } from '../../../lib/daytona-client';

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
    const userEmail = decodedToken.email;

    const { sandboxId } = req.body;
    if (!sandboxId) {
      return res.status(400).json({ error: 'Sandbox ID required' });
    }

    const daytonaClient = new DaytonaClient();

    // Get sandbox details
    const sandbox = await daytonaClient.getSandbox(sandboxId);
    if (!sandbox) {
      return res.status(404).json({ error: 'Sandbox not found' });
    }

    // Verify ownership
    const isOwner = sandbox.env?.['NEURAL_WEIGHTS_USER_ID'] === userId ||
                   sandbox.labels?.['neural-weights/user-id'] === userId ||
                   sandbox.labels?.['neural-weights/user-email'] === userEmail;

    if (!isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Configure model connection in sandbox
    const modelConfig = {
      GPT_20B_ENDPOINT: process.env.MODAL_GPT_20B_ENDPOINT || 'http://172.20.0.8:8000',
      GPT_120B_ENDPOINT: process.env.MODAL_GPT_120B_ENDPOINT || 'http://172.20.0.9:8001',
      MODAL_API_KEY: process.env.MODAL_API_KEY,
      NEURAL_WEIGHTS_API_URL: process.env.VERCEL_URL || 'https://neural-weights-olipl75o8-joeproais-projects.vercel.app',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      XAI_API_KEY: process.env.XAI_API_KEY
    };

    // Execute setup script in sandbox
    const setupScript = `#!/bin/bash
# Neural Weights Hub - Model Connection Setup
echo "🧠 Connecting to Neural Weights AI models..."

# Set environment variables
${Object.entries(modelConfig).map(([key, value]) => 
  `export ${key}="${value}"`
).join('\n')}

# Install required packages
pip install --quiet openai requests websockets

# Create model client
cat > /tmp/neural_model_client.py << 'EOF'
import os
import requests
import json

class NeuralWeightsClient:
    def __init__(self):
        self.gpt_20b_endpoint = os.getenv('GPT_20B_ENDPOINT')
        self.gpt_120b_endpoint = os.getenv('GPT_120B_ENDPOINT')
        self.api_key = os.getenv('MODAL_API_KEY')
        self.openai_key = os.getenv('OPENAI_API_KEY')
        self.xai_key = os.getenv('XAI_API_KEY')
    
    def chat_completion(self, messages, model="gpt-20b", max_tokens=150):
        """Lightning-fast chat completion with open weight models"""
        endpoint = self.gpt_20b_endpoint if model == "gpt-20b" else self.gpt_120b_endpoint
        
        try:
            response = requests.post(
                f"{endpoint}/v1/chat/completions",
                headers={'Authorization': f'Bearer {self.api_key}'},
                json={
                    'model': model,
                    'messages': messages,
                    'max_tokens': max_tokens,
                    'temperature': 0.7
                },
                timeout=5  # Fast timeout for lightning speed
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def quick_generate(self, prompt, model="gpt-20b"):
        """Ultra-fast text generation"""
        messages = [{"role": "user", "content": prompt}]
        result = self.chat_completion(messages, model)
        
        if "error" in result:
            return f"Error: {result['error']}"
        
        return result.get('choices', [{}])[0].get('message', {}).get('content', 'No response')

# Test connection
client = NeuralWeightsClient()
test_result = client.quick_generate("Hello! Test connection to Neural Weights Hub.")
print(f"✅ Model connection test: {test_result[:100]}...")
EOF

# Run the setup
python /tmp/neural_model_client.py

echo "🚀 Neural Weights models connected and ready!"
echo "📁 Client available at: /tmp/neural_model_client.py"
`;

    // Execute setup in sandbox
    const result = await daytonaClient.executeCommand(sandboxId, setupScript);

    // Create WebSocket connection info for real-time collaboration
    const wsConfig = {
      url: `wss://${req.headers.host}/api/ws/collaborate`,
      sandboxId: sandboxId,
      userId: userId,
      modelEndpoints: {
        gpt20b: modelConfig.GPT_20B_ENDPOINT,
        gpt120b: modelConfig.GPT_120B_ENDPOINT
      }
    };

    res.status(200).json({
      success: true,
      message: 'Models connected successfully',
      sandbox: {
        id: sandboxId,
        status: sandbox.status,
        modelAccess: ['gpt-20b', 'gpt-120b'],
        endpoints: {
          gpt20b: modelConfig.GPT_20B_ENDPOINT,
          gpt120b: modelConfig.GPT_120B_ENDPOINT
        }
      },
      collaboration: wsConfig,
      setupResult: result
    });

  } catch (error) {
    console.error('Error connecting models:', error);
    res.status(500).json({ 
      error: 'Failed to connect models',
      details: error.message 
    });
  }
}
