import { isTierlistTemplate } from "@/components/creator-components/TierlistTypeGuards";
import { TierlistTemplate, TierlistTemplatePayload } from "@/components/creator-components/TierlistTypes";
import { adminDb } from "@/lib/firebaseAdmin";
import { globalRateLimit, limiters } from "@/lib/rateLimiter";
import { SaveTierlistResponse } from "@/lib/utils/apiUtils";
import { authenticateUser, generateUniqueID } from "@/lib/utils/authUtils";
import { withLimiter } from "@/lib/withLimiter";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse<SaveTierlistResponse>> {
  try {
    const globalResponse = await globalRateLimit(req, async () => {});
    if (globalResponse) return globalResponse;

    const userId = await authenticateUser(req);
    if (!userId) return NextResponse.json({ status: "fail", tierlistID: undefined }, { status: 401 });

    const slowCheck = await withLimiter(req, limiters.tierlistPut, userId);
    if (slowCheck) return NextResponse.json({ status: "fail", tierlistID: undefined }, { status: 429 });

    const template: TierlistTemplate = await req.json();
    if (!isTierlistTemplate(template)) return NextResponse.json({ status: "fail", tierlistID: undefined }, { status: 400 });
    if (!template.templateID) return NextResponse.json({ status: "fail", tierlistID: undefined }, { status: 400, statusText: "Template ID is required" });

    const templateRef = adminDb.collection('templates').doc(template.templateID);
    const existingTemplate = await templateRef.get();
    if (!existingTemplate.exists) return NextResponse.json({ status: "fail", tierlistID: undefined }, { status: 404 });

    const existingData = existingTemplate.data() as TierlistTemplate;
    if (existingData.deleted) return NextResponse.json({ status: "fail", tierlistID: undefined }, { status: 410 });
    if (existingData.isPrivate && existingData.owner !== userId) return NextResponse.json({ status: "fail", tierlistID: undefined }, { status: 403 });
    if (template.tierlistID) return NextResponse.json({ status: "fail", tierlistID: undefined }, { status: 400 });

    const tierlistID = await generateUniqueID("tierlist");
    template.tierlistID = tierlistID;

    const tierlistRef = adminDb.collection('tierlists').doc(tierlistID);
    await tierlistRef.set({ ...template, tierlistID, owner: userId });

    return NextResponse.json({ status: "success", tierlistID }, { status: 201 });
  } catch (error) {
    console.error('Error handling POST request:', error);
    return NextResponse.json({ status: "fail", tierlistID: undefined }, { status: 500 });
  }
}

export async function GET(req: NextRequest): Promise<NextResponse<TierlistTemplatePayload | { message: string }>> {
  try {
    const globalResponse = await globalRateLimit(req, async () => {});
    if (globalResponse) return globalResponse;

    const userId = await authenticateUser(req);
    const slowCheck = await withLimiter(req, limiters.tierlistGetSlow, userId);
    const burstCheck = await withLimiter(req, limiters.tierlistGetBurst, userId);
    if (slowCheck || burstCheck) return NextResponse.json({ message: "Too many requests" }, { status: 429 });

    const { searchParams } = new URL(req.url);
    const tierlistID = searchParams.get("tierlistID");
    if (!tierlistID) return NextResponse.json({ message: "Missing tierlistID" }, { status: 400 });

    const tierlistRef = adminDb.collection("tierlists").doc(tierlistID);
    const tierlistDoc = await tierlistRef.get();
    if (!tierlistDoc.exists) return NextResponse.json({ message: "Tierlist not found" }, { status: 404 });

    const tierlistData = tierlistDoc.data() as TierlistTemplate;
    if (tierlistData.deleted) return NextResponse.json({ message: "Tierlist not found" }, { status: 404 });

    const isOwner = userId === tierlistData.owner;
    if (tierlistData.isPrivate && !isOwner) return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

    const payload: TierlistTemplatePayload = { template: { ...tierlistData, templateID: tierlistDoc.id }, isOwner };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error handling GET request:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const globalResponse = await globalRateLimit(req, async () => {});
    if (globalResponse) return globalResponse;

    const userId = await authenticateUser(req);
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tierlistID = searchParams.get("tierlistID");
    if (!tierlistID) return NextResponse.json({ message: "Missing tierlistID" }, { status: 400 });

    const tierlistRef = adminDb.collection("tierlists").doc(tierlistID);
    const docSnap = await tierlistRef.get();
    if (!docSnap.exists) return NextResponse.json({ message: "Tierlist not found" }, { status: 404 });

    const tierlist = docSnap.data() as TierlistTemplate;
    if (tierlist.owner !== userId) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    await tierlistRef.set({ deleted: true, deletedAt: Date.now(), deletedBy: userId }, { merge: true });
    return NextResponse.json({ message: "Tierlist deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting tierlist:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
