// src/theme.ts
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#f3a521",
    },
    secondary: {
      main: "#F25F4C",
    },
    background: {
      default: "#FEFEFE",
    },
    text: {
      primary: "#0F0E17",
    },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 12,
  },
});

export default theme;
