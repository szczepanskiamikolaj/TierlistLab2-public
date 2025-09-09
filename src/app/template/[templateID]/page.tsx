"use client";

import { TemplateCreator } from "@/components/TemplateCreator";
import SideAd from "@/components/ads/SideAd";
import { Box } from "@mui/material";

export default function Page({ params }: { params: { templateID: string } }) {
  const { templateID } = params;

  return (
    <>
      <Box sx={{ position: "relative" }}>
        <TemplateCreator templateID={templateID} />

        <SideAd />
      </Box>
    </>
  );
}
