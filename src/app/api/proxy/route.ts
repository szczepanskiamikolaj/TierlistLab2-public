import { globalRateLimit, limiters } from '@/lib/rateLimiter';
import { authenticateUser } from '@/lib/utils/authUtils';
import { fetchWithTimeout } from '@/lib/utils/storageUtils';
import { withLimiter } from '@/lib/withLimiter';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const globalResponse = await globalRateLimit(req, async () => {});
  if (globalResponse) return globalResponse; 

  const userId = await authenticateUser(req);
  const slowCheck = await withLimiter(req, limiters.proxySlow, userId);
  const burstCheck = await withLimiter(req, limiters.proxyBurst, userId);
  if (slowCheck || burstCheck) return slowCheck || burstCheck;

  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) {
      return NextResponse.json({ error: "Missing 'url'" }, { status: 400 });
  }

  try {
      const response = await fetchWithTimeout(url, 7000); // 7s timeout
      if (!response.ok) {
          return NextResponse.json({ error: `Fetch failed: ${response.statusText}` }, { status: response.status });
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const body = await response.blob();

      return new Response(body, {
          headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=3600',
          },
      });
  } catch (error: any) {
      console.error("Proxy image error:", error);
      if (error.name === 'AbortError') {
          return NextResponse.json({ error: 'Image fetch timed out' }, { status: 504 });
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}