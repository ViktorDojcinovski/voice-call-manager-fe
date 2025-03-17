import { Box, Drawer } from "@mui/material";
import { Outlet } from "react-router-dom";

const drawerWidth = 240;

const DashboardWithDrawer = () => {
  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 64px)" }}>
      <Drawer
        variant="persistent"
        anchor="left"
        open
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            marginTop: "64px",
            height: "calc(100vh - 64px)",
          },
        }}
      ></Drawer>

      {/* Drawer-aware content */}
      <Box sx={{ flex: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardWithDrawer;
