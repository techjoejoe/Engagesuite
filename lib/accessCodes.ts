// Access Code Management for Trainer Verification
// Firestore collection: accessCodes/{code}
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface AccessCode {
  code: string;
  tier: 'starter' | 'pro' | 'unlimited' | 'trial';
  createdAt: Timestamp | number;
  expiresAt: Timestamp | number | null;
  usedBy: string | null;
  usedAt: Timestamp | number | null;
  createdBy: string;
  maxUses: number;
  currentUses: number;
  active: boolean;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export async function validateAccessCode(code: string): Promise<AccessCode | null> {
  const normalizedCode = code.trim().toUpperCase();
  const codeRef = doc(db, 'accessCodes', normalizedCode);
  const codeSnap = await getDoc(codeRef);

  if (!codeSnap.exists()) return null;

  const codeData = codeSnap.data() as AccessCode;

  if (!codeData.active) return null;
  if (codeData.maxUses > 0 && codeData.currentUses >= codeData.maxUses) return null;

  if (codeData.expiresAt) {
    const expiryTime = codeData.expiresAt instanceof Timestamp
      ? codeData.expiresAt.toMillis()
      : codeData.expiresAt;
    if (Date.now() > expiryTime) return null;
  }

  return codeData;
}

export async function redeemAccessCode(code: string, uid: string): Promise<boolean> {
  const normalizedCode = code.trim().toUpperCase();
  const codeRef = doc(db, 'accessCodes', normalizedCode);

  try {
    const codeData = await validateAccessCode(normalizedCode);
    if (!codeData) return false;

    await updateDoc(codeRef, {
      usedBy: uid,
      usedAt: Date.now(),
      currentUses: codeData.currentUses + 1,
      ...(codeData.maxUses === 1 ? { active: false } : {}),
    });
    return true;
  } catch (error) {
    console.error('Error redeeming access code:', error);
    return false;
  }
}

export async function createAccessCode(
  createdBy: string,
  tier: AccessCode['tier'] = 'pro',
  options?: { maxUses?: number; expiresInDays?: number; customCode?: string; }
): Promise<string> {
  const code = options?.customCode?.toUpperCase() || generateCode();
  const codeRef = doc(db, 'accessCodes', code);

  const expiresAt = options?.expiresInDays
    ? Date.now() + (options.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const codeData: AccessCode = {
    code, tier,
    createdAt: Date.now(),
    expiresAt,
    usedBy: null, usedAt: null,
    createdBy,
    maxUses: options?.maxUses ?? 1,
    currentUses: 0,
    active: true,
  };

  await setDoc(codeRef, codeData);
  return code;
}

export async function createTrialCode(uid: string): Promise<string> {
  return createAccessCode('system', 'trial', { maxUses: 1, expiresInDays: 14 });
}

export async function getAllAccessCodes(): Promise<AccessCode[]> {
  const codesRef = collection(db, 'accessCodes');
  const snapshot = await getDocs(codesRef);
  return snapshot.docs.map(doc => doc.data() as AccessCode);
}

export async function getActiveAccessCodes(): Promise<AccessCode[]> {
  const codesRef = collection(db, 'accessCodes');
  const q = query(codesRef, where('active', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as AccessCode);
}

export async function deactivateAccessCode(code: string): Promise<void> {
  const codeRef = doc(db, 'accessCodes', code.toUpperCase());
  await updateDoc(codeRef, { active: false });
}

export async function deleteAccessCode(code: string): Promise<void> {
  const codeRef = doc(db, 'accessCodes', code.toUpperCase());
  await deleteDoc(codeRef);
}
