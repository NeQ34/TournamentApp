import { useState, useEffect } from "react";
import {
    Box, Typography, Grid, Paper, Chip, Avatar, List, ListItem,
    ListItemText, CircularProgress, Divider, Button
} from "@mui/material";
import {
    EmojiEvents, Groups, SportsSoccer, PendingActions,
    PlayArrow, Speed, EventNote
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
                setMatches(allBrackets.flat().filter((m: any) => m.scheduledTime && new Date(m.scheduledTime).toDateString() === today).slice(0, 6));
            } catch(e) { console.error(e); } finally { setLoading(false); }
        };
        fetchData();
    }, [userData.email]);

    const CardStyle = {
        p: 2.5, borderRadius: 5,
        bgcolor: "rgba(13, 13, 13, 0.95)",
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

            {/* PIERWSZY WIERSZ - WSZYSTKIE KAFELKI OBOK SIEBIE */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Turnieje */}
                <Grid item xs={6} sm={4} md={2}>
                    <Paper sx={{ ...CardStyle, cursor: 'pointer', textAlign: 'center', '&:hover': { transform: 'translateY(-5px)', transition: '0.3s' } }} onClick={() => onNavigate("tournaments")}>
                        <EmojiEvents sx={{ color: "#FF6A00", fontSize: 40, mb: 1 }} />
                        <Typography variant="h4" fontWeight={900} sx={{ color: "#FF6A00" }}>{stats.tournaments}</Typography>
                        <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>Turnieje</Typography>
                    </Paper>
                </Grid>

                {/* Drużyny */}
                <Grid item xs={6} sm={4} md={2}>
                    <Paper sx={{ ...CardStyle, cursor: 'pointer', textAlign: 'center', '&:hover': { transform: 'translateY(-5px)', transition: '0.3s' } }} onClick={() => onNavigate("teams")}>
                        <Groups sx={{ color: "#fff", fontSize: 40, mb: 1 }} />
                        <Typography variant="h4" fontWeight={900} sx={{ color: "#fff" }}>{stats.teams}</Typography>
                        <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>Drużyny</Typography>
                    </Paper>
                </Grid>

                {/* Do akceptacji */}
                <Grid item xs={6} sm={4} md={2}>
                    <Paper sx={{ ...CardStyle, cursor: 'pointer', textAlign: 'center', '&:hover': { transform: 'translateY(-5px)', transition: '0.3s' } }} onClick={() => onNavigate("teams")}>
                        <PendingActions sx={{ color: "#ff4d4d", fontSize: 40, mb: 1 }} />
                        <Typography variant="h4" fontWeight={900} sx={{ color: "#ff4d4d" }}>{stats.pending}</Typography>
                        <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>Do akceptacji</Typography>
                    </Paper>
                </Grid>

                {/* Twoi Zawodnicy */}
                <Grid item xs={6} sm={4} md={2}>
                    <Paper sx={{ ...CardStyle, cursor: 'pointer', textAlign: 'center', '&:hover': { transform: 'translateY(-5px)', transition: '0.3s' } }} onClick={() => onNavigate("players")}>
                        <SportsSoccer sx={{ color: "#4caf50", fontSize: 40, mb: 1 }} />
                        <Typography variant="h4" fontWeight={900} sx={{ color: "#4caf50" }}>{stats.players}</Typography>
                        <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>Zawodnicy</Typography>
                    </Paper>
                </Grid>

                {/* Dzisiejsze mecze - rozwinięty */}
                <Grid item xs={12} md={4}>
                    <Paper sx={CardStyle}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight={900} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem' }}>
                                <PlayArrow sx={{ color: "#FF6A00" }} /> DZISIEJSZE MECZE
                            </Typography>
                            <Button size="small" onClick={() => onNavigate("schedule")} sx={{ color: "#FF6A00", fontWeight: 800 }}>ZOBACZ WSZYSTKO</Button>
                        </Box>
                        <List sx={{ flexGrow: 1 }}>
                            {matches.length === 0 ? (
                                <Typography sx={{ color: "#444", textAlign: 'center', mt: 4 }}>Brak meczów na dziś</Typography>
                            ) : (
                                matches.map((m, i) => (
                                    <ListItem key={i} sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)", px: 1, py: 1 }}>
                                        <ListItemText
                                            primary={`${m.teamA?.name || "BYE"} vs ${m.teamB?.name || "BYE"}`}
                                            secondary={m.scheduledTime ? new Date(m.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Godzina nieustalona"}
                                            primaryTypographyProps={{ fontWeight: 800, color: "#fff", fontSize: '0.85rem' }}
                                            secondaryTypographyProps={{ color: "#FF6A00", fontSize: '0.7rem' }}
                                        />
                                        <Chip 
                                            label={m.result || "LIVE"} 
                                            size="small" 
                                            sx={{ 
                                                bgcolor: m.result ? "#4caf50" : "#FF6A00", 
                                                color: "#000", 
                                                fontWeight: 900,
                                                fontSize: '0.7rem'
                                            }} 
                                        />
                                    </ListItem>
                                ))
                            )}
                        </List>
                    </Paper>
                </Grid>

                {/* Profil */}
                <Grid item xs={12} sm={6} md={2}>
                    <Paper sx={{ ...CardStyle, textAlign: 'center', cursor: 'pointer' }} onClick={() => onNavigate("profile")}>
                        <Avatar sx={{ width: 50, height: 50, mx: 'auto', mb: 1, bgcolor: "#FF6A00", fontSize: 22, fontWeight: 900 }}>
                            {userData.firstName?.[0]}{userData.lastName?.[0]}
                        </Avatar>
                        <Typography variant="body2" fontWeight={900}>{userData.firstName} {userData.lastName}</Typography>
                        <Typography variant="caption" sx={{ color: "#FF6A00", fontWeight: 800 }}>{userData.email?.split('@')[0]}</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                            <Button fullWidth variant="contained" size="small" onClick={(e) => { e.stopPropagation(); onNavigate("profile"); }} sx={{ bgcolor: "#FF6A00", fontWeight: 800, borderRadius: 2 }}>PROFIL</Button>
                            <Button fullWidth variant="outlined" size="small" onClick={(e) => { e.stopPropagation(); onNavigate("settings"); }} sx={{ color: "#fff", borderColor: "#444", fontWeight: 800, borderRadius: 2 }}>USTAWIENIA</Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* DRUGI WIERSZ - SZYBKIE SKRÓTY */}
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Paper sx={{ ...CardStyle, p: 2, bgcolor: "rgba(255,106,0,0.1)" }}>
                        <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Speed sx={{ color: "#FF6A00" }} /> SZYBKIE SKRÓTY
                        </Typography>
                        <Divider sx={{ mb: 2, bgcolor: "rgba(255,255,255,0.1)" }} />
                        <Grid container spacing={1}>
                            {[
                                { n: "Wyniki", t: "results", i: <EmojiEvents fontSize="small"/> },
                                { n: "Dyscypliny", t: "disciplines", i: <SportsSoccer fontSize="small"/> },
                                { n: "Drabinki", t: "brackets", i: <Speed fontSize="small"/> },
                                { n: "Terminarze", t: "schedule", i: <EventNote fontSize="small"/> }
                            ].map((s, i) => (
                                <Grid item xs={6} sm={3} md={2} key={i}>
                                    <Button
                                        fullWidth
                                        onClick={() => onNavigate(s.tab)}
                                        startIcon={s.i}
                                        sx={{ color: "#fff", justifyContent: 'flex-start', bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2, fontSize: '0.7rem', fontWeight: 700, py: 1 }}
                                    >
                                        {s.n}
                                    </Button>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboard;