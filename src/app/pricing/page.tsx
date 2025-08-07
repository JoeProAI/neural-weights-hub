'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap, Users, Building, ArrowRight } from 'lucide-react';
import { PRICING_PLANS, PricingPlan } from '@/lib/stripe';
import { getStripe } from '@/lib/stripe';

export default function PricingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PricingPlan | null>(null);

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    if (plan === 'free') {
      router.push('/dashboard');
      return;
    }

    setLoadingPlan(plan);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const planIcons = {
    free: Zap,
    developer: Zap,
    team: Users,
    enterprise: Building,
  };

  const planColors = {
    free: 'text-gray-600',
    developer: 'text-blue-600',
    team: 'text-purple-600',
    enterprise: 'text-orange-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Deploy OpenAI open weight models with our scalable infrastructure. 
            Start free and upgrade as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {Object.entries(PRICING_PLANS).map(([key, plan]) => {
            const Icon = planIcons[key as PricingPlan];
            const isPopular = key === 'developer';
            
            return (
              <Card key={key} className={`relative ${isPopular ? 'ring-2 ring-blue-500' : ''}`}>
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <Icon className={`h-12 w-12 mx-auto mb-4 ${planColors[key as PricingPlan]}`} />
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && <span className="text-slate-600">/month</span>}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(key as PricingPlan)}
                    disabled={loading || loadingPlan === key}
                    className={`w-full ${
                      isPopular 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    {loadingPlan === key ? (
                      'Loading...'
                    ) : key === 'free' ? (
                      'Get Started Free'
                    ) : (
                      <>
                        Subscribe Now <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div>
              <h3 className="font-semibold text-white mb-2">
                What models can I deploy?
              </h3>
              <p className="text-slate-300 text-sm">
                Deploy OpenAI's gpt-oss-20b and gpt-oss-120b models with Apache 2.0 licensing. 
                Full commercial usage rights included.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">
                How does billing work?
              </h3>
              <p className="text-slate-300 text-sm">
                Monthly subscription with usage-based API calls. 
                Cancel anytime. No hidden fees or setup costs.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">
                Can I upgrade or downgrade?
              </h3>
              <p className="text-slate-300 text-sm">
                Yes! Change your plan anytime. Upgrades are immediate, 
                downgrades take effect at the next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">
                What support do you provide?
              </h3>
              <p className="text-slate-300 text-sm">
                Email support for all paid plans, priority support for Team+, 
                and dedicated support for Enterprise customers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
