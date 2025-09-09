"use client"

import React, { useState, useCallback, useRef } from "react";
import ReactCrop, { PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Box,
  Tooltip,
} from "@mui/material";
import { ImageQueueItem } from "../ImageImportModal";
import styles from "./ImageCropModal.module.css"; 

export const MAX_WIDTH_TO_HEIGHT_RATIO: number = 4/3;
export const MAX_HEIGHT_TO_WIDTH_RATIO: number = 2.5;


const TO_RADIANS = Math.PI / 180;

const aspectRatios = [
  { value: "4/3", text: "4:3" },
  { value: "1/1", text: "1:1" },
  { value: "1/2", text: "1:2" },
  { value: "custom", text: "Custom" },
];

const canvasPreview = async (
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
  scale = 1,
  rotate = 0
) => {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2D context available in canvas");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const rotateRads = rotate * TO_RADIANS;
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();
  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotateRads);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight
  );
  ctx.restore();
};

interface ImageCropModalProps {
  imageQueue: ImageQueueItem[];
  setImageQueue: React.Dispatch<React.SetStateAction<ImageQueueItem[]>>;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageQueue,
  setImageQueue,
}) => {
  const [crop, setCrop] = useState<PixelCrop>({
    unit: "px",
    x: 0,
    y: 0,
    width: 300,
    height: 300,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("custom");
  const [isInvalidCrop, setIsInvalidCrop] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentImage = imageQueue[0];

  const onCropChange = useCallback((newCrop: PixelCrop) => {
    setCrop(newCrop);
  
    const widthToHeightRatio = newCrop.width / newCrop.height;
    const heightToWidthRatio = newCrop.height / newCrop.width;
  
    if (widthToHeightRatio >  MAX_WIDTH_TO_HEIGHT_RATIO || heightToWidthRatio > MAX_HEIGHT_TO_WIDTH_RATIO ) {
      setIsInvalidCrop(true);
    } else {
      setIsInvalidCrop(false);
    }
  }, []);
  

  const onCropComplete = useCallback((newCrop: PixelCrop) => {
    setCompletedCrop(newCrop);
  }, []);

  const onAspectChange = (aspect: string) => {
    setSelectedAspectRatio(aspect);
    setCrop((prev) => ({
      ...prev,
      aspect: aspect === "custom" ? undefined : eval(aspect),
    }));
  };

  const handleCrop = async () => {
    if (
      currentImage.imageUrl &&
      completedCrop &&
      imgRef.current &&
      canvasRef.current
    ) {
      // Capture natural dimensions before cropping
      const displayWidth = imgRef.current.width;
      const displayHeight = imgRef.current.height;
  
      await canvasPreview(imgRef.current, canvasRef.current, completedCrop);
  
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const croppedImageObjectUrl = URL.createObjectURL(blob);
  
          setImageQueue((prevQueue) =>
            prevQueue.map((item) =>
              item === currentImage
                ? {
                    ...item,
                    croppedImageUrl: croppedImageObjectUrl,
                    crop: {
                      ...completedCrop,
                      displayWidth,
                      displayHeight,
                    },
                    needsToBeCropped: false,
                  }
                : item
            )
          );
        }
      }, "image/png");
    }
  }; 

  const handleSkipCrop = () => {
    if (currentImage) {
      setImageQueue((prevQueue) =>
        prevQueue.map((item) =>
          item === currentImage
            ? {
                ...item,
                needsToBeCropped: false,
              }
            : item
        )
      );
    }
  };

  return (
    <Dialog
      open={currentImage?.needsToBeCropped}
      fullWidth
      maxWidth="lg"
      onClose={handleSkipCrop}
    >
      <DialogTitle>Crop Image</DialogTitle>
      <DialogContent>
        {currentImage?.imageUrl && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
              position: "relative",
            }}
            className={isInvalidCrop ? styles.invalidCrop : ""}
          >
            <ReactCrop
              crop={crop}
              onChange={onCropChange}
              onComplete={onCropComplete}
              aspect={
                selectedAspectRatio === "custom" ? undefined : eval(selectedAspectRatio)
              }
            >
              <img
                ref={imgRef}
                src={currentImage.proxiedImageUrl || currentImage.imageUrl}
                alt="Crop"
                crossOrigin="anonymous"
              />
            </ReactCrop>
          </Box>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 2 }}>
          {aspectRatios.map((ratio) => (
            <Button
              key={ratio.value}
              variant={selectedAspectRatio === ratio.value ? "contained" : "outlined"}
              onClick={() => onAspectChange(ratio.value)}
            >
              {ratio.text}
            </Button>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Tooltip title={isInvalidCrop ? "Invalid crop dimensions" : ""}>
          <span>
            <Button
              variant="contained"
              onClick={handleCrop}
              disabled={!completedCrop || isInvalidCrop}
            >
              Crop
            </Button>
          </span>
        </Tooltip>
        <Button variant="outlined" onClick={handleSkipCrop}>
          Skip Crop
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropModal;
