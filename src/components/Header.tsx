"use client";
import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, Container, Button, Menu, MenuItem, CircularProgress, IconButton } from '@mui/material';
import Link from 'next/link';
import { firebaseAuth } from '@/lib/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import LoginButton from './LoginButton';
import { logOut } from '@/lib/auth/clientAuth';
import { getIdTokenResult } from 'firebase/auth';
import { purgeUsersByUid } from '@/lib/utils/apiUtils';
import { DarkMode, LightMode } from '@mui/icons-material';

const Header: React.FC<{ onToggleTheme?: () => void; darkMode?: boolean }> = ({ onToggleTheme, darkMode }) => {  const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(null);
  const [user, loading] = useAuthState(firebaseAuth);
  const [buttonWidth, setButtonWidth] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const tokenResult = await getIdTokenResult(user);
        setIsAdmin(!!tokenResult.claims.appAdmin);
      }
    };
    checkAdmin();
  }, [user]);
  

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    setButtonWidth(button.offsetWidth);
    setAnchorElement(button);
  };

  const handleCloseMenu = () => {
    setAnchorElement(null);
  };

  const handleLogout = () => {
    handleCloseMenu();
    logOut();
  };

  const handlePurgePrompt = async () => {
    handleCloseMenu();
    const uidInput = window.prompt("Enter one or more UIDs (comma-separated):");
    if (!uidInput) return;

    const uids = uidInput.split(',').map(uid => uid.trim()).filter(Boolean);
    try {
      await purgeUsersByUid(uids); 
      alert("Purge operation completed.");
    } catch (err) {
      console.error("Purge error:", err);
      alert("An error occurred while blocking content.");
    }
  }

  return (
    <>
      <style jsx global>{`
        body {
          padding-right: 0 !important;
          overflow-y: scroll !important;
        }
      `}</style>
      
      <AppBar 
        position="static" 
        color="primary"
        sx={{ 
          width: '100%',
          left: 0,
          right: 0
        }} 
        className="desktop-navbar"
      >
        <Container>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                TierlistLab2
              </Link>
            </Typography>

            {onToggleTheme && (
              <IconButton color="inherit" onClick={onToggleTheme} sx={{ mr: 2 }}>
                {darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            )}

            {loading ? (
              <CircularProgress color="inherit" size={24} />
            ) : (
              user ? (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleOpenMenu}
                    sx={(theme) => ({
                      ml: 2,
                      color: theme.palette.mode === "dark" 
                        ? theme.palette.text.primary 
                        : theme.palette.primary.light, 
                      borderColor: theme.palette.mode === "dark"
                        ? theme.palette.text.primary
                        : theme.palette.primary.light,
                    })}
                  >
                    {user.displayName ?? "User"}
                  </Button>
                  <Menu
                    anchorEl={anchorElement}
                    open={Boolean(anchorElement)}
                    onClose={handleCloseMenu}
                    MenuListProps={{ 'aria-labelledby': 'basic-button' }}
                    disableScrollLock
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{
                      sx: {
                        width: buttonWidth,
                        backgroundColor: (theme) => theme.palette.background.paper,
                        '& .MuiMenuItem-root': {
                          padding: '8px 16px',
                          color: (theme) => theme.palette.text.primary,
                        },
                      }
                    }}
                  >
                    <MenuItem onClick={handleCloseMenu}>
                      <Link href="/profile" style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                        Profile
                      </Link>
                    </MenuItem>
                    {isAdmin && (
                      <MenuItem onClick={handlePurgePrompt}>
                        Purge Users
                      </MenuItem>
                    )}
                    <MenuItem onClick={handleLogout} sx={{ color: (theme) => theme.palette.text.primary }}>
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <LoginButton />
              )
            )}
          </Toolbar>
        </Container>
      </AppBar>
    </>
  );
};

export default Header;