import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Grid, Paper, FormControl, InputLabel, Select, MenuItem, CircularProgress, Divider } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#FF6A00", "#7A00FF", "#00F2FF", "#FF007A", "#ADFF00"];

const ReportsView = () => {
    const [globalData, setGlobalData] = useState<any>(null);
    const [disciplines, setDisciplines] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [selectedDiscipline, setSelectedDiscipline] = useState("");
    const [teamStats, setTeamStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
            const res = await fetch("http://localhost:8080/api/admin/reports/global-summary", { headers });
            const data = await res.json();
            setGlobalData(data);
            const discRes = await fetch("http://localhost:8080/api/disciplines");
            setDisciplines(await discRes.json());
        } catch (error) {
            console.error("Błąd pobierania danych:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleDisciplineChange = async (discipline: string) => {
        setSelectedDiscipline(discipline);
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
        try {
            const res = await fetch(`http://localhost:8080/api/admin/teams/available?discipline=${encodeURIComponent(discipline)}`, { headers });
            const data = await res.json();
            setTeams(data);
            setTeamStats(null);
        } catch (error) {
            console.error("Błąd pobierania drużyn:", error);
        }
    };

    const handleTeamChange = async (teamId: number) => {
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
        try {
            const res = await fetch(`http://localhost:8080/api/admin/reports/team-stats/${teamId}`, { headers });
            const data = await res.json();
            setTeamStats(data);
        } catch (error) {
            console.error("Błąd pobierania statystyk drużyny:", error);
        }
    };

    const statsCards = [
        { label: "Wszystkie Turnieje", value: globalData?.totalTournaments || 0, color: "#FF6A00" },
        { label: "Aktywne Drużyny", value: globalData?.totalTeams || 0, color: "#fff" },
        { label: "Zarejestrowani Gracze", value: globalData?.totalPlayers || 0, color: "#4caf50" }
    ];

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress sx={{ color: "#FF6A00" }} /></Box>;

    return (
        <Box sx={{ color: "#fff", pb: 5 }}>
            <Typography variant="h3" fontWeight={900} sx={{ mb: 4, letterSpacing: -2 }}> RAPORTY <span style={{ color: "#FF6A00" }}>SYSTEMOWE</span></Typography>

            {/* KAFELKI STATYSTYK GÓRNYCH */}
            <Grid container spacing={3} sx={{ mb: 5 }} alignItems="stretch">
                {statsCards.map((card, i) => (
                    <Grid key={i} item xs={12} md={4} sx={{ display: 'flex' }}>
                        <Paper sx={{
                            p: 4,
                            borderRadius: 5,
                            bgcolor: "rgba(13,13,13,0.9)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            textAlign: 'center',
                            flex: 1,       // To zrównuje szerokość i wysokość wszystkich trzech
                            minWidth: 0,   // Zapobiega wypychaniu przez długi tekst
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <Typography variant="caption" sx={{ color: "#666", fontWeight: 800, letterSpacing: 2, display: 'block', mb: 1 }}>
                                {card.label.toUpperCase()}
                            </Typography>
                            <Typography variant="h2" fontWeight={900} sx={{ color: card.color }}>
                                {card.value}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
            <Grid container spacing={4} alignItems="stretch">
                {/* ROZKŁAD DYSCYPLIN - FULL WIDTH */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ height: "100%", display: "flex", flexDirection: "column", p: 5, bgcolor: "rgba(13,13,13,0.9)", borderRadius: 7, border: "1px solid rgba(255,106,0,0.15)" , minHeight: 500 }}>
                        <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>ROZKŁAD DYSCYPLIN W SYSTEMIE</Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={globalData?.disciplineDistribution}
                                    dataKey="value" nameKey="name" cx="50%" cy="50%"
                                    innerRadius={80} outerRadius={110} paddingAngle={10} cornerRadius={15} stroke="none"
                                    label={({name, percent}) => `${name.toUpperCase()} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {globalData?.disciplineDistribution?.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#111', borderRadius: '15px', border: 'none', color: '#fff' }} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* ANALIZA DRUŻYNY - FULL WIDTH */}
                <Grid item xs={12} lg={8.5}>
                    <Paper sx={{ height: "100%", display: "flex", flexDirection: "column", p: 5, bgcolor: "rgba(13,13,13,0.9)",
                        borderRadius: 7, border: "1px solid rgba(255,106,0,0.15)" }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                            <Typography variant="h5" fontWeight={900}>SZCZEGÓŁOWA ANALIZA WYDAJNOŚCI</Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, flexWrap: 'wrap' }}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: "#aaa" }}>Sport</InputLabel>
                                    <Select value={selectedDiscipline} onChange={(e) => handleDisciplineChange(e.target.value)} sx={{ color: "#fff", borderRadius: 3, bgcolor: "rgba(255,255,255,0.03)" }}>
                                        {disciplines.map(d => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth disabled={!selectedDiscipline}>
                                    <InputLabel sx={{ color: "#aaa" }}>Drużyna</InputLabel>
                                    <Select onChange={(e) => handleTeamChange(Number(e.target.value))} sx={{ color: "#fff", borderRadius: 3, bgcolor: "rgba(255,255,255,0.03)" }}>
                                        {teams.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                        {teamStats ? (
                            <Box sx={{
                                display: 'flex', alignItems: 'center', gap: 8, p: 5,
                                bgcolor: "rgba(255,106,0,0.03)", borderRadius: 6, border: '1px solid rgba(255,106,0,0.1)'
                            }}>
                                <Box sx={{ textAlign: 'center', flex: 1 }}>
                                    <Typography variant="caption" sx={{ color: "#FF6A00", fontWeight: 800, letterSpacing: 3 }}>WIN RATIO</Typography>
                                    <Typography variant="h1" fontWeight={900} sx={{ color: "#FF6A00", lineHeight: 1 }}>{Math.round(teamStats.winRatio)}%</Typography>
                                </Box>

                                <Divider orientation="vertical" flexItem sx={{ bgcolor: "rgba(255,255,255,0.1)", width: 2 }} />

                                <Grid container spacing={4} alignItems="stretch">
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: "#666", fontWeight: 800 }}>MECZE ROZEGRANE</Typography>
                                        <Typography variant="h2" fontWeight={900}>{teamStats.totalMatches}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: "#666", fontWeight: 800 }}>ZWYCIĘSTWA</Typography>
                                        <Typography variant="h2" fontWeight={900} sx={{ color: "#4caf50" }}>{teamStats.wins}</Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 10, bgcolor: "rgba(255,255,255,0.01)", borderRadius: 6, border: '2px dashed rgba(255,255,255,0.05)' }}>
                                <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.2)" }}>Wybierz parametry, aby wygenerować analizę</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ReportsView;