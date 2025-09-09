import React, { useContext, useRef, useState,  } from "react";
import { TierlistElementType, TierlistRow } from "./TierlistTypes";
import { Box, Button, Drawer, IconButton, Typography, Divider, Stack, Fade, Tooltip } from "@mui/material";
import DoubleArrowIcon from "@mui/icons-material/DoubleArrow";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { TierlistTemplateContext } from "./TierlistTemplateContext";
import SaveDialog from "./control-panel-components/SaveDialog";
import { v4 as uuidv4 } from 'uuid';
import ImageImportModal from "./control-panel-components/ImageImportModal";
import { eventBus } from "@/lib/eventBus";

interface ControlPanelProps {
}

interface FloatingButtonProps {
    icon: React.ReactNode;
    onClick: () => void;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ icon, onClick }) => (
  <IconButton
    onClick={onClick}
    color="primary"
    sx={{
      backgroundColor: "white",
      boxShadow: 2,
      "&:hover": {
        backgroundColor: "rgba(255,255,255,0.9)", 
      },
    }}
  >
    {icon}
  </IconButton>
);


const ControlPanel: React.FC<ControlPanelProps> = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
    const [showImageImportModal, setShowImageImportModal] = useState<boolean>(false)
    const {tierlistTemplate, setTierlistTemplate, setDeletionMode, isTemplateOwner} = useContext(TierlistTemplateContext)

    const toggleDrawer = (open: boolean) => () => setIsDrawerOpen(open);
    const toggleSaveModal = (open: boolean) => () => setShowSaveModal(open);
    const warningShown = useRef(false);

    const toggleImageImportModal = (open: boolean) => () => {
        if (open && isTemplateOwner === false && !warningShown.current) {
            eventBus.emit("openCustomDialog", {
            header: "Warning",
            body: "As you are not the owner of this template - any images you add will disappear on page refresh.",
            buttons: [
                {
                text: "I understand",
                onClick: () => {
                    eventBus.emit("closeCustomDialog");
                    warningShown.current = true;
                    setShowImageImportModal(true);
                },
                },
            ],
            });
        } else {
            setShowImageImportModal(open);
        }
    };


    const rowLimitReached = (): boolean =>
    {
      if (!tierlistTemplate) return true
      return tierlistTemplate.tierlist.rows.length >= 18;
    }

    const addRow = (): void => {
        if (rowLimitReached()) return;

        if (!tierlistTemplate) return;

        const tierlistRows: TierlistRow[] = tierlistTemplate.tierlist.rows;
    
        const newLabel: TierlistRow["label"] = tierlistRows.length === 0
            ? 'S'
            : String.fromCharCode(65 + tierlistRows.length - 1);
        
        const newTierlistRow: TierlistRow = {
            id: uuidv4(), 
            label: newLabel,
            items: [],
            type: TierlistElementType.TierlistRow
        };
    
        setTierlistTemplate(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                tierlist: {
                    ...prev.tierlist,
                    rows: [...prev.tierlist.rows, newTierlistRow]
                }
            };
        });
    };
    
    const removeRow = (): void => {
        if (!tierlistTemplate) return;
        if (tierlistTemplate.tierlist.rows.length === 0) return;
    
        setTierlistTemplate(prev => {
            if (!prev) return prev;
    
            const tierlistRows = prev.tierlist.rows;
            const lastTierlistRow = tierlistRows[tierlistRows.length - 1];
            const updatedTierlistRows = tierlistRows.slice(0, -1);
    
            if (updatedTierlistRows.length > 0) {
                // Move items to the previous row
                updatedTierlistRows[updatedTierlistRows.length - 1].items.push(...lastTierlistRow.items);
                return {
                    ...prev,
                    tierlist: {
                        ...prev.tierlist,
                        rows: updatedTierlistRows
                    }
                };
            } else {
                // Move items to reserve when removing last row
                const updatedReserve = [...(prev.tierlistReserve?.items ?? []), ...lastTierlistRow.items];
                return {
                    ...prev,
                    tierlistReserve: { ...prev.tierlistReserve, items: updatedReserve },
                    tierlist: { ...prev.tierlist, rows: updatedTierlistRows }
                };
            }
        });
    };

    const enableDeletionMode = () => {
        toggleDrawer(false)();
        setDeletionMode(true);
    };
    

    return (
        <div>
            <Box sx={{ position: "fixed", top: "50%", left: 10, transform: "translateY(-50%)" }}>
                <Fade in={!isDrawerOpen} timeout={500}>
                    <Stack spacing={2}>
                        <FloatingButton icon={<DoubleArrowIcon />} onClick={toggleDrawer(true)} />
                        <FloatingButton icon={<AddPhotoAlternateIcon />} onClick={toggleImageImportModal(true)} />
                    </Stack>
                </Fade>

                {/* Drawer component for the submenu */}
                <Drawer color="secondary" anchor="left" open={isDrawerOpen} onClose={toggleDrawer(false)}>
                  <Box
                      sx={{
                          width: 250,
                          padding: 2,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "start",
                      }}
                      role="presentation"
                  >
                    <Stack>
                    {tierlistTemplate?.templateID ? (
                        <>
                        <Typography color="text.secondary" variant="caption">Using template</Typography>
                        <Typography sx={{ lineHeight: 1.2 }} color="black" variant="subtitle2">{tierlistTemplate.templateTitle}</Typography>
                        </>
                    ) : (
                        <Typography color="black" variant="caption">Creating new template</Typography>
                    )}
                    </Stack>
                    <Divider />
                    <Button fullWidth variant="contained" sx={{ my: 1 }} onClick={toggleSaveModal(true)}>
                      Save
                    </Button>
                    <Button disabled={rowLimitReached()} fullWidth variant="contained" sx={{ mt: 1 }} onClick={() => addRow()}>
                      Add Row
                    </Button>
                    <Button disabled={tierlistTemplate?.tierlist.rows.length === 0} fullWidth variant="contained" sx={{ my: 1 }} onClick={() => removeRow()}>
                      Remove Row
                    </Button>
                    <Tooltip
                        title={
                            isTemplateOwner === false
                            ? "You cannot delete images on templates you do not own."
                            : ""
                        }
                        arrow
                        >
                        <Box display="inline-block" width="100%">
                            <Button
                                fullWidth
                                variant="contained"
                                color="error"
                                sx={{ mt: 1 }}
                                onClick={enableDeletionMode}
                                disabled={isTemplateOwner === false}
                            >
                            Delete Images
                            </Button>
                        </Box>
                    </Tooltip>
                  </Box>
                </Drawer>

            </Box>
            <SaveDialog open={showSaveModal} onClose={toggleSaveModal(false)}/>
            <ImageImportModal open={showImageImportModal} onClose={toggleImageImportModal(false)}/>
        </div>
    );
};

export default ControlPanel;