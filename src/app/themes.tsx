import { createTheme } from "@mui/material";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#000000", light: "#ffffff" },
    secondary: { main: "#0e0e0e" },
    background: { default: "#eaeaea", paper: "#ffffffff" },
    text: { primary: "#000000", secondary: "#333333" },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#080808ff", light: "#000000" },
    secondary: { main: "#121212" },
    background: { default: "#121212", paper: "#4d4d4dff" },
    text: { primary: "#ffffff", secondary: "#b0bec5" },
  },
});