"use client";

import React, { useState } from "react";
import { Box, Tabs, Tab, Typography, CircularProgress } from "@mui/material";
import { firebaseAuth } from "@/lib/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import TemplatesTab from "./components/TemplatesTab";
import TierlistsTab from "./components/TierlistTab";
import ImagesTab from "./components/ImagesTab";

const ProfilePage: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [user, loading] = useAuthState(firebaseAuth);

  const handleTabChange = (_event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex);
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!user) {
    return (
      <Box sx={{ padding: 2 }}>
        <Typography variant="h5">Please log in to view your profile.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        aria-label="profile tabs"
        textColor="inherit"
        sx={{
          "& .MuiTabs-indicator": {
            backgroundColor: (theme) => theme.palette.text.primary,
          },
        }}
      >
        <Tab
          label="Templates"
          sx={(theme) => ({
            color: tabIndex === 0 ? theme.palette.text.primary : theme.palette.text.secondary,
          })}
        />
        <Tab
          label="Tierlists"
          sx={(theme) => ({
            color: tabIndex === 1 ? theme.palette.text.primary : theme.palette.text.secondary,
          })}
        />
        <Tab
          label="Images"
          sx={(theme) => ({
            color: tabIndex === 2 ? theme.palette.text.primary : theme.palette.text.secondary,
          })}
        />
      </Tabs>
      {tabIndex === 0 && <TemplatesTab user={user} />}
      {tabIndex === 1 && <TierlistsTab user={user} />}
      {tabIndex === 2 && <ImagesTab />}
    </Box>
  );
};

export default ProfilePage;
