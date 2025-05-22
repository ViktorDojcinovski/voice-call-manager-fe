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
  useTheme,
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

import logo from "../assets/logo_text.svg";

const menuItems = [
  { text: "Lists", path: "/dashboard/lists", icon: <ListIcon /> },
  { text: "Tasks", path: "/tasks", icon: <Assignment /> },
  { text: "Reports", path: "/reports", icon: <BarChartIcon /> },
  { text: "Coaching", path: "/coaching", icon: <School /> },
];

const Header = () => {
  const { signout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

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
      <AppBar position="sticky" elevation={2}>
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
            <Box
              component="img"
              src={logo}
              alt="App Logo"
              sx={{ height: 80, cursor: "pointer" }}
              onClick={() => navigate("/dashboard")}
            />
          </Box>

          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 2,
              flexGrow: 1,
              justifyContent: "center",
            }}
          >
            {menuItems.map((item) => (
              <Typography
                key={item.text}
                component={NavLink}
                to={item.path}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  color: theme.palette.text.primary,
                  textDecoration: "none",
                  display: "inline-block",
                  transition: "background-color 0.2s ease-in-out",
                  "&.active": {
                    fontWeight: "bold",
                    color: theme.palette.primary.contrastText,
                    backgroundColor: theme.palette.action.hover,
                  },
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.primary.contrastText,
                    textDecoration: "none",
                  },
                  "&:visited": {
                    color: theme.palette.text.primary,
                  },
                }}
              >
                {item.text}
              </Typography>
            ))}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
        <Box
          sx={{
            width: 260,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              p: 2,
              backgroundColor: theme.palette.primary.main,
              color: "white",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="App Logo"
              sx={{ height: 40 }}
            />
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
