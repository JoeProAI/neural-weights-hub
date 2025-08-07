import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { stripe, PRICING_PLANS, PricingPlan } from '@/lib/stripe';

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { plan } = await request.json() as { plan: PricingPlan };

    if (!plan || !(plan in PRICING_PLANS)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pricing plan' },
        { status: 400 }
      );
    }

    const pricingPlan = PRICING_PLANS[plan];

    if (!pricingPlan.priceId) {
      return NextResponse.json(
        { success: false, error: 'Free plan does not require checkout' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: pricingPlan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true&plan=${plan}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.uid,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          userId: user.uid,
          plan: plan,
        },
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create checkout session',
        message: error.message,
      },
      { status: 500 }
    );
  }
});
