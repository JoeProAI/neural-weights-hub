'use client';

import React, { useState } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { SignInForm } from '@/components/forms/sign-in-form';
import { SignUpForm } from '@/components/forms/sign-up-form';
import { Toaster } from 'react-hot-toast';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {isSignUp ? (
            <SignUpForm onSwitchToSignIn={() => setIsSignUp(false)} />
          ) : (
            <SignInForm onSwitchToSignUp={() => setIsSignUp(true)} />
          )}
        </div>
      </div>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
