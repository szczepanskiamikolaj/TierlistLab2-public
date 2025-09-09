import { TierlistTemplate } from "@/components/creator-components/TierlistTypes";
import { adminDb } from "@/lib/firebaseAdmin";
import { globalRateLimit, limiters } from "@/lib/rateLimiter";
import { authenticateUser } from "@/lib/utils/authUtils";
import { withLimiter } from "@/lib/withLimiter";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const globalResponse = await globalRateLimit(req, async () => {});
    if (globalResponse) return globalResponse; 
  
    const userId = await authenticateUser(req);

    const burstCheck = await withLimiter(req, limiters.changeTemplateVisibility, userId);
    if (burstCheck) return burstCheck;

    const body = await req.json();
    const { templateID, isPrivate } = body;

    if (!templateID || typeof isPrivate !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request. 'templateID' and 'isPrivate' (boolean) are required." },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Invalid token or missing authorization." }, { status: 401 });
    }

    const templateRef = adminDb.collection("templates").doc(templateID);
    const templateSnapshot = await templateRef.get();

    if (!templateSnapshot.exists) {
      return NextResponse.json({ error: "Template not found." }, { status: 404 });
    }

    const templateData = templateSnapshot.data() as TierlistTemplate;
    if (templateData.owner !== userId) {
      return NextResponse.json({ error: "Forbidden. You do not own this template." }, { status: 403 });
    }

    await templateRef.update({ isPrivate });

    return NextResponse.json({ success: true, message: "Template visibility updated successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
