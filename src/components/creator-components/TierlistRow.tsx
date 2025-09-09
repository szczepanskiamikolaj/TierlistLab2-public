import React, { useState, useContext } from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import { TierlistImageComponent } from "./TierlistImage";
import TierlistRowEmptySpace from "./TierlistRowEmptySpace";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { TierlistTemplateContext } from "./TierlistTemplateContext";
import { DndTierlistRowData, TierlistElementType, TierlistRow, TierlistTemplate } from "./TierlistTypes";

interface VisualTierlistRowComponentProps {
  rowData: TierlistRow;
  rowIndex: number;
  listeners?: Record<string, any>; 
  attributes?: Record<string, any>; 
  isActive?: boolean;
}

export const ITEM_HEIGHT: number = 125;

export const calculateRowColor = (rowIndex: number): string => {
  return `hsl(${rowIndex * (360 / 16)}, 90%, 75%)`;
};

export const VisualTierlistRowComponent: React.FC<VisualTierlistRowComponentProps> = ({
  rowData,
  rowIndex,
  listeners,
  attributes,
  isActive = false,
}) => {
  const [isEditing, setEditing] = useState(false);
  const [editedLabel, setEditedLabel] = useState<string>(rowData.label);
  const { setTierlistTemplate, isInteractivityOff } = useContext(TierlistTemplateContext);
  const backgroundColor = calculateRowColor(rowIndex);

  const updateLabels = (rowIndex: number, updatedLabel: string) => {
    setTierlistTemplate((prevTemplate: TierlistTemplate | undefined) => {
      if (!prevTemplate) {
        return prevTemplate; // Return undefined if prevTemplate is undefined
      }
    
      const updatedRows = [...prevTemplate.tierlist.rows];
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        label: updatedLabel,
      };
    
      return {
        ...prevTemplate,
        tierlist: {
          ...prevTemplate.tierlist,
          rows: updatedRows,
        },
      };
    });
  };

  const handleLabelClick = () => {
    setEditing(true); 
  };

  const handleLabelBlur = () => {
    setEditing(false); 
    updateLabels(rowIndex, editedLabel); 
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditedLabel(e.target.value); // Update local state
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      handleLabelBlur(); // Save and exit editing
    }
  };


return (
  <Box
    sx={{
      position: "relative",
      display: "grid",
      gridTemplateColumns: isInteractivityOff
        ? `${ITEM_HEIGHT + 2}px 1fr` // No handle column
        : `${ITEM_HEIGHT + 2}px 1fr ${ITEM_HEIGHT + 2}px`, // With handle column
      alignItems: "stretch",
      border: "2px solid",
      borderColor: "primary.main",
      minHeight: `${ITEM_HEIGHT + 3}px`, 
      opacity: isActive ? 0 : 1, // Hide the row if it's the active item
      marginTop: "-2px", // Moves the row up by 2px to "merge" borders
      "@media (max-width: 600px)": {
        gridTemplateColumns: "1fr", 
        marginBottom: "16px",
      },
    }}
  >
    {/* Label Column */}
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: backgroundColor,
        color: "black",
        transition: "background-color 0.3s ease-in-out",
        cursor: isInteractivityOff ? "default" : "pointer",
        padding: "8px",
        whiteSpace: "normal",
        wordBreak: "break-word",
        "@media (max-width:600px)": {
          width: "100%",
          justifyContent: "space-between", // shift text left to make room for mobile handle
          paddingBottom: "16px",
        },
      }}
      onClick={!isInteractivityOff && !isEditing ? handleLabelClick : undefined}
    >
      {isEditing ? (
        <TextField
          value={editedLabel}
          onChange={handleLabelChange}
          onBlur={handleLabelBlur}
          onKeyPress={handleKeyPress}
          multiline
          fullWidth
          autoFocus
          size="small"
          variant="outlined"
          sx={{
            maxWidth: "100%",
            whiteSpace: "normal",
            wordBreak: "break-word",
            "& .MuiInputBase-input": { color: "#000" },
          }}
        />
      ) : (
        <Box
          sx={{
            flex: 1,
            textAlign: { xs: "left", sm: "center" },
            whiteSpace: "normal",
            wordBreak: "break-word",
            "@media (max-width:600px)": { mr: 1 },
            cursor: !isInteractivityOff ? "pointer" : "default",
          }}
          onClick={!isInteractivityOff ? handleLabelClick : undefined}
          dangerouslySetInnerHTML={{
            __html: rowData.label.replace(/\n/g, "<br>"),
          }}
        />
      )}


      {/* Invisible handle on desktop, visible on mobile */}
      {!isInteractivityOff && (
        <Box
          {...listeners}
          {...attributes}
          sx={{
            touchAction: "none",
            display: { xs: "flex", sm: "none" }, // hidden on PC
            alignItems: "center",
            cursor: "grab",
          }}
        >
          <DragHandleIcon fontSize="small" />
        </Box>
      )}
    </Box>

    {/* Image Grid Column */}
    <Box
       sx={(theme) => ({
        display: "flex",
        flexWrap: "wrap",
        backgroundColor: theme.palette.background.paper,
        minHeight: `${ITEM_HEIGHT}px`,
        alignContent: "flex-start",
        "@media (max-width: 600px)": {
          width: "100%",
        },
      })}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          flexWrap: "wrap",
          backgroundColor: theme.palette.background.paper,
          width: "100%",
          minHeight: `${ITEM_HEIGHT}px`,
          alignContent: "flex-start",
        })}
      >
        {/* Image Items */}
        <SortableContext
          id={`tierlist-row-${rowIndex}`}
          items={rowData.items.map((item) => item.id)}
          strategy={() => null}
        >
          {rowData.items.map((item, index) => (
            <Box key={`key-${item.id}`} sx={{ flex: "0 0 auto" }}>
              <TierlistImageComponent
                itemData={item}
                rowIndex={rowIndex}
                imageIndex={index}
              />
            </Box>
          ))}
        </SortableContext>

        <TierlistRowEmptySpace
          rowIndex={rowIndex}
          emptySpaceData={{
            id: rowData.id + "-empty-space",
            type: TierlistElementType.TierlistRowEmptySpace,
          }}
        />
      </Box>
    </Box>

    {/* Handle Column */}
    {!isInteractivityOff && (
      <Box
        {...attributes}
        {...listeners}
        sx={{
          touchAction: "none",
          display: { xs: "none", sm: "flex" }, // hide on mobile, show on PC
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "gray",
          cursor: "grab",
          width: `${ITEM_HEIGHT + 2}px`,
        }}
      >
        <IconButton sx={{ color: "primary.light" }} size="small">
          <DragHandleIcon />
        </IconButton>
      </Box>
    )}




    {/* Outline for Active Item */}
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
          pointerEvents: "none", // Ignore pointer events for the outline
        }}
      />
    )}
  </Box>
);

};

export interface TierlistRowComponentProps {
  rowData: TierlistRow;
  rowIndex: number;
}

export const TierlistRowComponent: React.FC<TierlistRowComponentProps> = ({
  rowData,
  rowIndex,
}) => {
  const { activeElement } = useContext(TierlistTemplateContext);

  const dndTierlistRowData: DndTierlistRowData = {
    rowIndex: rowIndex,
    elementData: rowData,
  };

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: rowData.id, 
    data: dndTierlistRowData, 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Box ref={setNodeRef} style={{ ...style, position: "relative" }}>
      <VisualTierlistRowComponent
        rowData={rowData}
        rowIndex={rowIndex}
        listeners={listeners}
        attributes={attributes}
        isActive={activeElement?.id === rowData.id}
      />
    </Box>
  );
};

