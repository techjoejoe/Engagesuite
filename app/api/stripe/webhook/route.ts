import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any,
});

// Initialize Firebase Admin (server-side)
if (!getApps().length) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'quiz2-1a35d',
  });
}
const adminDb = getFirestore();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.metadata?.uid;
        const tier = session.metadata?.tier;

        if (uid && tier) {
          await adminDb.collection('subscriptions').doc(uid).set({
            tier,
            status: session.subscription ? 'active' : 'active',
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            currentPeriodEnd: null, // Will be set by subscription.updated
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }, { merge: true });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const uid = subscription.metadata?.uid;
        const tier = subscription.metadata?.tier;

        if (uid) {
          const status = subscription.status === 'trialing' ? 'trialing' :
                         subscription.status === 'active' ? 'active' :
                         subscription.status === 'past_due' ? 'past_due' : 'canceled';

          await adminDb.collection('subscriptions').doc(uid).set({
            tier: tier || 'starter',
            status,
            stripeSubscriptionId: subscription.id,
            currentPeriodEnd: (subscription as any).current_period_end * 1000,
            trialEndsAt: (subscription as any).trial_end ? (subscription as any).trial_end * 1000 : null,
            updatedAt: Date.now(),
          }, { merge: true });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const uid = subscription.metadata?.uid;

        if (uid) {
          await adminDb.collection('subscriptions').doc(uid).set({
            tier: 'free',
            status: 'canceled',
            currentPeriodEnd: null,
            updatedAt: Date.now(),
          }, { merge: true });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const uid = sub.metadata?.uid;
          if (uid) {
            await adminDb.collection('subscriptions').doc(uid).set({
              status: 'past_due',
              updatedAt: Date.now(),
            }, { merge: true });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
