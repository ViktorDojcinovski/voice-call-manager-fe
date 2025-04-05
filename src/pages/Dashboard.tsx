import { useEffect } from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

import api from "../utils/axiosInstance";
import Header from "../components/Header";
import useAppStore from "../store/useAppStore";

const Dashboard: React.FC = () => {
  const user = useAppStore((state) => state.user);
  const setSettings = useAppStore((state) => state.setSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;

      try {
        const { data } = await api.get(`/settings/${user.id}`);
        setSettings(data);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };

    fetchSettings();
  }, [user, setSettings]);

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
