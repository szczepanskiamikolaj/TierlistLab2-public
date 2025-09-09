import { calculateRowColor, ITEM_HEIGHT } from "../TierlistRow";
import { Tierlist } from "../TierlistTypes";

const ROW_MAX_WIDTH = 1440;
const WATERMARK_TEXT = "TierlistLab2";

interface Palette {
  background: { paper: string };
}

export const generateTierlistImage = async (tierlist: Tierlist, palette: Palette): Promise<string> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context is not supported");

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const lines: string[] = [];
    const words = text.split(" ");

    let line = "";
    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // If the word itself is too long, split it
      if (ctx.measureText(word).width > maxWidth) {
        if (line) {
          lines.push(line.trim());
          line = "";
        }
        let remainder = word;
        while (remainder.length > 0) {
          let fit = "";
          for (let j = 1; j <= remainder.length; j++) {
            if (ctx.measureText(remainder.slice(0, j)).width > maxWidth) break;
            fit = remainder.slice(0, j);
          }
          lines.push(fit);
          remainder = remainder.slice(fit.length);
        }
        continue;
      }

      const testLine = line ? line + " " + word : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line.trim());
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line.trim());
    return lines;
  };

  let rows: { images: HTMLImageElement[]; label: string; rowHeight: number }[] = [];

  const loadImage = (url: string): Promise<HTMLImageElement | null> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });

  // Prepare rows
  for (const row of tierlist.rows) {
    const rowImages: HTMLImageElement[] = [];
    let rowWidth = 0;
    let maxHeight = ITEM_HEIGHT;

    const imagesToLoad = row.items
      .filter(img => img.croppedImageUrl || img.proxiedImageUrl || img.imageUrl)
      .map(img => loadImage(img.croppedImageUrl || img.proxiedImageUrl || img.imageUrl || ""));

    const loadedImages = (await Promise.all(imagesToLoad)).filter((img): img is HTMLImageElement => !!img);

    for (const img of loadedImages) {
      const aspectRatio = img.width / img.height;
      const imageWidth = ITEM_HEIGHT * aspectRatio;
      if (rowWidth + imageWidth > ROW_MAX_WIDTH) break;
      rowImages.push(img);
      rowWidth += imageWidth;
    }

    ctx.font = "16px Arial";
    const lines = wrapText(ctx, row.label, 125 - 16);
    const labelHeight = lines.length * 20 + 16;
    maxHeight = Math.max(maxHeight, labelHeight);

    rows.push({ images: rowImages, label: row.label, rowHeight: maxHeight });
  }

  // Compute canvas height
  const totalHeight = rows.reduce((sum, r) => sum + r.rowHeight, 0);
  canvas.width = ROW_MAX_WIDTH;
  canvas.height = totalHeight;

  // Draw rows
  let currentY = 0;
  rows.forEach(({ images, label, rowHeight }, rowIndex) => {
    let currentX = 125;

    // Label background
    ctx.fillStyle = calculateRowColor(rowIndex);
    ctx.fillRect(0, currentY, 125, rowHeight);

    // Wrapped label text
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const lines = wrapText(ctx, label, 125 - 16);
    const totalTextHeight = lines.length * 20;
    let textY = currentY + (rowHeight - totalTextHeight) / 2;

    lines.forEach((ln) => {
      ctx.fillText(ln, 125 / 2, textY);
      textY += 20;
    });

    // Image column background
    ctx.fillStyle = palette.background.paper;
    ctx.fillRect(125, currentY, ROW_MAX_WIDTH - 125, rowHeight);

    // Draw images
    images.forEach((img) => {
      const aspectRatio = img.width / img.height;
      const imageWidth = ITEM_HEIGHT * aspectRatio;
      ctx.drawImage(img, currentX, currentY, imageWidth, ITEM_HEIGHT);
      currentX += imageWidth;
    });

    // Row border
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, currentY, ROW_MAX_WIDTH, rowHeight);

    currentY += rowHeight;
  });

  // Watermark
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.font = "bold 24px Arial";
  ctx.fillText(WATERMARK_TEXT, canvas.width - 150, 30);

  return canvas.toDataURL("image/png");
};
