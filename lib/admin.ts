// Admin utilities
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from './auth';
import { Subscription, SubscriptionTier, SubscriptionStatus } from './subscription';

export const ADMIN_EMAIL = 'joe_o@me.com';

export function isAdmin(email: string | null | undefined): boolean {
  return email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export interface AdminUser extends UserProfile {
  subscription?: Subscription | null;
}

// Get all users with their subscriptions
export async function getAllUsers(): Promise<AdminUser[]> {
  const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
  const subsSnap = await getDocs(collection(db, 'subscriptions'));
  
  const subsMap: Record<string, Subscription> = {};
  subsSnap.forEach(d => { subsMap[d.id] = d.data() as Subscription; });
  
  const users: AdminUser[] = [];
  usersSnap.forEach(d => {
    const user = d.data() as UserProfile;
    users.push({ ...user, uid: d.id, subscription: subsMap[d.id] || null });
  });
  return users;
}

// Grant subscription to a user
export async function grantSubscription(uid: string, tier: SubscriptionTier): Promise<void> {
  const sub: Subscription = {
    tier,
    status: 'active' as SubscriptionStatus,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    currentPeriodEnd: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
  };
  await setDoc(doc(db, 'subscriptions', uid), sub, { merge: true });
}

// Revoke subscription
export async function revokeSubscription(uid: string): Promise<void> {
  await setDoc(doc(db, 'subscriptions', uid), {
    tier: 'free',
    status: 'canceled',
    updatedAt: Date.now(),
  }, { merge: true });
}

// Delete a user
export async function deleteUser(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid));
  // Also remove their subscription
  try { await deleteDoc(doc(db, 'subscriptions', uid)); } catch {}
}
