# 🚀 Neural Weights Hub - Deployment Guide

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJoeProAI%2Fneural-weights-hub)

## Environment Variables Required

Set these in your Vercel dashboard:

### Firebase Configuration
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
```

### Daytona API Configuration
```bash
DAYTONA_API_KEY=your_daytona_api_key
DAYTONA_API_URL=https://app.daytona.io/api
DAYTONA_WORKSPACE_ID=your_workspace_id
DAYTONA_ORG_ID=your_organization_id
```

### NextAuth Configuration
```bash
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=https://your-app.vercel.app
```

## Deployment Steps

1. **Fork/Clone Repository**
   ```bash
   git clone https://github.com/JoeProAI/neural-weights-hub.git
   cd neural-weights-hub
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Fill in all required values

4. **Test Locally**
   ```bash
   npm run dev
   ```

5. **Deploy to Vercel**
   - Connect your GitHub repo to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically on push

## Post-Deployment Setup

1. **Run Admin Setup** (One-time)
   ```bash
   node scripts/admin-setup-models.js
   ```

2. **Verify Model Volumes**
   - Check Daytona dashboard for created volumes
   - Ensure models are properly uploaded

3. **Test User Flow**
   - Sign up/login via Firebase Auth
   - Deploy model instance
   - Verify API endpoint creation

## Monitoring & Maintenance

- **Daytona Dashboard**: Monitor sandbox usage and costs
- **Vercel Analytics**: Track user engagement
- **Firebase Console**: Manage user authentication
- **GitHub Actions**: Set up CI/CD (optional)

## Scaling Considerations

- **Model Volumes**: Pre-created and shared across users
- **Sandbox Limits**: Monitor Daytona resource limits
- **API Rate Limits**: Implement proper rate limiting
- **Cost Management**: Set up billing alerts

---

🎉 **Your Neural Weights Hub is now live and ready for users!**
