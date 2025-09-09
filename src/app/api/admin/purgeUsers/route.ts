import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { globalRateLimit, limiters } from '@/lib/rateLimiter';
import { authenticateUser } from '@/lib/utils/authUtils';
import { getStorage } from 'firebase-admin/storage';

const storage = getStorage().bucket();

async function disableUser(uid: string) {
  await adminAuth.updateUser(uid, { disabled: true });
}

async function blockUserFirestoreData(uid: string) {
  const templatesSnap = await adminDb.collection('templates').where('owner', '==', uid).get();
  const batch = adminDb.batch();

  templatesSnap.forEach(doc => {
    batch.update(doc.ref, { blocked: true });
  });

  const tierlistsSnap = await adminDb.collection('tierlists').where('owner', '==', uid).get();

  tierlistsSnap.forEach(doc => {
    batch.update(doc.ref, { blocked: true });
  });

  await batch.commit();
}

async function blockUserStorageImages(uid: string) {
    const [files] = await storage.getFiles({ prefix: `images/${uid}/` });
    if (!files || files.length === 0) return;
    
    await Promise.all(
      files.map(async (file) => {
        const [metadata] = await file.getMetadata();
        const newMetadata = {
          metadata: {
            ...metadata.metadata,
            blocked: 'true',
          },
        };
        await file.setMetadata(newMetadata);
      })
    );
}

export async function POST(req: NextRequest) {
  const globalResponse = await globalRateLimit(req, async () => {});
  if (globalResponse) return globalResponse;

  const userId = await authenticateUser(req);
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const requestingUser = await adminAuth.getUser(userId);
  if (!requestingUser.customClaims?.appAdmin) {
    return NextResponse.json({ message: 'Forbidden - Not an admin' }, { status: 403 });
  }

  const body = await req.json();
  const uids: string[] = body.uids;

  if (!uids || !Array.isArray(uids)) {
    return NextResponse.json({ message: 'Missing or invalid uids array' }, { status: 400 });
  }

  try {
    for (const uid of uids) {
      await adminAuth.getUser(uid);
      await disableUser(uid);
      await blockUserFirestoreData(uid);
      await blockUserStorageImages(uid);
    }

    return NextResponse.json({ message: `Blocked users: ${uids.join(', ')}` });
  } catch (error: any) {
    console.error('Error blocking users:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
