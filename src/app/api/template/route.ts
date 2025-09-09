import { isTierlistTemplate } from '@/components/creator-components/TierlistTypeGuards';
import { TierlistTemplate, TierlistTemplatePayload } from '@/components/creator-components/TierlistTypes';
import { adminDb } from '@/lib/firebaseAdmin';
import { globalRateLimit, limiters } from '@/lib/rateLimiter';
import { PutTemplateResponse } from '@/lib/utils/apiUtils';
import { authenticateUser, generateUniqueID } from '@/lib/utils/authUtils';
import { withLimiter } from '@/lib/withLimiter';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const globalResponse = await globalRateLimit(req, async () => {});
  if (globalResponse) return globalResponse;

  const userId = await authenticateUser(req);
  const burstCheck = await withLimiter(req, limiters.templateGetBurst, userId);
  const slowCheck = await withLimiter(req, limiters.templateGetSlow, userId);
  if (burstCheck || slowCheck) return burstCheck || slowCheck;

  const { searchParams } = new URL(req.url);
  const templateID = searchParams.get('templateID');
  if (!templateID) {
    return NextResponse.json({ message: 'Missing templateID' }, { status: 400 });
  }

  try {
    const templateRef = adminDb.collection('templates').doc(templateID);
    const templateDoc = await templateRef.get();

    if (!templateDoc.exists) {
      return NextResponse.json({ message: 'Template not found' }, { status: 404 });
    }

    const templateData = templateDoc.data() as TierlistTemplate;
    if (templateData.deleted) {
      return NextResponse.json({ message: 'Template not found' }, { status: 404 });
    }

    const isOwner = userId === templateData.owner;

    if (templateData.isPrivate && !isOwner) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const payload: TierlistTemplatePayload = {
      template: { ...templateData, templateID: templateDoc.id },
      isOwner,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error handling GET request:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse<PutTemplateResponse>> {
  try {
    const globalResponse = await globalRateLimit(req, async () => {});
    if (globalResponse) return globalResponse; 

    const userId = await authenticateUser(req);
    if (!userId) {
      return NextResponse.json({ status: "fail", templateID: undefined }, { status: 401 });
    }

    const slowCheck = await withLimiter(req, limiters.templatePut, userId);
    if (slowCheck ) return NextResponse.json({ status: "fail", templateID: undefined }, { status: 429 });

    const template: TierlistTemplate = await req.json();

    if (!isTierlistTemplate(template)) {
      return NextResponse.json({ status: "fail", templateID: undefined }, { status: 400 });
    }

    if (typeof template.isPrivate === "undefined") {
      template.isPrivate = true;
    }

    if (!template.templateID) {
      template.templateID = await generateUniqueID("template");
    }

    template.owner = template.owner || userId;

    const templateRef = adminDb.collection('templates').doc(template.templateID);
    const existingTemplate = await templateRef.get();

    if (existingTemplate.exists) {
      const existingData = existingTemplate.data() as TierlistTemplate;

      if (existingData.owner !== userId) {
        return NextResponse.json({ status: "fail", templateID: undefined }, { status: 403 });
      }

      if (existingData.deleted) {
        return NextResponse.json({ status: "fail", templateID: undefined }, { status: 410 }); // Gone
      }

      await templateRef.set(template, { merge: true });
      return NextResponse.json({ status: "success", templateID: template.templateID });
    } else {
      await templateRef.set(template);
      return NextResponse.json({ status: "success", templateID: template.templateID }, { status: 201 });
    }
  } catch (error) {
    console.error('Error handling PUT request:', error);
    return NextResponse.json({ status: "fail", templateID: undefined }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const globalResponse = await globalRateLimit(req, async () => {});
    if (globalResponse) return globalResponse;

    const userId = await authenticateUser(req);
    if (!userId) {
      return NextResponse.json({ status: "fail", message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const templateID = searchParams.get("templateID");
    if (!templateID) {
      return NextResponse.json({ status: "fail", message: "Missing templateID" }, { status: 400 });
    }

    const templateRef = adminDb.collection("templates").doc(templateID);
    const docSnap = await templateRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ status: "fail", message: "Template not found" }, { status: 404 });
    }

    const template = docSnap.data() as TierlistTemplate;

    if (template.owner !== userId) {
      return NextResponse.json({ status: "fail", message: "Forbidden" }, { status: 403 });
    }

    await templateRef.set(
      { deleted: true, deletedAt: Date.now(), deletedBy: userId },
      { merge: true }
    );

    return NextResponse.json({ status: "success", message: "Template marked as deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json({ status: "fail", message: "Internal server error" }, { status: 500 });
  }
}
