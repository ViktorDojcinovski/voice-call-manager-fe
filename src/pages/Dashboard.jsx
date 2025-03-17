import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

import Header from "../components/Header";

const Dashboard = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box sx={{ width: "100%", position: "sticky", top: 0, zIndex: 1000 }}>
        <Header />
      </Box>
      <Box sx={{ flex: 1, width: "100%" }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Dashboard;
