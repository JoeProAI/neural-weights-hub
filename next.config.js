/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        http2: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    // Exclude problematic modules from client bundle
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'firebase-admin': 'firebase-admin',
        'firebase-admin/app': 'firebase-admin/app',
        'firebase-admin/auth': 'firebase-admin/auth',
      });
    }
    
    return config;
  },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    DAYTONA_API_KEY: process.env.DAYTONA_API_KEY,
    DAYTONA_ORG_ID: process.env.DAYTONA_ORG_ID,
    MODAL_API_KEY: process.env.MODAL_API_KEY,
  }
}

module.exports = nextConfig
