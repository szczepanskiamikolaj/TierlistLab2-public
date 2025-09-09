import { 
  FIREBASE_ADMIN_PROJECT_ID, 
  FIREBASE_ADMIN_PRIVATE_KEY, 
  FIREBASE_ADMIN_CLIENT_EMAIL,
  FIREBASE_ADMIN_STORAGE_BUCKET 
} from '../env';
import * as admin from 'firebase-admin';

process.env.DEBUG = 'firebase*';

// Ensure the Admin SDK is initialized only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_ADMIN_PROJECT_ID,
      privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
      clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
    }),
    storageBucket: FIREBASE_ADMIN_STORAGE_BUCKET, 
  });
} else {
  admin.app(); // Reuse existing instance
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();
const adminStorage = admin.storage(); 

export { adminDb, adminAuth, adminStorage };
