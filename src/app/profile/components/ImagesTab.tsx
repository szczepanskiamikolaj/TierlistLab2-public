import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton, Grid, Checkbox, Grid2 } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { deleteUserImages, getUserImages } from "@/lib/utils/apiUtils";
import { enqueueSnackbar } from "notistack";

const ImagesTab: React.FC = () => {
    const [images, setImages] = useState<{ imageId: string; url: string }[]>([]);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
       
    // Fetch images on mount
    useEffect(() => {
        const fetchImages = async () => {
            try {
                const fetchedImages = await getUserImages();
                setImages(fetchedImages);
            } catch (error) {
              enqueueSnackbar("Failed to fetch images: " + error, { variant: "error" });
            }
        };
        fetchImages();
    }, []);

    // Toggle image selection
    const handleSelectImage = (imageId: string) => {
        setSelectedImages((prev) =>
            prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]
        );
    };

    const handleDeleteImages = async () => {
        if (selectedImages.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedImages.length} image(s)?`)) return;

        try {
            await deleteUserImages(selectedImages);
            setImages((prev) => prev.filter((img) => !selectedImages.includes(img.imageId)));
            setSelectedImages([]); // Clear selection
        } catch (error) {
            console.error("Failed to delete images", error);
        }
    };

    return (
        <Box sx={{ padding: 2 }}>
          <Typography variant="h5" mb={2}>
            Images
          </Typography>
      
          <Box sx={{ maxWidth: 600, mx: "auto" }}>
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Box sx={{ width: 40, height: 40 }}>
                <IconButton
                  onClick={handleDeleteImages}
                  color="error"
                  sx={{ visibility: selectedImages.length > 0 ? "visible" : "hidden" }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
      
            <Grid2 container spacing={2}>
              {images.map(({ imageId, url }) => (
                <Grid2 key={imageId} size={{ xs: 6, sm: 4, md: 3 }}>
                  <Box
                    sx={{
                      width: 100,
                      margin: "0 auto",
                      position: "relative",
                      borderRadius: 2,
                      overflow: "hidden",
                      boxSizing: "border-box",
                      outline: selectedImages.includes(imageId) ? "3px solid red" : "none",
                    }}
                  >
                    <img
                      src={url}
                      alt="User upload"
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                      }}
                    />
                    <Checkbox
                      checked={selectedImages.includes(imageId)}
                      onChange={() => handleSelectImage(imageId)}
                      sx={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        color: "white",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        borderRadius: "50%",
                        padding: "4px",
                        "&.Mui-checked": {
                          color: "white",
                        },
                      }}
                    />
                  </Box>
                </Grid2>
              ))}
            </Grid2>
          </Box>
        </Box>
      );      
      
};

export default ImagesTab;
