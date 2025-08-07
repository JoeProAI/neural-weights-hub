# 🚀 Step-by-Step OpenAI Models → Daytona Deployment Guide

## Phase 1: Get Daytona Workspace Ready (15 minutes)

### Step 1: Get Your Workspace ID
1. **Login to Daytona Dashboard**: https://app.daytona.io
2. **Find Your Workspace**: Look for your workspace name
3. **Copy Workspace ID**: Should be something like `ws_abc123def456`
4. **Update .env.local**: Replace `your-workspace-id` with real ID

### Step 2: Test Daytona API Connection
```bash
# Test API connection
curl -H "Authorization: Bearer dtn_f57cfc812c645fb32d9d46166085f220314be715fd96a8e625e0951172caf6cc" \
     https://api.daytona.io/workspaces
```

---

## Phase 2: Download OpenAI Open Weight Models (30 minutes)

### Step 3: Get the Models from Hugging Face
The OpenAI models are available on Hugging Face:

```bash
# Install Hugging Face CLI
pip install huggingface_hub

# Login to Hugging Face (get token from https://huggingface.co/settings/tokens)
huggingface-cli login

# Download gpt-oss-20b (smaller model first)
huggingface-cli download openai/gpt-oss-20b --local-dir ./models/gpt-oss-20b

# Download gpt-oss-120b (larger model)
huggingface-cli download openai/gpt-oss-120b --local-dir ./models/gpt-oss-120b
```

### Step 4: Prepare Model Files
```bash
# Check model sizes
du -sh ./models/gpt-oss-20b
du -sh ./models/gpt-oss-120b

# Create model metadata
echo '{"model": "gpt-oss-20b", "size": "20B", "type": "text-generation"}' > ./models/gpt-oss-20b/metadata.json
echo '{"model": "gpt-oss-120b", "size": "120B", "type": "text-generation"}' > ./models/gpt-oss-120b/metadata.json
```

---

## Phase 3: Create Daytona Volumes (20 minutes)

### Step 5: Create Storage Volumes
```javascript
// Real Daytona API calls to replace our simulations

// Create volume for gpt-oss-20b
const volume20b = await fetch('https://api.daytona.io/volumes', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer dtn_f57cfc812c645fb32d9d46166085f220314be715fd96a8e625e0951172caf6cc',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'gpt-oss-20b-volume',
    size: '50GB',
    workspace_id: 'your-workspace-id'
  })
});

// Create volume for gpt-oss-120b
const volume120b = await fetch('https://api.daytona.io/volumes', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer dtn_f57cfc812c645fb32d9d46166085f220314be715fd96a8e625e0951172caf6cc',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'gpt-oss-120b-volume',
    size: '250GB',
    workspace_id: 'your-workspace-id'
  })
});
```

---

## Phase 4: Upload Models to Daytona (45 minutes)

### Step 6: Upload Model Files
```bash
# Use Daytona CLI to upload models
daytona volume upload gpt-oss-20b-volume ./models/gpt-oss-20b
daytona volume upload gpt-oss-120b-volume ./models/gpt-oss-120b
```

### Step 7: Verify Upload
```bash
# Check volume contents
daytona volume ls gpt-oss-20b-volume
daytona volume ls gpt-oss-120b-volume
```

---

## Phase 5: Create Model Environments (30 minutes)

### Step 8: Create Python Environment Template
```dockerfile
# Create Dockerfile for model serving
FROM python:3.11-slim

# Install dependencies
RUN pip install torch transformers accelerate bitsandbytes

# Create model server
COPY model_server.py /app/
WORKDIR /app

# Expose port
EXPOSE 8000

# Start server
CMD ["python", "model_server.py"]
```

### Step 9: Create Model Server
```python
# model_server.py - Simple FastAPI server for models
from fastapi import FastAPI
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import os

app = FastAPI()

# Load model based on environment variable
MODEL_PATH = os.getenv('MODEL_PATH', '/models/gpt-oss-20b')
model = AutoModelForCausalLM.from_pretrained(MODEL_PATH)
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)

@app.post("/generate")
async def generate_text(prompt: str, max_length: int = 100):
    inputs = tokenizer(prompt, return_tensors="pt")
    
    with torch.no_grad():
        outputs = model.generate(
            inputs.input_ids,
            max_length=max_length,
            do_sample=True,
            temperature=0.7
        )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return {"response": response}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": MODEL_PATH}
```

---

## Phase 6: Deploy Environments (25 minutes)

### Step 10: Create Daytona Environments
```javascript
// Create environment for gpt-oss-20b
const env20b = await fetch('https://api.daytona.io/environments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer dtn_f57cfc812c645fb32d9d46166085f220314be715fd96a8e625e0951172caf6cc',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'gpt-oss-20b-env',
    workspace_id: 'your-workspace-id',
    template: 'python-ml',
    volumes: [{
      name: 'gpt-oss-20b-volume',
      mount_path: '/models'
    }],
    environment_variables: {
      MODEL_PATH: '/models/gpt-oss-20b'
    }
  })
});

// Create environment for gpt-oss-120b
const env120b = await fetch('https://api.daytona.io/environments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer dtn_f57cfc812c645fb32d9d46166085f220314be715fd96a8e625e0951172caf6cc',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'gpt-oss-120b-env',
    workspace_id: 'your-workspace-id',
    template: 'python-ml-gpu',
    volumes: [{
      name: 'gpt-oss-120b-volume',
      mount_path: '/models'
    }],
    environment_variables: {
      MODEL_PATH: '/models/gpt-oss-120b'
    }
  })
});
```

---

## Phase 7: Test Model Access (15 minutes)

### Step 11: Test Model Endpoints
```bash
# Test gpt-oss-20b
curl -X POST "https://your-20b-env.daytona.io/generate" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Hello, how are you?", "max_length": 50}'

# Test gpt-oss-120b
curl -X POST "https://your-120b-env.daytona.io/generate" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Explain quantum computing", "max_length": 100}'
```

---

## Phase 8: Update Neural Weights Hub (20 minutes)

### Step 12: Replace Simulated API Calls
Update `daytona-client.ts` with real API endpoints:

```typescript
// Replace simulated calls with real ones
async createModelVolume(model: OpenAIModel): Promise<ModelVolume> {
  const response = await fetch(`${this.apiUrl}/volumes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: `${model}-volume`,
      size: model === 'gpt-oss-20b' ? '50GB' : '250GB',
      workspace_id: this.workspaceId
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create volume: ${response.statusText}`);
  }

  return response.json();
}
```

### Step 13: Update Model Service
Connect to real model endpoints:

```typescript
// Update model-service.ts to use real endpoints
async testModelConnection(model: OpenAIModel): Promise<boolean> {
  try {
    const endpoint = model === 'gpt-oss-20b' 
      ? 'https://your-20b-env.daytona.io/health'
      : 'https://your-120b-env.daytona.io/health';
    
    const response = await fetch(endpoint);
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

---

## 🎉 Success Checklist

- [ ] **Daytona workspace ID obtained**
- [ ] **OpenAI models downloaded from Hugging Face**
- [ ] **Daytona volumes created (50GB + 250GB)**
- [ ] **Models uploaded to volumes**
- [ ] **Python environments deployed**
- [ ] **Model servers running**
- [ ] **API endpoints responding**
- [ ] **Neural Weights Hub connected**
- [ ] **End-to-end testing complete**

---

## 🚀 What You'll Have

After completing these steps:

1. **Real OpenAI Models**: gpt-oss-20b and gpt-oss-120b running on Daytona
2. **API Endpoints**: RESTful APIs for text generation
3. **Scalable Infrastructure**: Auto-scaling Daytona environments
4. **Working Platform**: Neural Weights Hub with real model deployment
5. **Ready for Users**: Functional model testing and comparison

**Total Time**: ~3 hours
**Result**: Fully functional AI model platform with real OpenAI open weight models!

Let's start with Phase 1 - getting your Daytona workspace ID! 🚀
