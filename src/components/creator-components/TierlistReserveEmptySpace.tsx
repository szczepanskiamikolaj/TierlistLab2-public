import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import Box from '@mui/material/Box';
import { DndTierlistReserveEmptySpaceData, TierlistReserveEmptySpace } from './TierlistTypes';
import { ITEM_HEIGHT } from './TierlistRow';

interface TierlistReserveEmptySpaceComponentProps {
  emptySpaceData: TierlistReserveEmptySpace;
}

export const TierlistReserveEmptySpaceComponent: React.FC<TierlistReserveEmptySpaceComponentProps> = ({
  emptySpaceData,
}) => {
  const dndTierlistReserveEmptySpaceData: DndTierlistReserveEmptySpaceData = {
    elementData: emptySpaceData,
  };

  const { setNodeRef } = useDroppable({
    id: emptySpaceData.id,
    data: dndTierlistReserveEmptySpaceData,
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: 'flex',
        flexGrow: 1,        
        flexBasis: 'auto', 
        minHeight: ITEM_HEIGHT,
        boxSizing: 'border-box',
      }}
    />
  );
};

export default TierlistReserveEmptySpaceComponent;
