import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-12-18.acacia' as any,
  });
}

function getAdminDb() {
  if (!getApps().length) {
    initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'quiz2-1a35d' });
  }
  return getFirestore();
}

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const subDoc = await adminDb.collection('subscriptions').doc(uid).get();
    const customerId = subDoc.data()?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const origin = req.headers.get('origin') || 'https://quiz2-1a35d.firebaseapp.com';

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId as string,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
