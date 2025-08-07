# 🧠 Neural Weights Hub

**Deploy OpenAI's Open Weight Models with Enterprise-Grade Infrastructure**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJoeProAI%2Fneural-weights-hub)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

> 🚀 **Production-Ready Platform** for deploying OpenAI's gpt-oss-20b and gpt-oss-120b models with real Daytona infrastructure integration.

## ✨ Features

### 🤖 **Model Deployment**
- **gpt-oss-20b** (20B parameters) - Efficient reasoning and code generation
- **gpt-oss-120b** (120B parameters) - Advanced reasoning with CoT capabilities
- **Apache 2.0 License** - Full commercial usage rights
- **One-Click Deployment** - From model to API in minutes

### 🏗️ **Infrastructure**
- **Daytona Integration** - Real cloud sandbox environments
- **Persistent Volumes** - Shared model storage for cost efficiency
- **Auto-Scaling** - Handle traffic spikes automatically
- **Health Monitoring** - Real-time deployment status

### 💳 **Monetization Ready**
- **Stripe Integration** - Subscription billing built-in
- **Usage Tracking** - API call monitoring and limits
- **Multiple Tiers** - Free, Developer Pro ($49), Team ($149), Enterprise ($500)
- **Revenue Analytics** - Track MRR and customer metrics

## 🚀 Quick Start

### 1. **Clone & Install**
```bash
git clone https://github.com/JoeProAI/neural-weights-hub.git
cd neural-weights-hub
npm install
```

### 2. **Environment Setup**
Copy `.env.example` to `.env.local` and configure your API keys.

### 3. **Admin Setup (One-Time)**
```bash
# Create model volumes in Daytona
node scripts/admin-setup-models.js
```

### 4. **Run Development Server**
```bash
npm run dev
# Open http://localhost:3000
```

## 💰 **Business Model**

- **Month 1**: $2,500 MRR (50 customers)
- **Month 2**: $8,750 MRR (200 customers)  
- **Month 3**: $24,500 MRR (500 customers)
- **Year 1 Target**: $1.2M ARR

## 🛠 Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: PostgreSQL with Prisma ORM
- **Sandbox Environments**: Daytona API integration
- **AI Models**: OpenAI gpt-oss-20b and gpt-oss-120b

## 📋 Development Phases

### Phase 1: Foundation (Weeks 1-2)
- [x] Project initialization and setup
- [ ] Firebase Authentication integration
- [ ] Database design and Prisma setup

### Phase 2: Model Showcase (Weeks 3-5)
- [ ] OpenAI API integration
- [ ] Model comparison interface
- [ ] Interactive demo pages

### Phase 3: Daytona Integration (Weeks 6-8)
- [ ] Daytona client implementation
- [ ] Sandbox management interface
- [ ] One-click deployment flow

### Phase 4: App Building Framework (Weeks 9-12)
- [ ] Template library creation
- [ ] Development tools (prompt studio, cost calculator)
- [ ] Collaborative features

### Phase 5: Launch Preparation (Weeks 13-14)
- [ ] Subscription system
- [ ] Final documentation and testing
- [ ] Production deployment

## 🚦 Getting Started

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd openai-app-builder
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Add your API keys and configuration
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

- [Architecture Overview](./docs/architecture.md)
- [API Reference](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing Guidelines](./docs/contributing.md)

## 💰 Pricing Tiers

- **Free**: Limited sandbox time, basic templates, gpt-oss-20b access
- **Pro ($29/month)**: Extended sandbox time, all templates, gpt-oss-120b access
- **Team ($99/month)**: Shared sandboxes, collaboration features, priority support
- **Enterprise**: Custom pricing, dedicated environments, white-labeling

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./docs/contributing.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the open source AI community**
