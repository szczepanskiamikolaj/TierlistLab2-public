import { NEXT_PUBLIC_SITE_URL } from "@/env";
import { adminDb } from "@/lib/firebaseAdmin";
import { globalRateLimit, limiters } from "@/lib/rateLimiter";
import { authenticateUser } from "@/lib/utils/authUtils";
import { withLimiter } from "@/lib/withLimiter";
import { NextRequest, NextResponse } from "next/server";

const SITE_URL = NEXT_PUBLIC_SITE_URL || "http://localhost:3000"; // Fallback for local dev

export async function GET(req: NextRequest) {
    try {
        const globalResponse = await globalRateLimit(req, async () => {});
        if (globalResponse) return globalResponse; 

        const userId = await authenticateUser(req);
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const slowCheck = await withLimiter(req, limiters.userImages, userId);
    
        if(slowCheck) return slowCheck;
    
        const snapshot = await adminDb
            .collection("images")
            .where("userId", "==", userId)
            .get();

        if (snapshot.empty) return new NextResponse(JSON.stringify([]), { status: 200 });

        const imageUrls = snapshot.docs
        .filter(doc => !doc.data().blocked)  // only where blocked is false or undefined
        .map(doc => ({
            imageId: doc.id,
            url: `${SITE_URL}/api/image/${doc.id}`,
        }));

        return new NextResponse(JSON.stringify(imageUrls), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
        console.error("Error fetching user images:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
