import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export async function authenticateUser(req: Request): Promise<string | null> {
  const authorizationHeader = req.headers.get('Authorization');
  const token = authorizationHeader?.split('Bearer ')[1];

  if (!token) return null;

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

function generateRandomID(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function generateUniqueID(collection: "template" | "tierlist"): Promise<string> {
  let id: string;
  let isUnique = false;

  do {
    id = generateRandomID();
    const idCheckRef = adminDb.collection(collection === "template" ? "templates" : "tierlists").doc(id);
    const idCheckDoc = await idCheckRef.get();
    isUnique = !idCheckDoc.exists;
  } while (!isUnique);

  return id;
}
