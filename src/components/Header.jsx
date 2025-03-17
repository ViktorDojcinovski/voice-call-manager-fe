import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
} from "@mui/material";

import { useAuth } from "../contexts/AuthContext";

const Header = () => {
  const { signout } = useAuth();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState();

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSettings = () => {
    navigate("/dashboard/settings");
    handleClose();
  };

  const handleSignOut = () => {
    try {
      handleClose();
      signout();
      navigate("/");
    } catch (error) {
      console.error("Signout failed: ", error);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6">Dashboard</Typography>
        <Avatar sx={{ cursor: "pointer" }} onClick={handleAvatarClick}></Avatar>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={handleSettings}>Settings</MenuItem>
          <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
