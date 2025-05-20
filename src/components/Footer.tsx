// MainLayout.tsx (or wherever you layout your app)
import { Box, Typography, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  const theme = useTheme();

  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      bgcolor={theme.palette.background.default}
    >
      {/* Header/Navbar */}
      <Box component="main" flexGrow={1}>
        <Outlet />
      </Box>

      {/* Subtle Footer */}
      <Box
        component="footer"
        textAlign="center"
        py={1}
        bgcolor={theme.palette.background.paper}
        borderTop={`1px solid ${theme.palette.divider}`}
        color="text.secondary"
        fontSize="caption.fontSize"
      >
        <Typography variant="caption">
          © {new Date().getFullYear()} Echo — All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default MainLayout;
