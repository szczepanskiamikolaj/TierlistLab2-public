import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { authenticateUser } from "@/lib/utils/authUtils";
import { MAX_UPLOADED_IMAGES } from "@/components/creator-components/control-panel-components/ImageImportModal";
import { globalRateLimit, limiters } from "@/lib/rateLimiter";
import { withLimiter } from "@/lib/withLimiter";

export async function GET(req: NextRequest) {
    try {
        const globalResponse = await globalRateLimit(req, async () => {});
        if (globalResponse) return globalResponse; 

        const userId = await authenticateUser(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const slowCheck = await withLimiter(req, limiters.countImages, userId);
        if (slowCheck) return slowCheck;

        const userImagesSnapshot = await adminDb
            .collection("images")
            .where("userId", "==", userId)
            .where("blocked", "==", false)
            .get();
        const imageCount = userImagesSnapshot.size;

        return NextResponse.json({ imageCount, maxLimit: MAX_UPLOADED_IMAGES });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
