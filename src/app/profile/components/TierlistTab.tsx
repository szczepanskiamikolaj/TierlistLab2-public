import React, { useEffect, useState, useRef } from "react";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PublicIcon from "@mui/icons-material/Public";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {  TierlistTemplate } from "@/components/creator-components/TierlistTypes";
import { changeTierlistVisibility, deleteTierlist, getUserTierlists } from "@/lib/utils/apiUtils"; 
import { User } from "firebase/auth";
import { useSnackbar } from "notistack";
import { CircularProgress, Typography, Box, Divider, List, ListItem, ListItemText, IconButton, Menu, MenuItem } from "@mui/material";

interface TierlistsTabProps {
  user: User;
}

const TierlistsTab: React.FC<TierlistsTabProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [tierlistsByTemplate, setTierlistsByTemplate] = useState<Record<string, TierlistTemplate[]>>({});
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTierlistId, setSelectedTierlistId] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const menuTextRef = useRef<string>("");

  useEffect(() => {
    const fetchTierlists = async () => {
      try {
        const tierlists = await getUserTierlists();

        // Group tierlists by their templateID
        const groupedTierlists: Record<string, TierlistTemplate[]> = {};

        for (const tierlist of tierlists) {
          if (!tierlist.templateID) continue;

          // Add the tierlist to the appropriate group
          if (!groupedTierlists[tierlist.templateID]) {
            groupedTierlists[tierlist.templateID] = [];
          }

          groupedTierlists[tierlist.templateID].push(tierlist);
        }

        setTierlistsByTemplate(groupedTierlists);
      } catch (error) {
        enqueueSnackbar("Failed to fetch tierlists. Please try again later.", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchTierlists();
  }, [user, enqueueSnackbar]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, tierlistID: string) => {
    const tierlist = Object.values(tierlistsByTemplate).flat().find((t) => t.tierlistID === tierlistID);
    // Store the menu text when opening the menu
    menuTextRef.current = tierlist?.isPrivate ? "Make Public" : "Make Private";
    
    setMenuAnchorEl(event.currentTarget);
    setSelectedTierlistId(tierlistID);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedTierlistId(null);
  };

  const handleDeleteTierlist = async () => {
    if (!selectedTierlistId) return;

    try {
      await deleteTierlist(selectedTierlistId);
      setTierlistsByTemplate((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((templateID) => {
          updated[templateID] = updated[templateID].filter((tierlist) => tierlist.tierlistID !== selectedTierlistId);
          if (updated[templateID].length === 0) delete updated[templateID];
        });
        return updated;
      });
      enqueueSnackbar("Tierlist deleted successfully.", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Failed to delete tierlist. Please try again.", { variant: "error" });
    } finally {
      handleMenuClose();
    }
  };

  const handleVisibilityChange = async () => {
    if (!selectedTierlistId) return;

    const tierlist = Object.values(tierlistsByTemplate).flat().find((t) => t.tierlistID === selectedTierlistId);
    if (!tierlist) return;

    const newVisibility = !tierlist.isPrivate;

    try {
      await changeTierlistVisibility({ tierlistID: selectedTierlistId, isPrivate: newVisibility });
      setTierlistsByTemplate((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((templateID) => {
          updated[templateID] = updated[templateID].map((t) =>
            t.tierlistID === selectedTierlistId ? { ...t, isPrivate: newVisibility } : t
          );
        });
        return updated;
      });
      
      // Update the menu text after changing visibility
      menuTextRef.current = newVisibility ? "Make Public" : "Make Private";
      
      enqueueSnackbar(`Tierlist is now ${newVisibility ? "private" : "public"}.`, { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Failed to update tierlist visibility. Please try again.", { variant: "error" });
    } finally {
      handleMenuClose();
    }
  };

  if (loading) {
    return <CircularProgress sx={{ color: (theme) => theme.palette.text.primary}}/>
  }

  if (Object.keys(tierlistsByTemplate).length === 0) {
    return <Typography>No tierlists found. Create your first one!</Typography>;
  }

  return (
    <Box>
      {Object.entries(tierlistsByTemplate).map(([templateID, tierlists]) => (
        <Box key={templateID} sx={{ marginBottom: 4 }}>
          {/* Display the template title (from the first tierlist in the group) */}
          <Typography variant="h5" gutterBottom>
            {tierlists[0]?.templateTitle || "Untitled Template"}
          </Typography>
          <Divider sx={{ marginBottom: 2 }} />
          <List>
            {tierlists.map((tierlist) => (
              <ListItem key={tierlist.tierlistID}>
                {tierlist.isPrivate ? (
                  <VisibilityOffIcon sx={{ marginRight: 2 }} />
                ) : (
                  <PublicIcon sx={{ marginRight: 2 }} />
                )}
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      component="a"
                      href={`/tierlist/${tierlist.tierlistID}`}
                      sx={{ textDecoration: "none", color: "textPrimary" }}
                    >
                      {tierlist.tierlistTitle || "Untitled Tierlist"}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {tierlist.tierlistID}
                    </Typography>
                  }
                />
                <IconButton
                  edge="end"
                  aria-label="more"
                  onClick={(event) => handleMenuOpen(event, tierlist.tierlistID as string)}
                >
                  <MoreVertIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
          <Divider />
        </Box>
      ))}
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleVisibilityChange} sx={{ color: 'black' }}>
          {menuTextRef.current}
        </MenuItem>
        <MenuItem onClick={handleDeleteTierlist} sx={{ color: 'black' }}>Delete</MenuItem>
      </Menu>
    </Box>
  );
};

export default TierlistsTab;