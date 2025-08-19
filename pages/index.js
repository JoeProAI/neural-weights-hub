import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import SimpleDashboard from '../components/SimpleDashboard';
import AuthForm from '../components/AuthForm';
import LandingPage from '../components/LandingPage';

export default function Home() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authTimeout, setAuthTimeout] = useState(false);

  // Set timeout for auth loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthTimeout(true);
    }, 2000); // 2 second timeout

    return () => clearTimeout(timer);
  }, []);

  // If user is authenticated, show dashboard with sandbox tab active
  if (user) {
    return <SimpleDashboard defaultTab="sandbox" />;
  }

  // If showing auth form
  if (showAuth) {
    return <AuthForm onBack={() => setShowAuth(false)} />;
  }

  // Show loading briefly, then landing page
  if (loading && !authTimeout) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Initializing Neural Weights Hub...</div>
      </div>
    );
  }

  // Show landing page
  return <LandingPage onSignup={() => setShowAuth(true)} />;
}
