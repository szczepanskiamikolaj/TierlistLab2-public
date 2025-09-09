import { useCallback, useEffect, useMemo, useState } from "react";
import { ImageFlags, TierlistTemplateContext } from "./creator-components/TierlistTemplateContext";
import { TierlistElementType, TierlistImage, TierlistRow, TierlistTemplate } from "./creator-components/TierlistTypes";
import TierlistComponent from "./creator-components/Tierlist";
import CreatorSkeleton from "./skeletons/CreatorSkeleton";
import Reserve from "./creator-components/TierlistReserve";
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, MouseSensor, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import DragHandler from "./creator-components/DragHandler";
import ControlPanel from "./creator-components/ControlPanel";
import { fetchTierlistTemplate, saveTemplate } from "@/lib/utils/storageUtils";
import { VisualTierlistImageComponent } from "./creator-components/TierlistImage";
import { TierlistRowComponentProps, VisualTierlistRowComponent } from "./creator-components/TierlistRow";
import { useDebouncedCallback } from "use-debounce";
import { enqueueSnackbar } from "notistack";
import { handleError } from "@/lib/utils/errorUtils";
import { useAuthState } from "react-firebase-hooks/auth";
import { firebaseAuth } from "@/lib/firebaseConfig";
import { DeletionOverlay } from "./creator-components/control-panel-components/DeletionOverlay";
import { Box, Grid2 } from "@mui/material";

interface TemplateCreatorProps {
    templateID?: string;
}
export const TemplateCreator: React.FC<TemplateCreatorProps> = ({ templateID }) => {
    const [activeElement, setActiveElement] = useState<TierlistRow | TierlistImage | null>(null);
    const [activeElementRow, setActiveElementRow] = useState<TierlistRowComponentProps["rowIndex"] | null>(null);
    const [isTemplateOwner, setIsTemplateOwner] = useState<boolean | undefined>(undefined);
    const [tierlistTemplate, setTierlistTemplate] = useState<TierlistTemplate | undefined>(undefined);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Track unsaved changes
    const dragHandler = useMemo(
        () => new DragHandler(setActiveElement, setActiveElementRow),
        [setActiveElement, setActiveElementRow]
    );    
    const [currentUser, loadingUser] = useAuthState(firebaseAuth); 
    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(PointerSensor));
    const [imageFlags, setImageFlags] = useState<Record<string, ImageFlags>>({});
    const [isDeletionMode, setDeletionMode] = useState<boolean>(false);

    

    const setImageFlag = (
        imageId: string,
        flagUpdater: Partial<ImageFlags> | ((prevFlags: ImageFlags) => Partial<ImageFlags>) | null 
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
                const tierlistTemplatePayload = await fetchTierlistTemplate(templateID);
                setTierlistTemplate(tierlistTemplatePayload.payload.template);
                setIsTemplateOwner(tierlistTemplatePayload.payload.isOwner);
                if(tierlistTemplatePayload.hadErrors)enqueueSnackbar("Some images could not be loaded and were skipped.", { variant: "warning" });
            } catch (error) {
                enqueueSnackbar('Error fetching template: ' + handleError(error), { variant: "error" });
            }
        };

        fetchTemplate();
    }, [templateID]);

    const debouncedSave = useDebouncedCallback(
        async (template: TierlistTemplate) => {
            try {
                await saveTemplate({ template, isOwner: isTemplateOwner });
                setHasUnsavedChanges(false); 
            } catch (error) {
                enqueueSnackbar('Error saving template: ' + handleError(error), { variant: "error" });
            }
        },
        2000 
    );

    useEffect(() => {
        if (tierlistTemplate) {
            setHasUnsavedChanges(true); // Mark as unsaved when template updates
            debouncedSave(tierlistTemplate);
        }
    }, [tierlistTemplate, debouncedSave]);

    // Warn user before closing tab if there are unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                event.preventDefault();
                event.returnValue = ""; // Required for most browsers to show the warning
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);

    // Update ownership state based on currentUser and template data
    useEffect(() => {
        if (!tierlistTemplate?.owner) return; // template not ready yet

        if (currentUser) {
            setIsTemplateOwner(currentUser.uid === tierlistTemplate.owner);
        } else {
            setIsTemplateOwner(false); // template has owner, but no user logged in
        }
    }, [currentUser, tierlistTemplate]);


    const isLoading = loadingUser || !tierlistTemplate;

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            if (!isDeletionMode) {
                dragHandler.handleDragStart(event);
            }
        },
        [isDeletionMode]
    );
    
    const handleDragOver = useCallback(
        (event: DragOverEvent) => {

            if(!tierlistTemplate) return;

            if (!isDeletionMode) {
                dragHandler.handleDragOver(event, tierlistTemplate, setTierlistTemplate);
            }
        },
        [isDeletionMode, tierlistTemplate, setTierlistTemplate]
    );
    
    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {

            if(!tierlistTemplate) return;

            if (!isDeletionMode) {
                dragHandler.handleDragEnd(event, tierlistTemplate, setTierlistTemplate);
            }
        },
        [isDeletionMode, tierlistTemplate, setTierlistTemplate]
    );
    

    return (
        <TierlistTemplateContext.Provider value={{
            activeElement,
            setActiveElement,
            activeElementRow,
            setActiveElementRow,
            tierlistTemplate,
            setTierlistTemplate,
            isTemplateOwner,
            setIsTemplateOwner,
            imageFlags,
            setImageFlag: setImageFlag,
            isDeletionMode, 
            setDeletionMode,
            isInteractivityOff: false,
        }}>
            {isLoading ? (
                <CreatorSkeleton />
            ) : (
                <DndContext
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    sensors={sensors}
                >
                    <Grid2
                        container
                        sx={{
                            display: 'flex',
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <TierlistComponent tierlistData={tierlistTemplate.tierlist} />
                        <Reserve tierlistReserve={tierlistTemplate.tierlistReserve} />
                    </Grid2>
                    <DragOverlay>
                        {activeElement?.type === TierlistElementType.TierlistImage ? (
                            <VisualTierlistImageComponent itemData={activeElement} />
                        ) : (
                            activeElement?.type === TierlistElementType.TierlistRow &&
                            activeElementRow !== null && (
                                <VisualTierlistRowComponent
                                    rowData={activeElement}
                                    rowIndex={activeElementRow}
                                />
                            )
                        )}
                    </DragOverlay>
                </DndContext>
            )}
            <ControlPanel />
            <DeletionOverlay/>
        </TierlistTemplateContext.Provider>
    );
};

 