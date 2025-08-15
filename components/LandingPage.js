import { useState } from 'react';
import Link from 'next/link';
import NeuralNetworkBackground from './NeuralNetworkBackground';

export default function LandingPage({ onSignup }) {
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const testAPI = async () => {
    try {
      const response = await fetch('https://joe-9--neural-weights-hub-gpt-20b-inference.modal.run/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello! What is Neural Weights Hub?' }],
          model: 'gpt-oss-20b',
          max_tokens: 150
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`GPT-OSS-20B Response: ${data.choices[0].message.content}`);
      } else {
        alert('API Demo: Neural Weights Hub provides 70% cheaper GPT inference with real GPT-OSS models on NVIDIA GPUs!');
      }
    } catch (error) {
      alert('API Demo: Neural Weights Hub provides 70% cheaper GPT inference with real GPT-OSS models on NVIDIA GPUs!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Interactive Neural Network Background */}
      <NeuralNetworkBackground />
      <div className="fixed inset-0 bg-gradient-radial from-gray-900 via-gray-900 to-black opacity-80"></div>
      
      {/* Navigation */}
      <nav className="relative z-20 bg-black bg-opacity-50 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Neural Weights Hub</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <button onClick={onSignup} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-semibold">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Production AI Infrastructure
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Real GPT-OSS-20B and GPT-OSS-120B models on NVIDIA A10G/A100 GPUs. 
            <span className="text-green-400 font-semibold"> 70% cheaper than OpenAI</span> with your own development environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onSignup}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg rounded font-semibold transition-all"
            >
              Get Started Free
            </button>
            <button 
              onClick={testAPI}
              className="border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white px-8 py-4 text-lg rounded font-semibold transition-all"
            >
              Test Live API
            </button>
          </div>
          <div className="mt-8 text-sm text-gray-400">
            <div>✅ Personal development environment included</div>
            <div>✅ Real GPU infrastructure, not API reselling</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Neural Weights Hub?</h2>
            <p className="text-xl text-gray-400">Enterprise-grade AI infrastructure with personal development environments</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg border border-gray-700 text-center p-8 rounded-lg">
              <div className="w-16 h-16 bg-blue-600 bg-opacity-20 border border-blue-500 flex items-center justify-center mx-auto mb-6 rounded-lg">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Personal Development Environment</h3>
              <p className="text-gray-400 leading-relaxed">Your own Daytona sandbox with GPT models pre-loaded. VS Code, Jupyter, SSH access included.</p>
              <div className="mt-4 text-sm text-blue-400">
                <div>• Pre-configured ML environment</div>
                <div>• Direct model access</div>
              </div>
            </div>
            
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg border border-gray-700 text-center p-8 rounded-lg">
              <div className="w-16 h-16 bg-green-600 bg-opacity-20 border border-green-500 flex items-center justify-center mx-auto mb-6 rounded-lg">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">70% Cost Savings</h3>
              <p className="text-gray-400 leading-relaxed">Serverless architecture means you only pay for what you use, not idle GPU time</p>
              <div className="mt-4 text-sm text-green-400">
                <div>• Pay per inference</div>
                <div>• No idle costs</div>
              </div>
            </div>
            
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg border border-gray-700 text-center p-8 rounded-lg">
              <div className="w-16 h-16 bg-purple-600 bg-opacity-20 border border-purple-500 flex items-center justify-center mx-auto mb-6 rounded-lg">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Real GPU Infrastructure</h3>
              <p className="text-gray-400 leading-relaxed">NVIDIA A10G and A100 GPUs powering real GPT-OSS-20B and GPT-OSS-120B models</p>
              <div className="mt-4 text-sm text-purple-400">
                <div>• A10G: 10GB VRAM</div>
                <div>• A100: 40GB VRAM</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-400">Start free, scale as you grow</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {/* Free Tier */}
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg border border-gray-700 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 text-white">Free</h3>
              <div className="text-4xl font-bold mb-4 text-white">$0<span className="text-lg text-gray-400">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  5,000 requests/month
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  GPT-OSS-20B access
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Basic sandbox (auto-stop)
                </li>
              </ul>
              <button 
                onClick={() => { setSelectedPlan('free'); onSignup(); }}
                className="w-full border border-gray-600 text-gray-300 hover:bg-gray-700 py-3 rounded font-semibold"
              >
                Get Started
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg border-2 border-blue-500 p-8 rounded-lg relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 text-sm font-semibold rounded">Most Popular</div>
              <h3 className="text-2xl font-bold mb-4 text-white">Pro</h3>
              <div className="text-4xl font-bold mb-4 text-white">$49<span className="text-lg text-gray-400">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  50,000 requests/month
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Both GPT models
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Persistent sandbox (2 CPU, 4GB)
                </li>
              </ul>
              <button 
                onClick={() => { setSelectedPlan('pro'); onSignup(); }}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-semibold"
              >
                Start Pro Trial
              </button>
            </div>

            {/* Team Tier */}
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg border border-gray-700 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 text-white">Team</h3>
              <div className="text-4xl font-bold mb-4 text-white">$149<span className="text-lg text-gray-400">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  200,000 requests/month
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  All models + fine-tuning
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  High-performance sandbox (4 CPU, 8GB)
                </li>
              </ul>
              <button 
                onClick={() => { setSelectedPlan('team'); onSignup(); }}
                className="w-full border border-gray-600 text-gray-300 hover:bg-gray-700 py-3 rounded font-semibold"
              >
                Start Team Trial
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg border border-gray-700 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 text-white">Enterprise</h3>
              <div className="text-4xl font-bold mb-4 text-white">$500<span className="text-lg text-gray-400">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Unlimited requests
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Dedicated infrastructure
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Premium sandbox (8 CPU, 16GB)
                </li>
              </ul>
              <button 
                onClick={() => { setSelectedPlan('enterprise'); onSignup(); }}
                className="w-full border border-gray-600 text-gray-300 hover:bg-gray-700 py-3 rounded font-semibold"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">&copy; 2024 Neural Weights Hub. All rights reserved.</p>
            <div className="mt-2 text-sm text-gray-500">
              Powered by Modal • NVIDIA A10G/A100 GPUs • Daytona Development Environments
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
