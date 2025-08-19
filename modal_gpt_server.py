import modal
import os
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import json

# Modal app configuration
app = modal.App("neural-weights-gpt")

# GPU configuration for different model sizes
GPU_CONFIG = {
    "gpt-20b": modal.gpu.A100(count=1),
    "gpt-120b": modal.gpu.A100(count=2)
}

# Model loading image with dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install([
        "torch>=2.0.0",
        "transformers>=4.30.0",
        "accelerate>=0.20.0",
        "fastapi>=0.100.0",
        "uvicorn>=0.22.0",
        "pydantic>=2.0.0",
        "numpy>=1.24.0",
        "sentencepiece>=0.1.99",
        "protobuf>=4.23.0"
    ])
    .run_commands([
        "pip install flash-attn --no-build-isolation",
    ])
)

# Request/Response models
class ChatRequest(BaseModel):
    messages: list
    model: str = "gpt-20b"
    max_tokens: int = 512
    temperature: float = 0.7
    stream: bool = False

class ChatResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    model: str
    choices: list
    usage: Dict[str, int]

# Model cache to avoid reloading
model_cache = {}

@app.function(
    image=image,
    gpu=GPU_CONFIG["gpt-20b"],
    memory=32768,
    timeout=300,
    allow_concurrent_inputs=10
)
@modal.web_endpoint(method="POST", label="gpt-20b")
def gpt_20b_endpoint(request: ChatRequest):
    """GPT-20B model endpoint for free and paid users"""
    return generate_response(request, "gpt-20b")

@app.function(
    image=image,
    gpu=GPU_CONFIG["gpt-120b"],
    memory=65536,
    timeout=600,
    allow_concurrent_inputs=5
)
@modal.web_endpoint(method="POST", label="gpt-120b")
def gpt_120b_endpoint(request: ChatRequest):
    """GPT-120B model endpoint for paid users only"""
    return generate_response(request, "gpt-120b")

def load_model(model_name: str):
    """Load model with caching"""
    if model_name in model_cache:
        return model_cache[model_name]
    
    print(f"Loading {model_name} model...")
    
    # Model paths - adjust based on your actual model locations
    model_paths = {
        "gpt-20b": "microsoft/DialoGPT-large",  # Placeholder - replace with actual GPT-OSS-20B
        "gpt-120b": "microsoft/DialoGPT-large"  # Placeholder - replace with actual GPT-OSS-120B
    }
    
    model_path = model_paths.get(model_name)
    if not model_path:
        raise ValueError(f"Unknown model: {model_name}")
    
    # Load tokenizer and model
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True
    )
    
    model_cache[model_name] = (tokenizer, model)
    print(f"{model_name} model loaded successfully")
    
    return tokenizer, model

def generate_response(request: ChatRequest, model_name: str) -> ChatResponse:
    """Generate response using the specified model"""
    try:
        tokenizer, model = load_model(model_name)
        
        # Convert messages to prompt
        prompt = ""
        for message in request.messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            if role == "user":
                prompt += f"User: {content}\n"
            elif role == "assistant":
                prompt += f"Assistant: {content}\n"
            elif role == "system":
                prompt += f"System: {content}\n"
        
        prompt += "Assistant: "
        
        # Tokenize input
        inputs = tokenizer.encode(prompt, return_tensors="pt")
        
        # Generate response
        with torch.no_grad():
            outputs = model.generate(
                inputs,
                max_new_tokens=request.max_tokens,
                temperature=request.temperature,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
                repetition_penalty=1.1
            )
        
        # Decode response
        response_text = tokenizer.decode(outputs[0][inputs.shape[1]:], skip_special_tokens=True)
        
        # Create OpenAI-compatible response
        return ChatResponse(
            id=f"chatcmpl-{os.urandom(16).hex()}",
            model=model_name,
            choices=[{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": response_text.strip()
                },
                "finish_reason": "stop"
            }],
            usage={
                "prompt_tokens": inputs.shape[1],
                "completion_tokens": len(tokenizer.encode(response_text)),
                "total_tokens": inputs.shape[1] + len(tokenizer.encode(response_text))
            }
        )
        
    except Exception as e:
        print(f"Error generating response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Model generation failed: {str(e)}")

# Health check endpoint
@app.function(image=image)
@modal.web_endpoint(method="GET", label="health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "models": ["gpt-20b", "gpt-120b"]}

if __name__ == "__main__":
    # Deploy the app
    print("Deploying Neural Weights GPT models to Modal...")
    print("GPT-20B endpoint: https://your-username--neural-weights-gpt-gpt-20b.modal.run")
    print("GPT-120B endpoint: https://your-username--neural-weights-gpt-gpt-120b.modal.run")
