// src/pages/UserPanel.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Container,
  Paper,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  EmojiEvents as TournamentIcon,
  Grid3x3 as BracketIcon,
  CalendarMonth as CalendarIcon,
  Groups as TeamsIcon,
  Archive as ArchiveIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import backgroundImage from "../photos/img2.jpg";

const drawerWidth = 280;

const UserPanel = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("dashboard");

  const userDataRaw = localStorage.getItem("user");
  const userData = userDataRaw ? JSON.parse(userDataRaw) : null;


  if (!userData) {
    navigate("/login");
    return null;
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { id: "tournaments", label: "Turnieje", icon: <TournamentIcon /> },
    { id: "brackets", label: "Drabinki i tabele", icon: <BracketIcon /> },
    { id: "calendar", label: "Kalendarz", icon: <CalendarIcon /> },
    { id: "teams", label: "Drużyny", icon: <TeamsIcon /> },
    { id: "archive", label: "Archiwum", icon: <ArchiveIcon /> },
    { id: "profile", label: "Mój profil", icon: <ProfileIcon /> },
  ];

  const renderContent = () => {
    switch (selectedTab) {
      case "dashboard":
        return (
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 4,
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              color: "#fff",
            }}
          >
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Witaj, {userData.firstName} {userData.lastName}!
            </Typography>
          </Paper>
        );
      case "tournaments":
        return (
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 4,
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              color: "#fff",
            }}
          >
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Turnieje
            </Typography>
          </Paper>
        );
      case "brackets":
        return (
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 4,
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              color: "#fff",
            }}
          >
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Drabinki i tabele
            </Typography>
          </Paper>
        );
      case "calendar":
        return (
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 4,
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              color: "#fff",
            }}
          >
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Kalendarz
            </Typography>
          </Paper>
        );
      case "teams":
        return (
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 4,
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              color: "#fff",
            }}
          >
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Drużyny
            </Typography>
          </Paper>
        );
      case "archive":
        return (
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 4,
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              color: "#fff",
            }}
          >
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Archiwum
            </Typography>
          </Paper>
        );
      case "profile":
        return (
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 4,
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              color: "#fff",
            }}
          >
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Mój profil
            </Typography>
          </Paper>
        );
      default:
        return null;
    }
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {}
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
            color: "#FF6A00",
            letterSpacing: 1,
          }}
        >
          Tournament<span style={{ color: "#fff" }}>App</span>
        </Typography>
        <Typography variant="caption" sx={{ color: "#aaa" }}>
          Panel użytkownika
        </Typography>
      </Box>

      <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />

      {}
      <List sx={{ flex: 1, px: 2 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.id}
            selected={selectedTab === item.id}
            onClick={() => setSelectedTab(item.id)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              "&.Mui-selected": {
                bgcolor: "rgba(255,106,0,0.2)",
                "&:hover": {
                  bgcolor: "rgba(255,106,0,0.3)",
                },
                "& .MuiListItemIcon-root": {
                  color: "#FF6A00",
                },
                "& .MuiListItemText-primary": {
                  color: "#FF6A00",
                  fontWeight: 600,
                },
              },
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            <ListItemIcon sx={{ color: "#ccc", minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} sx={{ "& .MuiListItemText-primary": { fontSize: "0.95rem" } }} />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />

      {}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            "&:hover": {
              bgcolor: "rgba(255,0,0,0.1)",
            },
          }}
        >
          <ListItemIcon sx={{ color: "#ff6b6b", minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Wyloguj" sx={{ "& .MuiListItemText-primary": { color: "#ff6b6b" } }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(10px)",
          boxShadow: "none",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          {}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body1" sx={{ color: "#fff" }}>
              {userData.firstName} {userData.lastName}
            </Typography>
            <Avatar
              sx={{
                bgcolor: "#FF6A00",
                width: 40,
                height: 40,
              }}
            >
              {userData.firstName?.[0]}{userData.lastName?.[0]}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              bgcolor: "rgba(0,0,0,0.9)",
              backdropFilter: "blur(10px)",
              borderRight: "1px solid rgba(255,255,255,0.1)",
            },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              bgcolor: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(10px)",
              borderRight: "1px solid rgba(255,255,255,0.1)",
              position: "fixed",
              height: "100vh",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          p: 3,
          mt: "64px",
        }}
      >
        <Container maxWidth="xl">
          {renderContent()}
        </Container>
      </Box>
    </Box>
  );
};

export default UserPanel;