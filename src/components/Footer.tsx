"use client";
import React from 'react';
import { Container, Box, Link as MuiLink, Grid2 } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Footer: React.FC = () => {
  const pathname = usePathname();

  // Only add extra mobile padding on the homepage
  const extraMobilePadding = pathname === "/" ? '150px' : '0px';

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        mt: 'auto',
        backgroundColor: "background.paper",
        "@media (max-width:600px)": {
          pb: `calc(3rem + ${extraMobilePadding})`,
        },
      }}
    >
      <Container>
        <Grid2 container spacing={2} justifyContent="center" mb={2}>
          <MuiLink href="mailto:tierlistlab2@proton.me" sx={{ textDecoration: 'none', color: 'inherit' }}>
            Contact
          </MuiLink>
          <MuiLink component={Link} href="/tos" sx={{ textDecoration: 'none', color: 'inherit' }}>
            Terms of Service
          </MuiLink>
          <MuiLink component={Link} href="/policy" sx={{ textDecoration: 'none', color: 'inherit' }}>
            Privacy Policy
          </MuiLink>
        </Grid2>
         <Grid2 container justifyContent="center"  mb={1}>
          <a
            href="https://ko-fi.com/K3K2CCUIJ"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://storage.ko-fi.com/cdn/kofi5.png?v=6"
              alt="Buy Me a Coffee at ko-fi.com"
              style={{ height: 36, border: 0 }}
            />
          </a>
        </Grid2>
        {/* <Grid2 container justifyContent="center">
          <Typography variant="body2" color="textSecondary" align="center">
            &copy; 2024 Designed & Developed by .... All rights reserved.
          </Typography>
        </Grid2> */}
      </Container>

    </Box>
  );
};

export default Footer;
