import { adminDb } from "@/lib/firebaseAdmin";
import { globalRateLimit, limiters } from "@/lib/rateLimiter";
import { authenticateUser } from "@/lib/utils/authUtils";
import { withLimiter } from "@/lib/withLimiter";
import { getStorage } from "firebase-admin/storage";
import { NextRequest, NextResponse } from "next/server";

const storage = getStorage().bucket();
export async function GET(req: NextRequest, { params }: { params: { imageId: string } }) {
  try {     
    const globalResponse = await globalRateLimit(req, async () => {});
    if (globalResponse) return globalResponse;

    const requestingUserId = await authenticateUser(req);
    const slowCheck = await withLimiter(req, limiters.imageGet, requestingUserId);
    if (slowCheck) return slowCheck;

    const { imageId } = params;
    if (!imageId) return new NextResponse("Missing image ID", { status: 400 });

    const imageDoc = await adminDb.collection("images").doc(imageId).get();
    if (!imageDoc.exists) return new NextResponse("Image not found", { status: 404 });

    const imageData = imageDoc.data();
    if (!imageData || imageData.blocked === true) {
      return new NextResponse("Image not found", { 
        status: 404, 
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } 
      });
    }
    
    const filePath = `images/${imageData.userId}/${imageId}.webp`;
    const file = storage.file(filePath);

    const [exists] = await file.exists();
    if (!exists) return new NextResponse("Image not found in storage", { status: 404 });

    const [imageBuffer] = await file.download();

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=240, immutable",
        "Content-Disposition": `inline; filename="${imageId}.webp"`,
      },
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
