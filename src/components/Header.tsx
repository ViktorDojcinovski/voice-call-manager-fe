import { useState, MouseEvent } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Container,
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
  TextField,
  InputAdornment,
  Badge,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Settings,
  Menu as MenuIcon,
  List as ListIcon,
  Assignment,
  BarChart as BarChartIcon,
  School,
  Add,
  Phone,
  Search,
  PersonAdd,
  PlaylistAdd,
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

// Mock notifications data
const notifications = [
  { id: 1, text: "New message from John", time: "10 min ago" },
  { id: 2, text: "Your list was updated", time: "1 hour ago" },
  { id: 3, text: "Weekly report available", time: "2 days ago" },
];

const Header = () => {
  const { signout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [notificationsAnchorEl, setNotificationsAnchorEl] =
    useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const toggleDrawer = (open: boolean) => () => setDrawerOpen(open);
  const handleMenuOpen = (event: MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleAddMenuOpen = (event: MouseEvent<HTMLElement>) =>
    setAddMenuAnchorEl(event.currentTarget);
  const handleAddMenuClose = () => setAddMenuAnchorEl(null);

  const handleNotificationsOpen = (event: MouseEvent<HTMLElement>) =>
    setNotificationsAnchorEl(event.currentTarget);
  const handleNotificationsClose = () => setNotificationsAnchorEl(null);

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

  const handleDialerClick = () => {
    // Implement dialer functionality
    console.log("Opening dialer pad");
    // Or window.location.href = "tel:+1234567890";
  };

  const handleAddContact = () => {
    handleAddMenuClose();
    navigate("/contacts/add");
  };

  const handleAddList = () => {
    handleAddMenuClose();
    navigate("/lists/add");
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Implement search functionality
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={2}
        sx={{
          backgroundColor: colors.background,
          color: colors.headline,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Left side - Logo and mobile menu */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                edge="start"
                sx={{
                  color: colors.headline,
                  display: { xs: "block", md: "none" },
                }}
                onClick={toggleDrawer(true)}
              >
                <MenuIcon />
              </IconButton>
              <Box
                component="img"
                src={logo}
                alt="App Logo"
                sx={{
                  height: 80,
                  cursor: "pointer",
                  filter: "brightness(0) invert(1)",
                }}
                onClick={() => navigate("/dashboard")}
              />
            </Box>

            {/* Center area - Search and navigation (desktop only) */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                flexGrow: 1,
                justifyContent: "center",
                gap: 4,
                mx: 4,
              }}
            >
              {/* Search Field */}
              <Box sx={{ width: 300 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: colors.headline }} />
                      </InputAdornment>
                    ),
                    sx: {
                      color: colors.headline,
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: 2,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "transparent",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: colors.primary,
                      },
                    },
                  }}
                />
              </Box>

              {/* Navigation Links - Centered after search */}
              <Box sx={{ display: "flex", gap: 1 }}>
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
            </Box>

            {/* Right side - Action icons */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* Add Button with Dropdown */}
              <IconButton
                sx={{ color: colors.headline }}
                onClick={handleAddMenuOpen}
              >
                <Add />
              </IconButton>
              <Menu
                anchorEl={addMenuAnchorEl}
                open={Boolean(addMenuAnchorEl)}
                onClose={handleAddMenuClose}
                PaperProps={{
                  sx: {
                    backgroundColor: colors.background,
                    color: colors.headline,
                  },
                }}
              >
                <MenuItem onClick={handleAddContact}>
                  <ListItemIcon>
                    <PersonAdd sx={{ color: colors.primary }} />
                  </ListItemIcon>
                  <ListItemText>Add Contact</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleAddList}>
                  <ListItemIcon>
                    <PlaylistAdd sx={{ color: colors.primary }} />
                  </ListItemIcon>
                  <ListItemText>Add List</ListItemText>
                </MenuItem>
              </Menu>

              {/* Phone Button */}
              <IconButton
                sx={{ color: colors.headline }}
                onClick={handleDialerClick}
              >
                <Phone />
              </IconButton>

              {/* Notifications with Dropdown */}
              <IconButton
                sx={{ color: colors.headline }}
                onClick={handleNotificationsOpen}
              >
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <Menu
                anchorEl={notificationsAnchorEl}
                open={Boolean(notificationsAnchorEl)}
                onClose={handleNotificationsClose}
                PaperProps={{
                  sx: {
                    backgroundColor: colors.background,
                    color: colors.headline,
                    width: 320,
                    maxHeight: 400,
                  },
                }}
              >
                <Typography variant="h6" sx={{ p: 2 }}>
                  Notifications
                </Typography>
                <Divider />
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <MenuItem
                      key={notification.id}
                      onClick={handleNotificationsClose}
                    >
                      <ListItemText
                        primary={notification.text}
                        secondary={notification.time}
                        sx={{
                          "& .MuiListItemText-primary": {
                            fontSize: "0.875rem",
                          },
                          "& .MuiListItemText-secondary": {
                            fontSize: "0.75rem",
                          },
                        }}
                      />
                    </MenuItem>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ p: 2 }}>
                    No new notifications
                  </Typography>
                )}
              </Menu>

              <IconButton sx={{ color: colors.headline }}>
                <Settings onClick={onClickSettingsHandler} />
              </IconButton>
              <IconButton
                sx={{ color: colors.headline }}
                onClick={handleMenuOpen}
              >
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
                  },
                }}
              >
                <MenuItem onClick={onClickProfileHandler}>Profile</MenuItem>
                <MenuItem onClick={onClickSignOutHandler}>Sign Out</MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
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

          {/* Search Field - Mobile */}
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: colors.headline }} />
                  </InputAdornment>
                ),
                sx: {
                  color: colors.headline,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "transparent",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: colors.primary,
                  },
                },
              }}
            />
          </Box>

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
                  },
                }}
              >
                <ListItemIcon sx={{ color: colors.primary }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}

            {/* Add Actions - Mobile */}
            <ListItem
              button
              onClick={handleAddContact}
              sx={{
                color: colors.headline,
                "&:hover": {
                  backgroundColor: colors.button,
                  color: colors.buttonText,
                },
              }}
            >
              <ListItemIcon sx={{ color: colors.primary }}>
                <PersonAdd />
              </ListItemIcon>
              <ListItemText primary="Add Contact" />
            </ListItem>
            <ListItem
              button
              onClick={handleAddList}
              sx={{
                color: colors.headline,
                "&:hover": {
                  backgroundColor: colors.button,
                  color: colors.buttonText,
                },
              }}
            >
              <ListItemIcon sx={{ color: colors.primary }}>
                <PlaylistAdd />
              </ListItemIcon>
              <ListItemText primary="Add List" />
            </ListItem>

            {/* Phone Action - Mobile */}
            <ListItem
              button
              onClick={handleDialerClick}
              sx={{
                color: colors.headline,
                "&:hover": {
                  backgroundColor: colors.button,
                  color: colors.buttonText,
                },
              }}
            >
              <ListItemIcon sx={{ color: colors.primary }}>
                <Phone />
              </ListItemIcon>
              <ListItemText primary="Dialer" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
