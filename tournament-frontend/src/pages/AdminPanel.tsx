// src/pages/AdminPanel.tsx
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
    Chip,
} from "@mui/material";
import {
    Dashboard as DashboardIcon,
    EmojiEvents as TournamentIcon,
    Groups as TeamsIcon,
    SportsSoccer as PlayerIcon,
    Grid3x3 as BracketIcon,
    Schedule as ScheduleIcon,
    Scoreboard as ResultsIcon,
    Archive as ArchiveIcon,
    Assessment as ReportsIcon,
    AdminPanelSettings as AdminIcon,
    Person as ProfileIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
    Settings as SettingsIcon,
} from "@mui/icons-material";
import backgroundImage from "../photos/img2.jpg";

const drawerWidth = 280;

const AdminPanel = () => {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState("dashboard");

    // Pobierz dane użytkownika z localStorage
    const userDataRaw = localStorage.getItem("user");
    const userData = userDataRaw ? JSON.parse(userDataRaw) : null;

    // Jeśli brak danych lub nie jest adminem, przekieruj do logowania
    if (!userData || userData.role !== "admin") {
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

    // Menu boczne - lista zakładek dla admina
    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: <DashboardIcon />, category: "Główne" },
        { id: "tournaments", label: "Turnieje", icon: <TournamentIcon />, category: "Zarządzanie" },
        { id: "teams", label: "Drużyny", icon: <TeamsIcon />, category: "Zarządzanie" },
        { id: "players", label: "Zawodnicy", icon: <PlayerIcon />, category: "Zarządzanie" },
        { id: "brackets", label: "Drabinki", icon: <BracketIcon />, category: "Organizacja" },
        { id: "schedule", label: "Terminarze", icon: <ScheduleIcon />, category: "Organizacja" },
        { id: "results", label: "Wyniki", icon: <ResultsIcon />, category: "Organizacja" },
        { id: "archive", label: "Archiwum", icon: <ArchiveIcon />, category: "Zakończone" },
        { id: "reports", label: "Raporty", icon: <ReportsIcon />, category: "Statystyki" },
        { id: "profile", label: "Mój profil", icon: <ProfileIcon />, category: "Konto" },
        { id: "settings", label: "Ustawienia", icon: <SettingsIcon />, category: "Konto" },
    ];

    // Grupowanie menu według kategorii
    const groupedMenu = menuItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof menuItems>);

    // Treść w zależności od wybranej zakładki (póki co placeholder)
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
                            Panel administratora
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 2, color: "rgba(255,255,255,0.7)" }}>
                            Witaj, {userData.firstName} {userData.lastName}!
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, color: "rgba(255,255,255,0.5)" }}>
                            Tutaj będą wyświetlane statystyki systemu, podsumowania i najważniejsze informacje.
                        </Typography>
                        <Box component="ul" sx={{ mt: 2, color: "rgba(255,255,255,0.7)", pl: 2 }}>
                            <li>Liczba użytkowników w systemie</li>
                            <li>Liczba aktywnych turniejów</li>
                            <li>Liczba drużyn i zawodników</li>
                            <li>Ostatnie zgłoszenia do turniejów</li>
                            <li>Wykresy i statystyki</li>
                        </Box>
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
                            Zarządzanie turniejami
                        </Typography>
                        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            Tutaj będzie lista wszystkich turniejów, możliwość tworzenia, edycji i usuwania turniejów.
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
                            Zarządzanie drużynami
                        </Typography>
                        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            Tutaj będzie lista wszystkich drużyn, możliwość edycji, usuwania i zarządzania członkami.
                        </Typography>
                    </Paper>
                );
            case "players":
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
                            Zarządzanie zawodnikami
                        </Typography>
                        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            Tutaj będzie centralna baza zawodników, możliwość dodawania, edycji i przypisywania do drużyn.
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
                            Generowanie drabinek
                        </Typography>
                        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            Tutaj będzie możliwość generowania drabinek turniejowych (pucharowych, ligowych, mieszanych).
                        </Typography>
                    </Paper>
                );
            case "schedule":
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
                            Generowanie terminarzy
                        </Typography>
                        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            Tutaj będzie możliwość automatycznego generowania terminarzy meczów oraz ręcznej edycji.
                        </Typography>
                    </Paper>
                );
            case "results":
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
                            Wprowadzanie wyników
                        </Typography>
                        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            Tutaj będzie możliwość wprowadzania i zatwierdzania wyników meczów.
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
                            Archiwum turniejów
                        </Typography>
                        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            Tutaj będą zakończone turnieje, możliwość przeglądania wyników i eksportu danych.
                        </Typography>
                    </Paper>
                );
            case "reports":
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
                            Raporty i statystyki
                        </Typography>
                        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            Tutaj będą generowane raporty (PDF, CSV) i statystyki systemu.
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
                        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            Tutaj będzie można edytować swoje dane osobowe oraz zmienić hasło.
                        </Typography>
                    </Paper>
                );
            case "settings":
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
                            Ustawienia systemu
                        </Typography>
                        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            Tutaj będzie konfiguracja systemu, zarządzanie kategoriami sportów i ustawieniami globalnymi.
                        </Typography>
                    </Paper>
                );
            default:
                return null;
        }
    };

    // Sidebar (Drawer)
    const drawer = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Logo w sidebarze */}
            <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: "bold",
                        color: "#FF6A00",
                        letterSpacing: 1,
                    }}
                >
                    SPORT<span style={{ color: "#fff" }}>TURNIEJE</span>
                </Typography>
                <Chip
                    label="PANEL ADMINA"
                    size="small"
                    sx={{
                        mt: 1,
                        bgcolor: "#FF6A00",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "0.7rem",
                    }}
                />
            </Box>

            <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />

            {/* Lista zakładek z grupowaniem */}
            <List sx={{ flex: 1, px: 2 }}>
                {Object.entries(groupedMenu).map(([category, items]) => (
                    <Box key={category}>
                        <Typography
                            variant="caption"
                            sx={{
                                px: 2,
                                py: 1,
                                display: "block",
                                color: "rgba(255,255,255,0.4)",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                letterSpacing: 1,
                            }}
                        >
                            {category.toUpperCase()}
                        </Typography>
                        {items.map((item) => (
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
                    </Box>
                ))}
            </List>

            <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />

            {/* Przycisk wylogowania w sidebarze (na dole) */}
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
            {/* AppBar (górny pasek) */}
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

                    {/* Nazwa użytkownika i awatar */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Chip
                            icon={<AdminIcon sx={{ fontSize: 16 }} />}
                            label="ADMIN"
                            size="small"
                            sx={{
                                bgcolor: "#FF6A00",
                                color: "#fff",
                                fontWeight: "bold",
                                "& .MuiChip-icon": { color: "#fff" },
                            }}
                        />
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

            {/* Sidebar - wersja desktopowa */}
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

            {/* Główna treść */}
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

export default AdminPanel;