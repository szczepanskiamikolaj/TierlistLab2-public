import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateUser } from '@/lib/utils/authUtils';
import { globalRateLimit, limiters } from '@/lib/rateLimiter';
import { withLimiter } from '@/lib/withLimiter';
import { TierlistTemplate } from '@/components/creator-components/TierlistTypes';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const globalResponse = await globalRateLimit(req, async () => {});
    if (globalResponse) return globalResponse;

    const userId = await authenticateUser(req);
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const slowCheck = await withLimiter(req, limiters.tierlistGetSlow, userId);
    if (slowCheck) return slowCheck;

    const snapshot = await adminDb
      .collection('tierlists')
      .where('owner', '==', userId)
      .get();

    const tierlists: TierlistTemplate[] = snapshot.docs.map(doc => ({
      ...(doc.data() as TierlistTemplate),
      templateID: doc.id,
    }));

    return NextResponse.json(tierlists);
  } catch (error) {
    console.error('Error fetching user tierlists:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
