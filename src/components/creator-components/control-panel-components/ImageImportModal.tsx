"use client"

import React, { useCallback, useContext, useEffect, useState, useRef } from "react";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { getUserImageCount, getUserImages, proxyImage, uploadImage } from "@/lib/utils/apiUtils";
import ImagePreviewGrid from "./image-import-components/ImagePreviewGrid";
import { TierlistElementType, TierlistImage } from "../TierlistTypes";
import { TierlistTemplateContext } from "../TierlistTemplateContext";
import { v4 as uuidv4 } from "uuid";
import ImageCropModal, { MAX_HEIGHT_TO_WIDTH_RATIO, MAX_WIDTH_TO_HEIGHT_RATIO } from "./image-import-components/ImageCropModal";
import { enqueueSnackbar } from "notistack";
import ImageCaptionModal from "./image-import-components/ImageCaptionModal";
import { eventBus } from "@/lib/eventBus";
import { useAuthState } from "react-firebase-hooks/auth";
import { firebaseAuth } from "@/lib/firebaseConfig";
import { createStrictRateLimitedFetcher } from "@/lib/createStrictRateLimiter";
import { isValidUrl } from "@/lib/isValidUrl";
import { Dialog, DialogTitle, DialogContent, Box, TextField, Button, CircularProgress, Typography, FormControlLabel, Checkbox } from "@mui/material";

interface ImageImportModalProps {
  open: boolean;
  onClose: () => void;
}

export interface ImageQueueItem
  extends Pick<TierlistImage, "imageUrl" | "croppedImageUrl" | "crop" | "caption" | "proxiedImageUrl"> {
  needsToBeCropped: boolean;
  needsToBeCaptioned: boolean;
}

export const MAX_IMAGE_SIZE_MB: number = 4;
export const MAX_UPLOADED_IMAGES: number = 50;

const ImageImportModal: React.FC<ImageImportModalProps> = ({ open, onClose }) => {
  const [imageUrl, setImageUrl] = useState("");
  const [proxiedImageUrl, setproxiedImageUrl] = useState("");
  const [imagePreviews, setImagePreviews] = useState<{imageUrl: string, proxiedImageUrl: string}[]>([]);
  const [corsError, setCorsError] = useState(false);
  const [cropEnabled, setCropEnabled] = useState(false);
  const [captionEnabled, setCaptionEnabled] = useState(false);
  const [imageQueue, setImageQueue] = useState<ImageQueueItem[]>([]);
  const { setTierlistTemplate, tierlistTemplate } = useContext(TierlistTemplateContext);
  const [isUploading, setIsUploading] = useState(false);
  const [user] = useAuthState(firebaseAuth);
  const [isDragging, setIsDragging] = useState(false);
  
  // Use refs to access the latest state values in event listeners
  const cropEnabledRef = useRef(cropEnabled);
  const captionEnabledRef = useRef(captionEnabled);

  // Keep refs in sync with state
  useEffect(() => {
    cropEnabledRef.current = cropEnabled;
  }, [cropEnabled]);

  useEffect(() => {
    captionEnabledRef.current = captionEnabled;
  }, [captionEnabled]);

  const clearImages = () => setImagePreviews([]);

  // Handle URL input change
  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(event.target.value);
  };

  useEffect(()=>{if(imageUrl && proxiedImageUrl) setImagePreviews([{imageUrl, proxiedImageUrl: proxiedImageUrl}]);},[proxiedImageUrl])

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
  
      const items = e.clipboardData.items;
      const imageFiles: File[] = [];
  
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
  
      if (imageFiles.length > 0) {
        await handleFileUpload(imageFiles);
      }
    };
  
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [user]); 
    

  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {

      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        enqueueSnackbar(`"${file.name}" is too large (Max: ${MAX_IMAGE_SIZE_MB}MB)`, { variant: "error" });
        return resolve(false);
      }
  
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const { width, height } = img;
        const aspectRatio = width / height;
        if (aspectRatio > MAX_WIDTH_TO_HEIGHT_RATIO || aspectRatio < (1 / MAX_HEIGHT_TO_WIDTH_RATIO)) {
          enqueueSnackbar(`"${file.name}" has an invalid aspect ratio`, { variant: "error" });
          return resolve(false);
        }
        resolve(true);
      };
  
      img.onerror = () => {
        enqueueSnackbar(`"${file.name}" could not be processed`, { variant: "error" });
        resolve(false);
      };
    });
  };


  const searchWikimediaImages = async (query: string): Promise<{ imageUrl: string }[]> => {
    const safeQuery = `${query} -nude -sex -porn -erotic -genital -naked -nsfw -penis -vagina -sexual`;
  
    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url&format=json&origin=*&gsrsearch=${encodeURIComponent(safeQuery)}`
    );
  
    const data = await response.json();
  
    if (!data.query?.pages) return [];
  
    return Object.values(data.query.pages).map((page: any) => ({
      imageUrl: page.imageinfo?.[0]?.url || "",
    })).filter(img => !!img.imageUrl);
  };
  
  
  const _fetchWikimediaImages = async (query: string) => {
    try {
      const results = await searchWikimediaImages(query);
      setImagePreviews(results.map(r => ({ imageUrl: r.imageUrl, proxiedImageUrl: "" })));
    } catch (err) {
      enqueueSnackbar("Wikimedia Commons search failed", { variant: "error" });
    }
  };
  
  const fetchWikimediaImages = createStrictRateLimitedFetcher(_fetchWikimediaImages, 2);

  const showNSFWWarning = () => {
    eventBus.emit("openCustomDialog", {
      header: "Image Search Notice",
      body: `Images are fetched from Wikimedia Commons and may include unexpected or NSFW content, despite content filters. Do you wish to proceed?`,
      buttons: [
        {
          text: "Proceed",
          onClick: () => {
            localStorage.setItem("acceptedImageWarning", "true");
            fetchImages(); // Retry the actual search after user agrees
            eventBus.emit("closeCustomDialog");
          },
        },
      ],
    });
  };
  
  const fetchImages = async () => {
    if (!imageUrl) return;
  
    const userAccepted = localStorage.getItem("acceptedImageWarning") === "true";
  
    if (isValidUrl(imageUrl)) {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error("CORS error");
        setImagePreviews([{ imageUrl, proxiedImageUrl: "" }]);
        setCorsError(false);
      } catch {
        try {
          setproxiedImageUrl(await proxyImage(imageUrl));
          setCorsError(false);
        } catch (error) {
          setCorsError(true);
          console.error("Image fetching failed:", error);
        }
      }
    } else {
      if (!userAccepted) {
        showNSFWWarning(); 
      } else {
        fetchWikimediaImages(imageUrl);
      }
    }
  };
  

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetchImages();
  };

  // Handle selecting an image from the preview grid
  const addImageToQueue = (selectedImageUrl: string) => {
    setImageQueue((prevSelectedImages) => [
      ...prevSelectedImages,
      { 
        needsToBeCaptioned: captionEnabledRef.current, 
        needsToBeCropped: cropEnabledRef.current, 
        imageUrl: selectedImageUrl, 
        proxiedImageUrl: proxiedImageUrl 
      },
    ]);
  };

  const addImageToTierlist = () => {
    if (
      imageQueue.length &&
      !imageQueue[0].needsToBeCaptioned &&
      !imageQueue[0].needsToBeCropped &&
      tierlistTemplate
    ) {
      const newTierlistTemplateItem: TierlistImage = {
        id: uuidv4(),
        type: TierlistElementType.TierlistImage,
        imageUrl: imageQueue[0].imageUrl,
        proxiedImageUrl: imageQueue[0].proxiedImageUrl,
        croppedImageUrl: imageQueue[0].croppedImageUrl,
        crop: imageQueue[0].crop,
        caption: imageQueue[0].caption,
      };

      setTierlistTemplate(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tierlistReserve: {
            ...prev.tierlistReserve,
            items: [...(prev.tierlistReserve.items || []), newTierlistTemplateItem],
          },
        };
      });

      //Timeout added to not remove the image before the cropping modal fades out
      setTimeout(() => {
        enqueueSnackbar("Image added", { variant: "success" });
        setImageQueue(prev => prev.slice(1));
        if (imageQueue.length === 1) {
          onClose();
        }
      }, imageQueue[0].crop ? 250 : 0);
    }
  };

  useEffect(() => {
    addImageToTierlist();
  }, [imageQueue]);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!user) {
      eventBus.emit("openLoginDialog", {
        header: "You are not logged in",
        body: "You need to login to perform this action",
      });
      return;
    }
  
    const validFiles = await Promise.all(Array.from(files).map(validateImage));
    const filteredFiles = Array.from(files).filter((_, index) => validFiles[index]);
  
    if (!filteredFiles.length) return;
  
    // Check user image count limit
    try {
      const userImageCount = await getUserImageCount();
      
      if (userImageCount + filteredFiles.length > MAX_UPLOADED_IMAGES) {
          enqueueSnackbar(`Upload limit reached (${MAX_UPLOADED_IMAGES} images)`, { variant: "error" });
          return;
      }
    } catch (error) {
        enqueueSnackbar("Failed to check upload limit. Please try again.", { variant: "error" });
        return; 
    }
  
    setIsUploading(true);
    try {
      const uploadedImages = await Promise.all(filteredFiles.map(file => uploadImage(file)));
  
      setImageQueue(prev => [
        ...prev,
        ...uploadedImages.map(img => ({
          imageUrl: `/api/image/${img.imageId}`,
          needsToBeCropped: cropEnabledRef.current,
          needsToBeCaptioned: captionEnabledRef.current,
        })),
      ]);
    } catch (error) {
      enqueueSnackbar("Failed to upload image", { variant: "error" });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  
    const files = event.dataTransfer.files;
  
    if (files.length > 0) {
      await handleFileUpload(files);
    } else {
      // Handle Firefox drag from Google Images or similar
      for (const item of event.dataTransfer.items) {
        if (item.kind === "string" && item.type === "text/html") {
          item.getAsString((html) => {
            const doc = new DOMParser().parseFromString(html, "text/html");
            const img = doc.querySelector("img");
  
            if (img?.src) {
              setImageUrl(img.src);
            }
          });
        }
  
        // Fallback: check for plain URL if no image tag found
        if (item.kind === "string" && item.type === "text/uri-list") {
          item.getAsString((uri) => {
            if (uri.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)) {
              setImageUrl(uri);
            }
          });
        }
      }
    }
  };
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      await handleFileUpload(event.target.files);
    }
  };

  const fetchUserImages = async () => {
    try {
      const userImages = await getUserImages();
      setImagePreviews(userImages.map(img => ({ imageUrl: img.url, proxiedImageUrl: "" })));
    } catch (error) {
      enqueueSnackbar("Failed to load user images", { variant: "error" });
    }
  };
  

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={(theme) => ({
          backgroundColor: "primary.main",
          justifyContent: "center",
          color: theme.palette.primary.contrastText,
          borderBottom: "none"
        })}
      >
        Import Image
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <form onSubmit={handleSubmit}>
            <Box display="flex" alignItems="center" sx={{ mb: 3 }}>
              <TextField
                label="Enter Image URL or Search Phrase"
                variant="outlined"
                fullWidth
                value={imageUrl}
                onChange={handleUrlChange}
                helperText={corsError ? "Unable to fetch image. Please try another URL." : ""}
                error={corsError}
                sx={{
                  mr: 1,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "text.primary" },
                    "&:hover fieldset": { borderColor: "text.primary" },
                    "&.Mui-focused fieldset": { borderColor: "primary.main" },
                  },
                  "& .MuiInputLabel-root": { color: "text.primary" },
                  "& .MuiInputBase-input": { color: "text.primary" },
                  "& .MuiFormHelperText-root": { color: "text.secondary" },
                }}
              />
              <Button type="submit" variant="contained" sx={{ backgroundColor: "text.primary", color: "background.paper" }}>
                Search
              </Button>
            </Box>
          </form>

          <Box
            sx={{
              height: 250,
              p: 2,
              border: 2,
              borderStyle: "dashed",
              borderColor: "text.primary",
              borderRadius: 1,
              backgroundColor: isDragging ? "action.hover" : "background.paper",
              transition: "background-color 0.3s ease-in-out",
              overflowY: "auto",
              mb: 3,
              pointerEvents: isUploading ? "none" : "auto",
              position: "relative",
            }}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => {
              if (imagePreviews.length === 0 && !isUploading) {
                document.getElementById("fileInput")?.click();
              }
            }}
          >
            {isUploading && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.2)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CircularProgress sx={{ color: "background.paper" }} />
              </Box>
            )}

            {imagePreviews.length > 0 ? (
              <ImagePreviewGrid imageUrls={imagePreviews} onImageSelect={addImageToQueue} clearImages={clearImages} />
            ) : (
              <Box
                textAlign="center"
                sx={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 2, width: "100%" }}
              >
                <label style={{ cursor: "pointer", width: "100%", height: "100%" }}>
                  <input id="fileInput" type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
                  <CloudUploadIcon sx={{ fontSize: 48, color: "text.primary" }} />
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Drop Image Here or Click to Select
                  </Typography>
                </label>
              </Box>
            )}
          </Box>

          <ImageCropModal setImageQueue={setImageQueue} imageQueue={imageQueue} />
          <ImageCaptionModal setImageQueue={setImageQueue} imageQueue={imageQueue} />

          <Box display="flex" flexDirection="column" sx={{ mb: 3 }}>
            <FormControlLabel
              control={<Checkbox checked={cropEnabled} onChange={() => setCropEnabled(!cropEnabled)} sx={{ color: "text.primary" }} />}
              label={<Typography sx={{ color: "text.primary" }}>Crop Image</Typography>}
            />
            <FormControlLabel
              control={<Checkbox checked={captionEnabled} onChange={() => setCaptionEnabled(!captionEnabled)} sx={{ color: "text.primary" }} />}
              label={<Typography sx={{ color: "text.primary" }}>Add Caption</Typography>}
            />
          </Box>

          {user && (
            <Box textAlign="right" sx={{ mt: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "text.primary",
                  cursor: "pointer",
                  textDecoration: "underline",
                  "&:hover": { color: "primary.main" },
                }}
                onClick={fetchUserImages}
              >
                Show My Images
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );


};

export default ImageImportModal;