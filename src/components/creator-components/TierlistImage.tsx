import React, { useContext, useEffect } from "react";
import { Box, Icon } from "@mui/material";
import { ImageNotSupported as ImageNotFoundIcon, OtherHouses } from "@mui/icons-material";
import TierlistImageCaptionComponent from "./TierlistImageCaption";
import { TierlistTemplateContext } from "./TierlistTemplateContext";
import { DndTierlistImageData, TierlistImage } from "./TierlistTypes";
import { useSortable } from "@dnd-kit/sortable";
import { ITEM_HEIGHT } from "./TierlistRow";
import {CSS} from '@dnd-kit/utilities';

interface VisualTierlistImageComponentProps {
  itemData: TierlistImage;
  isActive?: boolean;
  listeners?: Record<string, any>;
  attributes?: Record<string, any>;
}

export const VisualTierlistImageComponent: React.FC<VisualTierlistImageComponentProps> = ({
  itemData,
  isActive = false,
  listeners,
  attributes,
}) => {
  const { imageFlags, setImageFlag, isDeletionMode } = useContext(TierlistTemplateContext);

  const handleImageError: React.ReactEventHandler<HTMLImageElement> = () => {
    setImageFlag(itemData.id, { hasError: true });
  };

  const handleImageLoad: React.ReactEventHandler<HTMLImageElement> = () => {
    setImageFlag(itemData.id, (prevFlags) => ({
      ...prevFlags,
      hasError: false,
    }));
  };

  const toggleMarkedForDeletion = () => {
    if (isDeletionMode) {
      setImageFlag(itemData.id, (prevFlags) => ({
        ...prevFlags,
        markedForDeletion: !prevFlags.markedForDeletion,
      }));
    }
  };

  const { hasError, markedForDeletion } = imageFlags[itemData.id] || {
    hasError: undefined,
    markedForDeletion: false,
  };

  useEffect(() => {
    console.log(`Image ${itemData.id} - hasError: ${hasError}, markedForDeletion: ${markedForDeletion}`);
  }, [hasError, markedForDeletion]);

  return (
    <Box
      sx={{
        touchAction: "none", // <- prevents scrolling on touch for this element only
        zIndex: isDeletionMode ? 1100 : "auto",
        position: "relative",
        height: `${ITEM_HEIGHT}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: hasError === true && !isActive ? "#f0f0f0" : "transparent",
        width: hasError === true ? `${ITEM_HEIGHT}px` : "auto",
        cursor: isDeletionMode ? "pointer" : "default",
        "&::before": markedForDeletion
          ? {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              boxShadow: "inset 0 0 0 2px red",
              pointerEvents: "none",
              zIndex: 2,
            }
          : undefined,
      }}
      onClick={toggleMarkedForDeletion}
      {...listeners}
      {...attributes}
    >
      {hasError === true && !isActive ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100px",
            height: "100%",
          }}
        >
          <Icon
            sx={{
              fontSize: "48px",
              width: "auto",
              height: "auto",
            }}
          >
            <ImageNotFoundIcon color="error" />
          </Icon>
        </Box>
      ) : (
        <TierlistImageCaptionComponent
          tierlistImageCaption={itemData.caption}
          hideSVG={hasError || isActive || (hasError === undefined && true)}
        >
          <img
            src={ itemData.croppedImageUrl || itemData.proxiedImageUrl ||  itemData.imageUrl}
            alt={`Item ${itemData.id}`}
            style={{
              height: `${ITEM_HEIGHT}px`,
              objectFit: "fill",
              visibility: hasError === undefined || isActive === true ? "hidden" : "visible",
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </TierlistImageCaptionComponent>
      )}

      {isActive && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: "2px dotted black",
            boxSizing: "border-box",
            pointerEvents: "none",
            width: hasError ? "100px" : "auto",
            zIndex: 3, 
          }}
        />
      )}
    </Box>
  );
};


interface TierlistImageComponentProps {
  itemData: TierlistImage;
  imageIndex: number;
  rowIndex?: number;
}

export const TierlistImageComponent: React.FC<TierlistImageComponentProps> = ({
  itemData,
  imageIndex,
  rowIndex,
}) => {
  const { activeElement, isDeletionMode } = useContext(TierlistTemplateContext);

  const dndTierlistImageData: DndTierlistImageData = {
    elementData: itemData,
    imageIndex,
    rowIndex,
  };

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: dndTierlistImageData.elementData.id,
    data: dndTierlistImageData,
  });



  return (
    <Box component="div" ref={!isDeletionMode ? setNodeRef : undefined} style={{
      transform: CSS.Transform.toString(transform),
      transition: transition || undefined,
    }}>
      <VisualTierlistImageComponent
        itemData={itemData}
        isActive={activeElement?.id === itemData.id}
        listeners={!isDeletionMode ? listeners : undefined}
        attributes={!isDeletionMode ? attributes : undefined}
      />
    </Box>
  );
};

