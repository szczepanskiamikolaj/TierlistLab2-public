import React, { useContext, useEffect, useState } from "react";
import DownloadIcon from "@mui/icons-material/Download";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";
import SavePrompt from "./SavePrompt";
import { firebaseAuth } from "@/lib/firebaseConfig";
import { TierlistTemplateContext } from "../TierlistTemplateContext";
import { generateTierlistImage } from "./generateTierlistImage";
import { useTheme, Dialog, DialogTitle, DialogContent, Box, Button, Tooltip, Typography, DialogActions } from "@mui/material";

interface SaveDialogProps {
  open: boolean;
  onClose: () => void;
}

const SaveDialog: React.FC<SaveDialogProps> = ({ open, onClose }) => {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveType, setSaveType] = useState<"template" | "tierlist" | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { tierlistTemplate } = useContext(TierlistTemplateContext);
  const [tierlistImage, setTierlistImage] = useState<string>("");
  const theme = useTheme();

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (open && tierlistTemplate) {
      const generateImage = async () => {
        const image = await generateTierlistImage(tierlistTemplate.tierlist, theme.palette);
        setTierlistImage(image);
      };
  
      generateImage();
    }
  }, [open, tierlistTemplate]); // Runs when `open` changes
  

  const handleDownloadImage = () => {
    if (!tierlistImage) return;
    const link = document.createElement("a");
    link.href = tierlistImage;
    link.download = "tierlist.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenSaveDialog = (type: "template" | "tierlist") => {
    setSaveType(type);
    setIsSaveDialogOpen(true);
  };

  const handleCloseSaveDialog = () => {
    setIsSaveDialogOpen(false);
    setSaveType(null);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle
          sx={(theme) => ({
            color: theme.palette.text.primary  
          })}
        >
          Save Options
        </DialogTitle>

        <DialogContent dividers>
        <Box
          component="img"
          src={tierlistImage}
          alt="Tierlist preview"
          sx={{
            width: "100%",
            height: "auto",
            maxHeight: "500px",
            backgroundColor: "#f0f0f0",
            overflow: "hidden", 
            objectFit: "cover", 
            objectPosition: "top", 
            mb: 2,
          }}
        />


          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadImage}
            fullWidth
            sx={{ mb: 2 }}
          >
            Download Image
          </Button>

          {!tierlistTemplate?.templateID && (
            <Tooltip title="Templates can be shared and used for making more tierlists" arrow>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={() => handleOpenSaveDialog("template")}
                fullWidth
                disabled={!isLoggedIn}
                sx={{ mb: 2 }}
              >
                Save Template to Cloud
              </Button>
            </Tooltip>
          )}

          <Tooltip
            title={
              !tierlistTemplate?.templateID
                ? "You can only create tierlists for saved templates"
                : "Tierlists can't be edited after they're saved"
            }
            arrow
          >
            <Button
              variant="contained"
              color="secondary"
              startIcon={<CloudUploadIcon />}
              onClick={() => handleOpenSaveDialog("tierlist")}
              fullWidth
              disabled={!isLoggedIn || !tierlistTemplate?.templateID}
            >
              Save Tierlist to Cloud
            </Button>
          </Tooltip>

          {!isLoggedIn && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              Please log in to use these options.
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}  sx={(theme) => ({
            color: theme.palette.text.primary  
            })}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {saveType && (
        <SavePrompt open={isSaveDialogOpen} onClose={handleCloseSaveDialog} type={saveType} />
      )}
    </>
  );
};

export default SaveDialog;
