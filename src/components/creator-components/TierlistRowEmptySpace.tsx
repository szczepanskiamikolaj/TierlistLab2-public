import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import Box from '@mui/material/Box';
import { DndTierlistRowEmptySpaceData, TierlistRowEmptySpace } from './TierlistTypes';
import { ITEM_HEIGHT } from './TierlistRow';

interface TierlistRowEmptySpaceComponentProps {
  emptySpaceData: TierlistRowEmptySpace
  rowIndex: number;
}

export const TierlistRowEmptySpaceComponent: React.FC<TierlistRowEmptySpaceComponentProps> = ({ emptySpaceData, rowIndex }) => {
  const dndTierlistRowEmptySpaceData: DndTierlistRowEmptySpaceData = {
    rowIndex: rowIndex,
    elementData: emptySpaceData
  };
  
  const { setNodeRef } = useDroppable({
    id: emptySpaceData.id,
    data: dndTierlistRowEmptySpaceData
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexGrow: 1,
        flexBasis: 'auto',
        flexWrap: 'wrap',
        minHeight: ITEM_HEIGHT,       
        border: '0px solid red',
        borderRadius: '8px',
        boxSizing: 'border-box',
      }}
    >
    </Box>
  );
};

export default TierlistRowEmptySpaceComponent;
