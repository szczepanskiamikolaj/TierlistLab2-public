import React, { useMemo } from 'react';
import { SortableContext } from '@dnd-kit/sortable'; 
import { TierlistElementType, TierlistReserve } from './TierlistTypes';
import TierlistReserveEmptySpace from './TierlistReserveEmptySpace';
import { TierlistImageComponent } from './TierlistImage';
import { Box } from '@mui/material';
import { ITEM_HEIGHT } from './TierlistRow';
import { MAX_HEIGHT_TO_WIDTH_RATIO } from './control-panel-components/image-import-components/ImageCropModal';

interface ReserveProps {
  tierlistReserve: TierlistReserve;
}

const Reserve: React.FC<ReserveProps> = ({ tierlistReserve }) => {
  const itemIds = useMemo(
    () => tierlistReserve.items.map(item => item.id),
    [tierlistReserve.items]
  );

  return (
    <SortableContext id="tierlistReserve" items={itemIds} strategy={() => null}>
        <Box
          sx={{
            my: "40px",
            display: "flex",
            flexWrap: "wrap",
            width: "1125px",
            minWidth: ITEM_HEIGHT*MAX_HEIGHT_TO_WIDTH_RATIO,
            minHeight: ITEM_HEIGHT,
            "@media (max-width:600px)": {
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              flexWrap: "nowrap",      
              overflowX: "auto",      
              backgroundColor: "rgba(255,255,255,0.9)", 
              borderTop: "2px solid black", 
              width: "100%",           
              minWidth: "auto",          
              padding: "8px",
              zIndex: 1200,
            },
          }}
        >
          {tierlistReserve.items.map((item, imageIndex) => (
            <Box key={item.id} sx={{ flex: "0 0 auto" }}>
              <TierlistImageComponent
                itemData={item}
                imageIndex={imageIndex}
              />
            </Box>
          ))}
          <TierlistReserveEmptySpace
            emptySpaceData={{
              id: 'tierlistReserve-empty-space',
              type: TierlistElementType.TierlistReserveEmptySpace,
            }}
            >
          </TierlistReserveEmptySpace>
        </Box>
    </SortableContext>
  );
};

export default Reserve;
