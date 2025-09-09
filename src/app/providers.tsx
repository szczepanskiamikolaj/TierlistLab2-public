"use client";

import { ThemeProvider, CssBaseline, Box, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { darkTheme, lightTheme } from "./themes";
import { DialogProvider } from "@/components/DialogContext";
import { SnackbarProvider } from "notistack";
import { AuthProvider } from "@/lib/auth/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Script from "next/script";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    setDarkMode(stored === "true");
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("darkMode", String(next));
      return next;
    });
  };

  if (darkMode === null) {
    return (
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <AuthProvider>
        <DialogProvider>
          <SnackbarProvider>
            <Script
              id="adsense-init"
              strategy="afterInteractive"
              async
              src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9614316154472722"
              crossOrigin="anonymous"
            />
            <Script
              id="cookieyes-banner"
              strategy="afterInteractive"
              src="https://cdn-cookieyes.com/client_data/7ace384660a93017d0818992/script.js"
            />
            <Box
              sx={(theme) => ({
                backgroundColor: theme.palette.background.default,
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
              })}
            >
              <Header onToggleTheme={toggleDarkMode} darkMode={darkMode} />
              <main>{children}</main>
              <Footer />
            </Box>
          </SnackbarProvider>
        </DialogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
