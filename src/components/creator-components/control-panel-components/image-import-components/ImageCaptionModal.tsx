"use client"

import React, { useState } from "react";
import { ImageQueueItem } from "../ImageImportModal";
import TierlistImageCaptionComponent from "../../TierlistImageCaption";
import { Dialog, DialogTitle, DialogContent, Box, TextField, Slider, DialogActions, Button } from "@mui/material";

interface ImageCaptionModalProps {
  imageQueue: ImageQueueItem[];
  setImageQueue: React.Dispatch<React.SetStateAction<ImageQueueItem[]>>;
}

const ImageCaptionModal: React.FC<ImageCaptionModalProps> = ({
  imageQueue,
  setImageQueue,
}) => {
  const currentImage = imageQueue[0];

  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [topTextScale, setTopTextScale] = useState<number>(50);
  const [bottomTextScale, setBottomTextScale] = useState<number>(50);
  const [topTextYPos, setTopTextYPos] = useState<number>(10); // Default vertical position
  const [bottomTextYPos, setBottomTextYPos] = useState<number>(90); // Default vertical position
  const [aspectRatio, setAspectRatio] = useState<number>(1); // default square
  const expansionFactor = Math.max(1, 1 / aspectRatio); // e.g., 2 for portrait (0.5 aspect)
  const topTextMin = Math.floor(-25 * expansionFactor);
  const bottomTextMax = Math.ceil(100 + 25 * expansionFactor);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const ar = img.naturalWidth / img.naturalHeight;
    setAspectRatio(ar);
  };

  const handleSaveCaption = () => {
    setImageQueue((prevQueue) =>
      prevQueue.map((item) =>
        item === currentImage
          ? {
              ...item,
              caption: {
                topText,
                bottomText,
                topTextScale,
                bottomTextScale,
                topTextYPos,
                bottomTextYPos,
              },
              needsToBeCaptioned: false,
            }
          : item
      )
    );
  };

  const handleSkipCaption = () => {
    setImageQueue((prevQueue) =>
      prevQueue.map((item) =>
        item === currentImage
          ? {
              ...item,
              needsToBeCaptioned: false,
            }
          : item
      )
    );
  };

  return (
    <Dialog
      open={currentImage?.needsToBeCaptioned && !currentImage?.needsToBeCropped}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={{color: "black"}}>Add Captions</DialogTitle>
      <DialogContent>
        <Box sx={{ color: "black", display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Preview with Captions */}
          <Box
            sx={{
              width: "100%",
              height: "400px",
              border: "1px solid #ccc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {currentImage && (
              <TierlistImageCaptionComponent
                tierlistImageCaption={{
                  topText,
                  bottomText,
                  topTextScale,
                  bottomTextScale,
                  topTextYPos,
                  bottomTextYPos,
                }}
              >
                <img
                  onLoad={handleImageLoad}
                  src={currentImage.croppedImageUrl || currentImage.proxiedImageUrl || currentImage.imageUrl}
                  alt="Image Preview"
                  style={{
                    aspectRatio: "auto",
                    height: "400px",
                    objectFit: "contain",
                  }}
                />
              </TierlistImageCaptionComponent>
            )}
          </Box>

          {/* Sliders and Text Inputs in Two Columns */}
          <Box sx={{ display: "flex", gap: 3 }}>
            {/* Left Column: Top Text */}
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Top Text"
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
                fullWidth
                slotProps={{
                  input: {
                    sx: {
                      color: 'black', // input text color
                      caretColor: 'black',
                    },
                  },
                }}
              />
              <Slider
                value={topTextScale}
                onChange={(e, value) => setTopTextScale(value as number)}
                min={50}
                max={200}
                sx={{ mt: 2 }}
              />
              <Box textAlign="center">Top Text Scale: {topTextScale}px</Box>
              <Slider
                value={topTextYPos}
                onChange={(e, value) => setTopTextYPos(value as number)}
                min={topTextMin}
                max={50}
                sx={{ mt: 2 }}
              />
              <Box textAlign="center">Top Text Position: {topTextYPos}%</Box>
            </Box>

            {/* Right Column: Bottom Text */}
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Bottom Text"
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                fullWidth
                slotProps={{
                  input: {
                    sx: {
                      color: 'black', // input text color
                      caretColor: 'black',
                    },
                  },
                }}
              />
              <Slider
                value={bottomTextScale}
                onChange={(e, value) => setBottomTextScale(value as number)}
                min={50}
                max={200}
                sx={{ mt: 2 }}
              />
              <Box textAlign="center">Bottom Text Scale: {bottomTextScale}px</Box>
              <Slider
                value={bottomTextYPos}
                onChange={(e, value) => setBottomTextYPos(value as number)}
                min={50}
                max={bottomTextMax}
                sx={{ mt: 2 }}
              />
              <Box textAlign="center">Bottom Text Position: {bottomTextYPos}%</Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleSaveCaption}>
          Save Caption
        </Button>
        <Button variant="outlined" onClick={handleSkipCaption}>
          Skip Caption
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCaptionModal;
