"use client";

import React, { useEffect, useState, useRef } from "react";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PublicIcon from "@mui/icons-material/Public";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useSnackbar } from "notistack";
import Link from "next/link";
import { TierlistTemplate } from "@/components/creator-components/TierlistTypes";
import { User } from "firebase/auth";
import { changeTemplateVisibility, deleteTemplate, getUserTemplates } from "@/lib/utils/apiUtils";
import { eventBus } from "@/lib/eventBus";
import { Box, List, ListItem, IconButton, ListItemText, Stack, Typography, Divider, Menu, MenuItem, CircularProgress } from "@mui/material";

interface TemplatesTabProps {
  user: User;
}

const TemplatesTab: React.FC<TemplatesTabProps> = ({ user }) => {
  const [templates, setTemplates] = useState<TierlistTemplate[]>([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState<boolean>(false);
  const { enqueueSnackbar } = useSnackbar();
  const menuTextRef = useRef<string>("");

  useEffect(() => {
    (async () => {
      try {
        const templates = await getUserTemplates();
        setTemplates(templates);
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error.message || "Unknown error";
        enqueueSnackbar(`Error fetching templates: ${errorMessage}`, {
          variant: "error",
        });
      }
      
    })();
  }, [user, enqueueSnackbar]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, templateId: string) => {
    const template = templates.find((t) => t.templateID === templateId);
    // Store the menu text when opening the menu
    menuTextRef.current = template?.isPrivate ? "Make Public" : "Make Private";
    
    setMenuAnchorEl(event.currentTarget);
    setSelectedTemplateId(templateId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedTemplateId(null);
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplateId) return;

    eventBus.emit("openCustomDialog", {
      header: "Delete Template",
      body: `Are you sure you want to delete this template? This action cannot be undone.`,
      buttons: [
        {
          text: "Delete",
          onClick: async () => {
            try {
              await deleteTemplate(selectedTemplateId);
              setTemplates((prev) =>
                prev.filter((template) => template.templateID !== selectedTemplateId)
              );
              enqueueSnackbar("Template deleted successfully.", { variant: "success" });
            } catch (error) {
              enqueueSnackbar("Error deleting template. Please try again.", { variant: "error" });
            } finally {
              eventBus.emit("closeCustomDialog");
            }
          },
        },
      ],
    });

    handleMenuClose();
  };

  const handleVisibilityChange = async () => {
    if (!selectedTemplateId) return;

    const template = templates.find((t) => t.templateID === selectedTemplateId);
    if (!template) return;

    const newVisibility = !template.isPrivate;

    try {
      setIsUpdatingVisibility(true);

      await changeTemplateVisibility({ templateID: selectedTemplateId, isPrivate: newVisibility });

      setTemplates((prev) =>
        prev.map((t) =>
          t.templateID === selectedTemplateId ? { ...t, isPrivate: newVisibility } : t
        )
      );

      // Update the menu text after changing visibility
      menuTextRef.current = newVisibility ? "Make Public" : "Make Private";

      enqueueSnackbar(
        `Template is now ${newVisibility ? "private" : "public"}`,
        { variant: "success" }
      );
    } catch (error) {
      enqueueSnackbar("Failed to update template visibility. Please try again.", { variant: "error" });
    } finally {
      setIsUpdatingVisibility(false);
      handleMenuClose();
    }
  };

  return (
    <Box>
      <List>
        {templates.map((template) => (
          <React.Fragment key={template.templateID}>
            <ListItem
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="more"
                  onClick={(event) => handleMenuOpen(event, template.templateID as string)}
                >
                  <MoreVertIcon />
                </IconButton>
              }
            >
              {template.isPrivate ? (
                <VisibilityOffIcon sx={{ marginRight: 2 }} />
              ) : (
                <PublicIcon sx={{ marginRight: 2 }} />
              )}
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1}>
                    <Link href={`/template/${template.templateID}`} passHref>
                      <Typography
                        variant="body1"
                        component="a"
                        color="textPrimary"
                        sx={{ textDecoration: "none", cursor: "pointer" }}
                      >
                        {template.templateTitle}
                      </Typography>
                    </Link>
                  </Stack>
                }
                secondary={
                  <Link href={`/template/${template.templateID}`} passHref>
                    <Typography
                      variant="caption"
                      component="a"
                      color="textSecondary"
                      sx={{ textDecoration: "none", cursor: "pointer" }}
                    >
                      {template.templateID}
                    </Typography>
                  </Link>
                }
              />
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={handleVisibilityChange}
          disabled={isUpdatingVisibility}
          sx={{color: "black"}}
        >
          {isUpdatingVisibility ? (
            <CircularProgress sx={{ color: (theme) => theme.palette.text.primary}}/>  
          ) : menuTextRef.current}
        </MenuItem>
        <MenuItem onClick={handleDeleteTemplate} sx={{color: "black"}}>Delete</MenuItem>
      </Menu>
    </Box>
  );
};

export default TemplatesTab;