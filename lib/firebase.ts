// Firebase Configuration - Optimized for <200ms Latency
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
    // NOTE: Replace these with your actual Firebase configuration
    // Get these from Firebase Console > Project Settings > General > Your apps
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://demo-project-default-rtdb.firebaseio.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let realtimeDb: Database;
let storage: FirebaseStorage;
let auth: Auth;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    realtimeDb = getDatabase(app);
    storage = getStorage(app);
    auth = getAuth(app);
    
    // Enable offline persistence for instant reads (<50ms)
    // This caches data locally for immediate access
    if (typeof window !== 'undefined') {
        enableMultiTabIndexedDbPersistence(db)
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    // Multiple tabs open, fallback to single tab
                    enableIndexedDbPersistence(db).catch((error) => {
                        console.warn('Persistence failed:', error);
                    });
                } else if (err.code === 'unimplemented') {
                    console.warn('Persistence not available in this browser');
                }
            });
    }
} else {
    app = getApps()[0];
    db = getFirestore(app);
    realtimeDb = getDatabase(app);
    storage = getStorage(app);
    auth = getAuth(app);
}

export { app, db, realtimeDb, storage, auth };
