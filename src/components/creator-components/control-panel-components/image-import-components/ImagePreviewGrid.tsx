import { Box, Grid2, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface ImagePreviewGridProps {
  imageUrls: { imageUrl: string; proxiedImageUrl?: string }[];
  onImageSelect: (imageUrl: string) => void;
  clearImages: () => void;
}

const ImagePreviewGrid: React.FC<ImagePreviewGridProps> = ({
  imageUrls,
  onImageSelect,
  clearImages,
}) => {
  if (imageUrls.length === 0) return null;

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid #ccc",
        borderRadius: 2,
        display: "flex",
        alignItems: "flex-start", // align X to top
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      {/* Left: Image Grid */}
      <Grid2 container spacing={2} sx={{ flex: 1 }}>
        {imageUrls.map((image, index) => (
          <Grid2 sx={{xs: 4}} key={index}>
            <Box
              component="img"
              src={image.proxiedImageUrl || image.imageUrl}
              alt={`Preview ${index + 1}`}
              sx={{
                width: "100%",
                height: 120,
                objectFit: "cover",
                borderRadius: 1,
                cursor: "pointer",
                "&:hover": { opacity: 0.8 },
              }}
              onClick={() => onImageSelect(image.imageUrl)}
            />
          </Grid2>
        ))}
      </Grid2>

      {/* Right: Close button */}
      <Box>
        <IconButton
          onClick={clearImages}
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            color: "#fff",
            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.8)" },
          }}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ImagePreviewGrid;
