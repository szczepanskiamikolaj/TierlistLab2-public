import React, { useContext, useEffect } from "react";
import { TierlistTemplateContext } from "../TierlistTemplateContext";

export const DeletionOverlay = () => {
  const {
    isDeletionMode,
    setDeletionMode,
    imageFlags,
    setTierlistTemplate,
    setImageFlag,
  } = useContext(TierlistTemplateContext);

  // Count the number of images marked for deletion
  const markedCount = Object.values(imageFlags).filter(
    (flag) => flag?.markedForDeletion
  ).length;

  const handleDeleteImages = () => {
    if (
      window.confirm(
        "Are you sure you want to delete the selected images? Uploaded images will still be available on your account."
      )
    ) {
      const idsToDelete = Object.keys(imageFlags).filter(
        (id) => imageFlags[id]?.markedForDeletion
      );
  
      // Update the tierlist template
      setTierlistTemplate((prev) => {
        if (!prev) return prev;
  
        const updatedRows = prev.tierlist.rows.map((row) => ({
          ...row,
          items: row.items.filter((item) => !idsToDelete.includes(item.id)),
        }));
  
        const updatedReserve = {
          ...prev.tierlistReserve,
          items: prev.tierlistReserve.items.filter(
            (item) => !idsToDelete.includes(item.id)
          ),
        };
  
        return {
          ...prev,
          tierlist: {
            ...prev.tierlist,
            rows: updatedRows,
          },
          tierlistReserve: updatedReserve,
        };
      });
  
      // Remove deleted image flags
      idsToDelete.forEach((id) => {
        setImageFlag(id, null); 
      });
  
      setDeletionMode(false);
    }
  };
  
  

  if (!isDeletionMode) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        color: "white",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#333",
          padding: "10px 20px",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        {markedCount === 0 ? (
          <p style={{ fontSize: "0.9em", marginBottom: "10px" }}>
            Select images to delete
          </p>
        ) : (
          <>
            <p style={{ fontSize: "0.9em", marginBottom: "10px" }}>
              {markedCount} image{markedCount > 1 ? "s" : ""} marked for deletion
            </p>
            <button
              onClick={handleDeleteImages}
              style={{
                backgroundColor: "red",
                color: "white",
                border: "none",
                padding: "10px 20px",
                margin: "10px 0",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Delete Images
            </button>
          </>
        )}
        <button
          onClick={() => {
            // Clear all markedForDeletion flags
            Object.keys(imageFlags).forEach((id) => {
              if (imageFlags[id]?.markedForDeletion) {
                setImageFlag(id, { ...imageFlags[id], markedForDeletion: false });
              }
            });
            setDeletionMode(false);
          }}
          style={{
            backgroundColor: "gray",
            color: "white",
            border: "none",
            padding: "5px 10px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
