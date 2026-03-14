// Firebase Configuration
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://demo-project-default-rtdb.firebaseio.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

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
} else {
    app = getApps()[0];
    db = getFirestore(app);
    realtimeDb = getDatabase(app);
    storage = getStorage(app);
    auth = getAuth(app);
}

export { app, db, realtimeDb, storage, auth };
