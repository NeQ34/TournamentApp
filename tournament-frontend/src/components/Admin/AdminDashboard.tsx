import { useState, useEffect } from "react";
import {
    Box, Typography, Grid, Paper, Chip, Avatar, List, ListItem,
    ListItemText, CircularProgress, Divider, Button, ListItemButton, ListItemIcon
} from "@mui/material";
import {
    EmojiEvents, Groups, SportsSoccer, PendingActions,
    PlayArrow, TrendingUp, Speed, EventNote, Settings, Person
} from "@mui/icons-material";

interface DashboardProps {
    role: "admin" | "user";
    userData: any;
    onNavigate: (tab: string) => void;
}

const AdminDashboard = ({ role, userData, onNavigate }: DashboardProps) => {
    const [stats, setStats] = useState({ tournaments: 0, teams: 0, players: 0, pending: 0 });
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
                const tRes = await fetch("http://localhost:8080/api/admin/tournaments", { headers });
                const tournaments = await tRes.json();

                const teamRes = await fetch("http://localhost:8080/api/admin/teams", { headers });
                const pendingRes = await fetch("http://localhost:8080/api/admin/teams/pending", { headers });
                const playerRes = await fetch(`http://localhost:8080/api/players?adminEmail=${userData.email}`, { headers });

                setStats({
                    tournaments: tournaments.length,
                    teams: (await teamRes.json()).length,
                    players: (await playerRes.json()).length,
                    pending: (await pendingRes.json()).length
                });

                const today = new Date().toDateString();
                const matchesPromises = tournaments.map((t: any) =>
                    fetch(`http://localhost:8080/api/admin/tournaments/${t.id}/bracket`, { headers }).then(r => r.json())
                );
                const allBrackets = await Promise.all(matchesPromises);
                setMatches(allBrackets.flat().filter((m: any) => m.scheduledTime && new Date(m.scheduledTime).toDateString() === today).slice(0, 5));
            } catch(e) { console.error(e); } finally { setLoading(false); }
        };
        fetchData();
    }, [userData.email]);

    const CardStyle = {
        p: 3, borderRadius: 5,
        bgcolor: "rgba(13, 13, 13, 0.95)", // Bardzo ciemne dla kontrastu
        border: "1px solid rgba(255,106,0,0.3)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress sx={{ color: "#FF6A00" }}/></Box>;

    return (
        <Box sx={{ p: 1 }}>
            <Typography variant="h3" fontWeight={900} sx={{ mb: 4, letterSpacing: -2, textTransform: 'uppercase' }}>
                {role} <span style={{ color: "#FF6A00" }}>Dashboard</span>
            </Typography>

            <Grid container spacing={3} alignItems="stretch">
                {/* STATYSTYKI */}
                <Grid item xs={12}>
                    <Grid container spacing={2}>
                        {[
                            { lab: "Turnieje", val: stats.tournaments, icon: <EmojiEvents />, col: "#FF6A00", tab: "tournaments" },
                            { lab: "Drużyny", val: stats.teams, icon: <Groups />, col: "#fff", tab: "teams" },
                            { lab: "Do akceptacji", val: stats.pending, icon: <PendingActions />, col: "#ff4d4d", tab: "teams" },
                            { lab: "Twoi Zawodnicy", val: stats.players, icon: <SportsSoccer />, col: "#4caf50", tab: "players" }
                        ].map((s, i) => (
                            <Grid item xs={6} md={3} key={i}>
                                <Paper sx={{ ...CardStyle, p: 2, cursor: 'pointer', '&:hover': { transform: 'translateY(-5px)', transition: '0.3s' } }} onClick={() => onNavigate(s.tab)}>
                                    <Box sx={{ color: s.col, display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        {s.icon} <Typography variant="caption" sx={{ fontWeight: 800 }}>{s.lab}</Typography>
                                    </Box>
                                    <Typography variant="h4" fontWeight={900} sx={{ color: s.col }}>{s.val}</Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>

                {/* DZISIEJSZE MECZE */}
                <Grid item xs={12} md={7}>
                    <Paper sx={CardStyle}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" fontWeight={900} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PlayArrow sx={{ color: "#FF6A00" }} /> DZISIEJSZE MECZE
                            </Typography>
                            <Button size="small" onClick={() => onNavigate("schedule")} sx={{ color: "#FF6A00", fontWeight: 800 }}>ZOBACZ WSZYSTKO</Button>
                        </Box>
                        <List sx={{ flexGrow: 1 }}>
                            {matches.length === 0 ? (
                                <Typography sx={{ color: "#444", textAlign: 'center', mt: 4 }}>Brak meczów na dziś</Typography>
                            ) : matches.map((m, i) => (
                                <ListItem key={i} sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)", px: 1 }}>
                                    <ListItemText
                                        primary={`${m.teamA?.name} vs ${m.teamB?.name}`}
                                        secondary={new Date(m.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        primaryTypographyProps={{ fontWeight: 800, color: "#fff" }}
                                    />
                                    <Chip label={m.result || "LIVE"} size="small" sx={{ bgcolor: m.result ? "#4caf50" : "#FF6A00", color: "#000", fontWeight: 900 }} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* PROFIL I SKRÓTY */}
                <Grid item xs={12} md={5}>
                    <Grid container spacing={3} sx={{ height: '100%' }}>
                        <Grid item xs={12}>
                            <Paper sx={{ ...CardStyle, textAlign: 'center' }}>
                                <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: "#FF6A00", fontWeight: 900, border: "2px solid #FF6A00" }}>{userData.firstName?.[0]}</Avatar>
                                <Typography variant="h5" fontWeight={900}>{userData.firstName} {userData.lastName}</Typography>
                                <Typography variant="caption" sx={{ color: "#FF6A00", fontWeight: 800 }}>{userData.email}</Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                    <Button fullWidth variant="contained" size="small" onClick={() => onNavigate("profile")} sx={{ bgcolor: "#FF6A00", fontWeight: 800, borderRadius: 2 }}>PROFIL</Button>
                                    <Button fullWidth variant="outlined" size="small" onClick={() => onNavigate("settings")} sx={{ color: "#fff", borderColor: "#444", fontWeight: 800, borderRadius: 2 }}>USTAWIENIA</Button>
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid item xs={12}>
                            <Paper sx={{ ...CardStyle, bgcolor: "rgba(255,106,0,0.1)" }}>
                                <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>SZYBKIE SKRÓTY</Typography>
                                <Divider sx={{ mb: 2, bgcolor: "rgba(255,255,255,0.1)" }} />
                                <Grid container spacing={1}>
                                    {[
                                        { n: "Wyniki", t: "results", i: <EmojiEvents fontSize="small"/> },
                                        { n: "Dyscypliny", t: "disciplines", i: <SportsSoccer fontSize="small"/> },
                                        { n: "Drabinki", t: "brackets", i: <Speed fontSize="small"/> },
                                        { n: "Terminarze", t: "schedule", i: <EventNote fontSize="small"/> }
                                    ].map((s, i) => (
                                        <Grid item xs={6} key={i}>
                                            <Button
                                                fullWidth
                                                onClick={() => onNavigate(s.tab)}
                                                startIcon={s.i}
                                                sx={{ color: "#fff", justifyContent: 'flex-start', bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2, fontSize: '0.7rem', fontWeight: 700 }}
                                            >
                                                {s.n}
                                            </Button>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboard;