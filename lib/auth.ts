// Firebase Authentication and User Management
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { db, app } from './firebase';

const auth = getAuth(app);
// Ensure persistence is set to LOCAL (default behavior, but explicit is better)
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Auth persistence error:", error);
});

const googleProvider = new GoogleAuthProvider();

// User Profile Interface
export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string | null;
    role: 'host' | 'player';
    joinedClassId?: string;
    lifetimePoints: number;
    gamesPlayed: number;
    gamesWon: number;
    createdAt: number;
    lastActive: number;
}

// Sign up with email/password
export async function signUpWithEmail(email: string, password: string, displayName: string, role: 'host' | 'player' = 'player'): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    await createUserProfile(user.uid, email, displayName, role);

    // Update Auth profile
    // We import updateProfile dynamically to avoid circular dependencies if any, 
    // but here we can just use the firebase/auth import if we add it.
    // For now, let's just rely on Firestore, but ideally we should update Auth too.

    return user;
}

// Sign in with email/password
export async function signInWithEmail(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    try {
        // Check if user profile exists
        const profile = await getUserProfile(user.uid);

        if (profile) {
            await updateLastActive(user.uid);
        } else {
            // Profile missing (legacy user or failed signup), create it
            // Use email prefix as display name if displayName is missing
            const fallbackName = user.displayName || email.split('@')[0];
            // When creating a profile during sign-in, we default to 'player' role
            await createUserProfile(user.uid, email, fallbackName, 'player', user.photoURL);
        }
    } catch (error) {
        console.error('Error updating user profile during login:', error);
        // Don't block login if profile update fails
    }

    return user;
}

// Sign in with Google
export async function signInWithGoogle(role: 'host' | 'player' = 'player'): Promise<User> {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user profile exists, create if not
    const profileExists = await getUserProfile(user.uid);
    if (!profileExists) {
        await createUserProfile(user.uid, user.email || '', user.displayName || 'User', role, user.photoURL);
    } else {
        await updateLastActive(user.uid);
    }

    return user;
}

// Sign in anonymously
import { signInAnonymously } from 'firebase/auth';

export async function signInAnonymouslyUser(displayName: string): Promise<User> {
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

    // Create user profile
    await createUserProfile(user.uid, '', displayName, 'player');

    return user;
}

// Sign out
export async function signOutUser(): Promise<void> {
    await signOut(auth);
}

// Create user profile in Firestore
async function createUserProfile(uid: string, email: string, displayName: string, role: 'host' | 'player', photoURL?: string | null): Promise<void> {
    const profile: UserProfile = {
        uid,
        email,
        displayName,
        photoURL: photoURL || null,
        role,
        lifetimePoints: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        createdAt: Date.now(),
        lastActive: Date.now(),
    };

    await setDoc(doc(db, 'users', uid), profile);
}

// Get user profile
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    }

    return null;
}

// Update last active timestamp
async function updateLastActive(uid: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        lastActive: Date.now(),
    });
}

// Add points to user's lifetime total
export async function addLifetimePoints(uid: string, points: number): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        lifetimePoints: increment(points),
        gamesPlayed: increment(1),
    });
}

// Mark game as won
export async function markGameWon(uid: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        gamesWon: increment(1),
    });
}

// Update user role
export async function updateUserRole(uid: string, role: 'host' | 'player'): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });
}

// Update user profile data
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
}

// Get lifetime leaderboard (top 100 users)
export async function getLifetimeLeaderboard(limit: number = 100): Promise<UserProfile[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('lifetimePoints', '>', 0));
    const querySnapshot = await getDocs(q);

    const users = querySnapshot.docs.map(doc => doc.data() as UserProfile);

    // Sort by lifetime points descending
    users.sort((a, b) => b.lifetimePoints - a.lifetimePoints);

    return users.slice(0, limit);
}

// Auth state listener
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser(): User | null {
    return auth.currentUser;
}

// Reset Password
import { sendPasswordResetEmail } from 'firebase/auth';

export async function resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
}
