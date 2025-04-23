import { useState, MouseEvent } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  Notifications,
  Settings,
  Menu as MenuIcon,
  List as ListIcon,
  Assignment,
  BarChart as BarChartIcon,
  School,
} from "@mui/icons-material";

import { useAuth } from "../contexts/AuthContext";

const menuItems = [
  { text: "Lists", path: "/dashboard/lists", icon: <ListIcon /> },
  { text: "Tasks", path: "/tasks", icon: <Assignment /> },
  { text: "Reports", path: "/reports", icon: <BarChartIcon /> },
  { text: "Coaching", path: "/coaching", icon: <School /> },
];

const Header = () => {
  const { signout } = useAuth();
  const navigate = useNavigate();

  // Explicit type for anchorEl
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const toggleDrawer = (open: boolean) => () => setDrawerOpen(open);
  const handleMenuOpen = (event: MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const onClickSettingsHandler = () => {
    navigate("/dashboard/settings");
  };

  const onClickProfileHandler = () => {};

  const onClickSignOutHandler = () => {
    try {
      handleMenuClose();
      signout();
      navigate("/");
    } catch (error) {
      console.error("Signout failed: ", error);
    }
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.12)" }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={toggleDrawer(true)}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6">Echo</Typography>
          </Box>

          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3 }}>
            {menuItems.map((item) => (
              <Typography
                key={item.text}
                component={NavLink}
                to={item.path}
                sx={{
                  color: "white",
                  textDecoration: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  "&.active": {
                    fontWeight: "bold",
                    color: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                  "&:hover": {
                    textDecoration: "none",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                  },
                }}
              >
                {item.text}
              </Typography>
            ))}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton color="inherit">
              <Notifications />
            </IconButton>
            <IconButton color="inherit">
              <Settings onClick={onClickSettingsHandler} />
            </IconButton>
            <IconButton color="inherit" onClick={handleMenuOpen}>
              <Avatar />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={onClickProfileHandler}>Profile</MenuItem>
              <MenuItem onClick={onClickSignOutHandler}>Sign Out</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 260, bgcolor: "#f5f5f5", height: "100%" }}>
          <Box
            sx={{
              padding: 2,
              bgcolor: "#1976d2",
              color: "white",
              textAlign: "center",
            }}
          >
            <Typography variant="h6">Echo</Typography>
          </Box>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                component={NavLink}
                to={item.path}
                onClick={toggleDrawer(false)}
              >
                <ListItemIcon sx={{ color: "#1976d2" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
