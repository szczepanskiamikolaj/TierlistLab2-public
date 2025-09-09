import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "firebase-admin/storage"; // Import storage
import { authenticateUser } from "@/lib/utils/authUtils";
import { adminDb } from "@/lib/firebaseAdmin";
import sharp from "sharp";
import crypto from "crypto";
import { MAX_HEIGHT_TO_WIDTH_RATIO, MAX_WIDTH_TO_HEIGHT_RATIO } from "@/components/creator-components/control-panel-components/image-import-components/ImageCropModal";
import { MAX_IMAGE_SIZE_MB, MAX_UPLOADED_IMAGES } from "@/components/creator-components/control-panel-components/ImageImportModal";
import { globalRateLimit, limiters } from "@/lib/rateLimiter";
import { withLimiter } from "@/lib/withLimiter";

const storage = getStorage().bucket(); 

const generateImageId = () => crypto.randomBytes(16).toString("hex");

export async function POST(req: NextRequest) {
    try {
        const globalResponse = await globalRateLimit(req, async () => {});
        if (globalResponse) return globalResponse; 

        const userId = await authenticateUser(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const slowCheck = await withLimiter(req, limiters.imagePost, userId);
        const dailyCheck = await withLimiter(req, limiters.imagePostDaily, userId);
        if (slowCheck || dailyCheck) return slowCheck;

        const userImagesSnapshot = await adminDb.collection("images").where("userId", "==", userId).get();
        if (userImagesSnapshot.size >= MAX_UPLOADED_IMAGES) {
            return NextResponse.json({ error: "Upload limit reached (50 images)" }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("image") as Blob | null;
        if (!file) return NextResponse.json({ error: "No image uploaded" }, { status: 400 });

        const arrayBuffer = await file.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        const metadata = await sharp(imageBuffer).metadata();
        if (!metadata.size || metadata.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
            return NextResponse.json({ error: "Image too large (max 4MB)" }, { status: 400 });
        }

        const aspectRatio = metadata.width! / metadata.height!;
        if (aspectRatio > MAX_WIDTH_TO_HEIGHT_RATIO || aspectRatio < 1 / MAX_HEIGHT_TO_WIDTH_RATIO) {
            return NextResponse.json({ error: "Invalid aspect ratio" }, { status: 400 });
        }

        const resizedBuffer = await sharp(imageBuffer)
            .resize({
                height: 1000, 
                width: Math.round(metadata.width! * (1000 / metadata.height!)), 
            })
            .webp({ quality: 65 })
            .toBuffer();

        const imageId = generateImageId();
        const filePath = `images/${userId}/${imageId}.webp`;
        const fileRef = storage.file(filePath);
        await fileRef.save(resizedBuffer, {
            metadata: { contentType: "image/webp" },
            public: false, 
        });

        await adminDb.collection("images").doc(imageId).set({
            userId,
            imageId,
            createdAt: new Date().toISOString(),
        });

        return NextResponse.json({ imageId });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
      const globalResponse = await globalRateLimit(req, async () => {});
      if (globalResponse) return globalResponse;
  
      const userId = await authenticateUser(req);
      if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const slowCheck = await withLimiter(req, limiters.imageDelete, userId);
      if (slowCheck) return slowCheck;
  
      const { imageIds } = await req.json();
      if (!Array.isArray(imageIds) || imageIds.length === 0) {
        return NextResponse.json({ error: "Invalid imageIds array" }, { status: 400 });
      }
  
      const batch = adminDb.batch();
  
      for (const imageId of imageIds) {
        const imageDocRef = adminDb.collection("images").doc(imageId);
        const imageDoc = await imageDocRef.get();
  
        if (!imageDoc.exists || imageDoc.data()?.userId !== userId) {
          return NextResponse.json({ error: "Unauthorized or image not found" }, { status: 403 });
        }
  
        batch.update(imageDocRef, { blocked: true });
  
        const filePath = `images/${userId}/${imageId}.webp`;
        const file = storage.file(filePath);
        await file.setMetadata({
          metadata: {
            blocked: true,
          },
        });
      }
  
      await batch.commit();
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }
  