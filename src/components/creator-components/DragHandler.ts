import { DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { Dispatch, SetStateAction } from "react";
import { DndTierlistImageData, DndTierlistRowData, TierlistElementType, TierlistImage, TierlistRow, TierlistTemplate } from "./TierlistTypes";
import { arrayMove } from "@dnd-kit/sortable";
import { isDndTierlistImageData, isDndTierlistReserveEmptySpaceData, isDndTierlistRowData, isDndTierlistRowEmptySpaceData } from "./TierlistTypeGuards";
import { TierlistRowComponentProps } from "./TierlistRow";

class DragHandler {
  private setActiveElement: Dispatch<SetStateAction<TierlistRow | TierlistImage | null>>;
  private setActiveElementRow: Dispatch<SetStateAction<TierlistRowComponentProps["rowIndex"] | null>>; 
  private createStrictImageDragHandler(
    maxPerSecond = 6
  ): typeof this.handleImageDrag {
    let callCount = 0;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;
    let queuedArgs: Parameters<typeof this.handleImageDrag> | null = null;
  
    const flushQueue = () => {
      if (queuedArgs) {
        this.handleImageDrag(...queuedArgs);
        callCount = 1;
        queuedArgs = null;
      } else {
        callCount = 0;
      }
      resetTimer = null;
    };
  
    return (...args: Parameters<typeof this.handleImageDrag>) => {
      if (callCount < maxPerSecond) {
        this.handleImageDrag(...args);
        callCount++;
  
        if (!resetTimer) {
          resetTimer = setTimeout(flushQueue, 1000);
        }
      } else {
        // We're still in cooldown – store only the latest args
        queuedArgs = args;
  
        // Ensure the timer will flush the queue
        if (!resetTimer) {
          resetTimer = setTimeout(flushQueue, 1000);
        }
      }
    };
  }
  
  
  private safeHandleImageDrag: typeof this.handleImageDrag;

  constructor(
    setActiveElement: Dispatch<SetStateAction<TierlistRow | TierlistImage | null>>,
    setActiveElementRow: Dispatch<SetStateAction<TierlistRowComponentProps["rowIndex"] | null>> 
  ) {
    this.setActiveElement = setActiveElement;
    this.setActiveElementRow = setActiveElementRow;
    this.safeHandleImageDrag = this.createStrictImageDragHandler(10);
  }

  public handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    this.setActiveElement(active?.data?.current?.elementData || null);
    this.setActiveElementRow(active?.data?.current?.rowIndex ?? null)
  };

  public handleDragOver = (
    event: DragOverEvent,
    tierlistTemplate: TierlistTemplate,
    setTierlistTemplate: Dispatch<SetStateAction<TierlistTemplate | undefined>>
  ) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data?.current as unknown;
    const overData = over.data?.current as unknown;

    if (isDndTierlistImageData(activeData) && !isDndTierlistRowData(overData)) {
      this.safeHandleImageDrag(activeData, overData, tierlistTemplate, setTierlistTemplate);
    }
  };

  public handleDragEnd = (
    event: DragOverEvent,
    tierlistTemplate: TierlistTemplate,
    setTierlistTemplate: Dispatch<SetStateAction<TierlistTemplate | undefined>>
  ) => {
    const { active, over } = event;

    const activeData = active?.data?.current as unknown;
    const overData = over?.data?.current as unknown;


    if (!over) {
      // Dropped outside any drop zone → return image to reserve
      if (isDndTierlistImageData(activeData)) {
        setTierlistTemplate(prev => {
          if (!prev || activeData.rowIndex == null) return prev;

          const newTierlistReserve = { ...prev.tierlistReserve };
          const newTierlist = { ...prev.tierlist };

          const sourceRow = newTierlist.rows[activeData.rowIndex];
          sourceRow.items = sourceRow.items.filter((_, index) => index !== activeData.imageIndex);
          newTierlist.rows[activeData.rowIndex] = { ...sourceRow };

          newTierlistReserve.items.push(activeData.elementData);

          return {
            ...prev,
            tierlistReserve: newTierlistReserve,
            tierlist: newTierlist,
          };
        });
      }
    } else if (
      isDndTierlistRowData(activeData) &&
      isDndTierlistRowData(overData) &&
      activeData.rowIndex !== overData.rowIndex
    ) {
      this.handleRowDrag(activeData, overData.rowIndex, tierlistTemplate, setTierlistTemplate);
    }

    this.setActiveElement(null);
    this.setActiveElementRow(null);
  };
  

  private handleImageDrag = (
    activeData: DndTierlistImageData,
    overData: unknown,
    tierlistTemplate: TierlistTemplate,
    setTierlistTemplate: Dispatch<SetStateAction<TierlistTemplate | undefined>>
  ) => {
    performImageDrag(activeData,overData,tierlistTemplate,setTierlistTemplate)
  }
  
  private handleRowDrag(activeData: DndTierlistRowData, overDataIndex: number, tierlistTemplate: TierlistTemplate, setTierlistTemplate: Dispatch<SetStateAction<TierlistTemplate | undefined>>) {
    setTierlistTemplate(prev => {
      if (!prev) return prev;
      const newRows = arrayMove(prev.tierlist.rows, activeData.rowIndex, overDataIndex);
      return {
          ...prev,
          tierlist: { ...prev.tierlist, rows: newRows },
      };
    });
  }
}

export function performImageDrag(
  activeData: DndTierlistImageData,
  overData: unknown,
  tierlistTemplate: TierlistTemplate,
  setTierlistTemplate: Dispatch<SetStateAction<TierlistTemplate | undefined>>
) {
  // 1: Create copies of tierlist and tierlistReserve
  const { tierlist, tierlistReserve } = tierlistTemplate;
  let newTierlistReserve = { ...tierlistReserve };
  let newTierlist = { ...tierlist };

  // 2: Ensure the active image is removed from its previous location
  if (activeData.rowIndex === undefined) {
    // Active data is from tierlistReserve, remove it
    newTierlistReserve.items = newTierlistReserve.items.filter(
      (item) => item.id !== activeData.elementData.id
    );
  } else {
    // Active data is from a row, remove it from that row
    const sourceRow = newTierlist.rows[activeData.rowIndex];
    newTierlist.rows[activeData.rowIndex] = {
      ...sourceRow,
      items: sourceRow.items.filter((_, index) => index !== activeData.imageIndex),
    };
  }

  // 3: Determine where to place the dragged item
  if (isDndTierlistRowEmptySpaceData(overData)) {
    // Moving to an empty space in a row
    const targetRowIndex = overData.rowIndex;
    const targetRow = newTierlist.rows[targetRowIndex];

    // Prevent duplicate insertion
    if (!targetRow.items.some(item => item.id === activeData.elementData.id)) {
      newTierlist.rows[targetRowIndex] = {
        ...targetRow,
        items: [...targetRow.items, activeData.elementData], // Append at end
      };
    }
  } else if (isDndTierlistImageData(overData)) {
    if (overData.rowIndex === undefined) {
      // Moving into the reserve
      const targetIndex = overData.imageIndex ?? newTierlistReserve.items.length;

      // Prevent duplicate insertion
      if (!newTierlistReserve.items.some(item => item.id === activeData.elementData.id)) {
        newTierlistReserve.items = [
          ...newTierlistReserve.items.slice(0, targetIndex),
          activeData.elementData,
          ...newTierlistReserve.items.slice(targetIndex),
        ];
      }
    } else {
      // Moving within a row
      const targetRow = newTierlist.rows[overData.rowIndex];

      // Prevent duplicate insertion
      if (!targetRow.items.some(item => item.id === activeData.elementData.id)) {
        targetRow.items.push(activeData.elementData);

        // Move the item to the correct index
        const newRowItems = arrayMove(targetRow.items, targetRow.items.length - 1, overData.imageIndex);
        newTierlist.rows[overData.rowIndex] = { ...targetRow, items: newRowItems };
      }
    }
  } else if (isDndTierlistReserveEmptySpaceData(overData)) {
    // Moving back to an empty space in the reserve
    // Prevent duplicate insertion
    if (!newTierlistReserve.items.some(item => item.id === activeData.elementData.id)) {
      newTierlistReserve.items = [...newTierlistReserve.items, activeData.elementData];
    }
  }

  // 4: Update state with the new tierlist data
  setTierlistTemplate(prev => {
    if (!prev) return prev;

    return {
      ...prev,
      tierlistReserve: { ...prev.tierlistReserve, items: [...newTierlistReserve.items] },
      tierlist: { ...prev.tierlist, rows: [...newTierlist.rows] },
    };
  })
}


  
export default DragHandler;


