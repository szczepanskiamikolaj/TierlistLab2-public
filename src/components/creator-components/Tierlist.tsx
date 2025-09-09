import React, { useEffect, useMemo } from 'react';
import { SortableContext, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Box, Grid2 } from '@mui/material';
import { TierlistRowComponent } from './TierlistRow';
import { Tierlist } from './TierlistTypes';

interface TierlistComponentProps {
  tierlistData: Tierlist;
}

export const TierlistComponent: React.FC<TierlistComponentProps> = ({ tierlistData }) => {
  const itemIds = useMemo(
    () => tierlistData.rows.map((row) => row.id),
    [tierlistData]
  );
  
  return (
    <SortableContext
      items={itemIds}
      strategy={verticalListSortingStrategy}
    >
      <Box sx={{ width: "100%", maxWidth: "1400px", marginTop: 5, display: "flex", flexDirection: "column"}}> 
        {tierlistData.rows.map((row, rowIndex) => (
          <TierlistRowComponent key={row.id} rowData={row} rowIndex={rowIndex} />
        ))}
      </Box>
    </SortableContext>
  );
};

export default TierlistComponent;
    