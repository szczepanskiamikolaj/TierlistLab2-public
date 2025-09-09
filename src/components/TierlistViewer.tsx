"use client"

import { useEffect, useState } from "react";
import { fetchTierlist, fetchTierlistTemplate } from "@/lib/utils/storageUtils";
import { enqueueSnackbar } from "notistack";
import { handleError } from "@/lib/utils/errorUtils";
import { Grid2, Link, Typography } from "@mui/material";
import CreatorSkeleton from "@/components/skeletons/CreatorSkeleton";
import TierlistComponent from "@/components/creator-components/Tierlist";
import { TierlistTemplate } from "@/components/creator-components/TierlistTypes";
import { ImageFlags, TierlistTemplateContext } from "@/components/creator-components/TierlistTemplateContext";

interface TierlistViewerProps {
  tierlistID?: TierlistTemplate['tierlistID'];
}

const TierlistViewer: React.FC<TierlistViewerProps> = ({ tierlistID }) => {
    const [tierlistTemplate, setTierlistTemplate] = useState<TierlistTemplate | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [imageFlags, setImageFlags] = useState<Record<string, ImageFlags>>({});

    const setImageFlag = (
        imageId: string,
        flagUpdater: Partial<ImageFlags> | ((prevFlags: ImageFlags) => Partial<ImageFlags>) | null // Add null as possible type
      ) => {
        setImageFlags((prevState) => {
          // If flagUpdater is null, remove the entry completely
          if (flagUpdater === null) {
            const { [imageId]: _, ...rest } = prevState;
            return rest;
          }
      
          const prevFlags = prevState[imageId] || { hasError: false, markedForDeletion: false };
          const updatedFlags =
            typeof flagUpdater === "function"
              ? flagUpdater(prevFlags)
              : { ...prevFlags, ...flagUpdater };
      
          // Ensure updatedFlags always conforms to ImageFlags
          const newFlags: ImageFlags = {
            hasError: updatedFlags.hasError ?? prevFlags.hasError,
            markedForDeletion: updatedFlags.markedForDeletion ?? prevFlags.markedForDeletion,
          };
      
          return {
            ...prevState,
            [imageId]: newFlags,
          };
        });
      };

    useEffect(() => {
        const fetchTemplate = async () => {
        try {
            const tierlist = await fetchTierlist(tierlistID);
            setTierlistTemplate(tierlist.tierlist);
            if (tierlist.hadErrors) enqueueSnackbar("Some images could not be loaded and were skipped.", { variant: "warning" });
        } catch (error) {
            enqueueSnackbar("Error fetching template: " + handleError(error), { variant: "error" });
        } finally {
            setIsLoading(false);
        }
        };

        if (tierlistID) fetchTemplate();
    }, [tierlistID]);

    if (isLoading) {
        return <CreatorSkeleton />;
    }

    if (!tierlistTemplate) {
        return <div>Error loading tierlist</div>;
    }

    return (
        <TierlistTemplateContext.Provider value={{
            activeElement: null,
            setActiveElement: () => {},
            activeElementRow: null,
            setActiveElementRow: () => {},
            tierlistTemplate,
            setTierlistTemplate,
            isTemplateOwner: undefined,
            setIsTemplateOwner: () => {},
            imageFlags: imageFlags,
            setImageFlag: setImageFlag,
            isDeletionMode: false, 
            setDeletionMode: () => {},
            isInteractivityOff: true,
        }}>
            <Grid2 container sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                {/* Title Section */}
                <Typography variant="h6" sx={{ textAlign: "center" }}>
                    Tierlist <strong>{tierlistTemplate.tierlistTitle}</strong> made with template <strong>{tierlistTemplate.templateTitle}</strong>
                </Typography>

                {/* Link to Template */}
                <Link href={`/template/${tierlistTemplate.templateID}`} sx={{ textDecoration: "none", color: "primary.main", fontSize: 14 }}>
                    Go to template
                </Link>

                {/* Tierlist Component */}
                <TierlistComponent tierlistData={tierlistTemplate.tierlist} />
            </Grid2>
        </TierlistTemplateContext.Provider>
    );
};

export default TierlistViewer;