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

export const colors = {
  background: "#16161a", 
  headline: "#ffffff",  
  button: "#7f5af0",     
  buttonText: "#ffffff",
  primary: "#7f5af0", 
};


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
        elevation={2}
        sx={{ 
          backgroundColor: colors.background,
          color: colors.headline
        }}
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
              sx={{ 
                color: colors.headline,
                display: { xs: "block", md: "none" } 
              }}
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
            <Box
              component="img"
              src={logo}
              alt="App Logo"
              sx={{ height: 80 , filter: "brightness(0) invert(1)"}}
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
                  color: colors.headline,
                  textDecoration: "none",
                  display: "inline-block",
                  transition: "background-color 0.2s ease-in-out",
                  "&.active": {
                    fontWeight: "bold",
                    color: colors.buttonText,
                    backgroundColor: colors.button,
                  },
                  "&:hover": {
                    backgroundColor: colors.button,
                    color: colors.buttonText,
                    textDecoration: "none",
                  },
                  "&:visited": {
                    color: colors.headline,
                  },
                }}
              >
                {item.text}
              </Typography>
            ))}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton sx={{ color: colors.headline }}>
              <Notifications />
            </IconButton>
            <IconButton sx={{ color: colors.headline }}>
              <Settings onClick={onClickSettingsHandler} />
            </IconButton>
            <IconButton sx={{ color: colors.headline }} onClick={handleMenuOpen}>
              <Avatar />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  backgroundColor: colors.background,
                  color: colors.headline,
                }
              }}
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
            backgroundColor: colors.background,
            color: colors.headline,
          }}
        >
          <Box
            sx={{
              p: 2,
              backgroundColor: colors.primary,
              color: colors.buttonText,
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
                sx={{
                  color: colors.headline,
                  "&:hover": {
                    backgroundColor: colors.button,
                    color: colors.buttonText,
                  },
                  "&.active": {
                    backgroundColor: colors.button,
                    color: colors.buttonText,
                  }
                }}
              >
                <ListItemIcon sx={{ color: colors.primary }}>
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