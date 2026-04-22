import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
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
    Logout as LogoutIcon,
    Menu as MenuIcon,
    Settings as SettingsIcon,
} from "@mui/icons-material";


import PlayersManagement from "../components/Admin/PlayersManagement";
import backgroundImage from "../photos/img2.jpg";

const drawerWidth = 280;

const AdminPanel = () => {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState("dashboard");


    const userData = useMemo(() => {
        const userDataRaw = localStorage.getItem("user");
        return userDataRaw ? JSON.parse(userDataRaw) : null;
    }, []);


    useEffect(() => {
        if (!userData || userData.role !== "admin") {
            navigate("/login");
        }
    }, [userData, navigate]);

    if (!userData) return null;

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    // Menu boczne
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
        { id: "profile", label: "Mój profil", icon: <AdminIcon />, category: "Konto" },
        { id: "settings", label: "Ustawienia", icon: <SettingsIcon />, category: "Konto" },
    ];

    const groupedMenu = menuItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof menuItems>);

    // Renderowanie dynamicznej zawartości
    const renderContent = () => {
        switch (selectedTab) {
            case "dashboard":
                return (
                    <Paper elevation={8} sx={{ p: 4, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", color: "#fff" }}>
                        <Typography variant="h4" fontWeight={700} gutterBottom>Panel administratora</Typography>
                        <Typography variant="body1" sx={{ mt: 2, color: "rgba(255,255,255,0.7)" }}>
                            Witaj, {userData.firstName} {userData.lastName}!
                        </Typography>
                    </Paper>
                );

            case "players":
                // Wywołanie wydzielonego komponentu
                return <PlayersManagement userData={userData} />;

            default:
                return (
                    <Paper elevation={8} sx={{ p: 4, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", color: "#fff" }}>
                        <Typography variant="h4" fontWeight={700} gutterBottom>
                            {menuItems.find(i => i.id === selectedTab)?.label}
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>Sekcja w budowie...</Typography>
                    </Paper>
                );
        }
    };

    const drawer = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#FF6A00", letterSpacing: 1 }}>
                    SPORT<span style={{ color: "#fff" }}>TURNIEJE</span>
                </Typography>
                <Chip label="PANEL ADMINA" size="small" sx={{ mt: 1, bgcolor: "#FF6A00", color: "#fff", fontWeight: "bold" }} />
            </Box>
            <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
            <List sx={{ flex: 1, px: 2, overflowY: "auto" }}>
                {Object.entries(groupedMenu).map(([category, items]) => (
                    <Box key={category}>
                        <Typography variant="caption" sx={{ px: 2, py: 1, display: "block", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontWeight: 600, letterSpacing: 1 }}>
                            {category.toUpperCase()}
                        </Typography>
                        {items.map((item) => (
                            <ListItemButton
                                key={item.id}
                                selected={selectedTab === item.id}
                                onClick={() => setSelectedTab(item.id)}
                                sx={{
                                    borderRadius: 2, mb: 0.5,
                                    "&.Mui-selected": { bgcolor: "rgba(255,106,0,0.2)", "& .MuiListItemIcon-root, & .MuiListItemText-primary": { color: "#FF6A00", fontWeight: 600 } },
                                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                                }}
                            >
                                <ListItemIcon sx={{ color: "#ccc", minWidth: 40 }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.label} sx={{ "& .MuiListItemText-primary": { fontSize: "0.95rem" } }} />
                            </ListItemButton>
                        ))}
                    </Box>
                ))}
            </List>
            <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
            <Box sx={{ p: 2 }}>
                <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, "&:hover": { bgcolor: "rgba(255,0,0,0.1)" } }}>
                    <ListItemIcon sx={{ color: "#ff6b6b", minWidth: 40 }}><LogoutIcon /></ListItemIcon>
                    <ListItemText primary="Wyloguj" sx={{ "& .MuiListItemText-primary": { color: "#ff6b6b" } }} />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }}>
            <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` }, bgcolor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.1)", boxShadow: "none" }}>
                <Toolbar>
                    <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: "none" } }}><MenuIcon /></IconButton>
                    <Box sx={{ flexGrow: 1 }} />
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography variant="body1" sx={{ color: "#fff" }}>{userData.firstName} {userData.lastName}</Typography>
                        <Avatar sx={{ bgcolor: "#FF6A00", width: 40, height: 40 }}>{userData.firstName?.[0]}</Avatar>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: "block", sm: "none" }, "& .MuiDrawer-paper": { width: drawerWidth, bgcolor: "rgba(0,0,0,0.9)", borderRight: "1px solid rgba(255,255,255,0.1)" } }}>
                    {drawer}
                </Drawer>
                <Drawer variant="permanent" sx={{ display: { xs: "none", sm: "block" }, "& .MuiDrawer-paper": { width: drawerWidth, bgcolor: "rgba(0,0,0,0.85)", borderRight: "1px solid rgba(255,255,255,0.1)" } }} open>
                    {drawer}
                </Drawer>
            </Box>

            <Box component="main" sx={{ flexGrow: 1, p: 3, mt: "64px" }}>
                <Container maxWidth="xl">
                    {renderContent()}
                </Container>
            </Box>
        </Box>
    );
};

export default AdminPanel;