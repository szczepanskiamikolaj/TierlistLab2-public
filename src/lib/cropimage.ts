import { PixelCrop } from "@/components/creator-components/TierlistTypes";

export const getCroppedImg = async (
  imageUrl: string,
  crop: PixelCrop
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / crop.displayWidth!;
      const scaleY = image.naturalHeight / crop.displayHeight!;
      canvas.width = crop.width * scaleX;
      canvas.height = crop.height * scaleY;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Could not get canvas context");

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject("Failed to crop image");
      }, "image/png");
    };
    image.onerror = reject;
    image.src = imageUrl;
  });
};
