import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

const CreatorSkeleton: React.FC = () => {
    return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
            <Skeleton variant="rectangular" width={210} height={118} />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="80%" />
        </Box>
    );
};

export default CreatorSkeleton;
