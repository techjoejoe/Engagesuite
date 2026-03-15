import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any,
});

// Map tiers to Stripe Price IDs (set these in .env.local)
const PRICE_MAP: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || '',
  pro: process.env.STRIPE_PRICE_PRO || '',
  unlimited: process.env.STRIPE_PRICE_UNLIMITED || '',
};

export async function POST(req: NextRequest) {
  try {
    const { tier, uid, email } = await req.json();

    if (!tier || !uid || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const priceId = PRICE_MAP[tier];
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'https://quiz2-1a35d.firebaseapp.com';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success&tier=${tier}`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
      customer_email: email,
      metadata: { uid, tier },
      subscription_data: {
        metadata: { uid, tier },
      },
    };

    // Add trial for Pro tier
    if (tier === 'pro') {
      sessionParams.subscription_data!.trial_period_days = 14;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
