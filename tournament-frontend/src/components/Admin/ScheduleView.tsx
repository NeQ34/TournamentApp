import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Box, Typography, Paper, Grid, IconButton, Button,
    Chip, CircularProgress, FormControl, InputLabel, Select, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogActions, Menu, 
} from "@mui/material";
import {
    ChevronLeft, ChevronRight, AccessTime,
    InfoOutlined,
    EmojiEvents
} from "@mui/icons-material";

interface Tournament {
    id: number;
    name: string;
    discipline: string;
    startDate: string;
}

interface Match {
    id: number;
    tournamentId: number;
    tournamentName?: string;
    teamA: { id: number; name: string } | null;
    teamB: { id: number; name: string } | null;
    result: string | null;
    scheduledTime: string | null;
    courtNumber: number | null;
    winnerId: number | null;
    notes?: string;
}

const ScheduleView = () => {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState<number | "all">("all");
    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [detailsOpen, setOpenDetails] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const [anchorElMonth, setAnchorElMonth] = useState<null | HTMLElement>(null);
    const [anchorElYear, setAnchorElYear] = useState<null | HTMLElement>(null);
    const months = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
    const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

    const getMatchesForDate = useCallback((date: Date) => {
        return allMatches.filter(m => {
            if (!m.scheduledTime) return false;
            const mDate = new Date(m.scheduledTime);
            return mDate.toDateString() === date.toDateString() &&
                (selectedTournamentId === "all" || m.tournamentId === selectedTournamentId);
        });
    }, [allMatches, selectedTournamentId]);

    const [sortBy, setSortBy] = useState<"time" | "tournament">("time");

    const sortedMatches = useMemo(() => {
        if (!selectedDate) return [];
        return getMatchesForDate(selectedDate).sort((a, b) => {
            if (sortBy === "tournament") {
                const nameA = a.tournamentName || "";
                const nameB = b.tournamentName || "";
                if (nameA !== nameB) return nameA.localeCompare(nameB);
            }
            return new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime();
        });
    }, [selectedDate, allMatches, sortBy, selectedTournamentId]);

    const dayNames = ['Ndz', 'Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const tRes = await fetch("http://localhost:8080/api/admin/tournaments", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            const tournamentsData: Tournament[] = await tRes.json();
            setTournaments(tournamentsData);

            const matchesPromises = tournamentsData.map(async (t) => {
                const mRes = await fetch(`http://localhost:8080/api/admin/tournaments/${t.id}/bracket`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                const mData = await mRes.json();
                return mData.map((m: any) => ({
                    ...m,
                    tournamentName: t.name,
                    tournamentId: t.id
                }));
            });

            const results = await Promise.all(matchesPromises);
            setAllMatches(results.flat());
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    useEffect(() => {
        if (selectedTournamentId !== "all") {
            const tourney = tournaments.find(t => t.id === selectedTournamentId);
            if (tourney && tourney.startDate) setCurrentMonth(new Date(tourney.startDate));
        }
    }, [selectedTournamentId, tournaments]);

    const calendarGrid = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const days = new Date(year, month + 1, 0).getDate();
        const offset = firstDay === 0 ? 6 : firstDay - 1;
        const grid = [];
        for (let i = 0; i < offset; i++) grid.push(null);
        for (let i = 1; i <= days; i++) grid.push(new Date(year, month, i));
        return grid;
    }, [currentMonth]);


    return (
        <Box sx={{ color: "#fff", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '850px', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" fontWeight={900}>TERMINARZ</Typography>
                <FormControl size="small" sx={{ minWidth: 200, bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                    <Select value={selectedTournamentId} onChange={(e) => setSelectedTournamentId(e.target.value as any)} sx={{ color: "#fff", ".MuiOutlinedInput-notchedOutline": { border: "none" } }}>
                        <MenuItem value="all">Wszystkie turnieje</MenuItem>
                        {tournaments.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </Box>

            <Paper sx={{ p: 3, bgcolor: "rgba(20,20,20,0.6)", borderRadius: 5, border: "1px solid rgba(255,255,255,0.05)", width: '100%', maxWidth: '850px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight={900} sx={{ color: "#FF6A00", textTransform: 'uppercase' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Typography
                                onClick={(e) => setAnchorElMonth(e.currentTarget)}
                                variant="h5"
                                fontWeight={900}
                                sx={{ color: "#FF6A00", cursor: 'pointer', transition: '0.2s', '&:hover': { opacity: 0.7 } }}
                            >
                                {currentMonth.toLocaleString('pl-PL', { month: 'long' }).toUpperCase()}
                            </Typography>
                            <Typography
                                onClick={(e) => setAnchorElYear(e.currentTarget)}
                                variant="h5"
                                fontWeight={900}
                                sx={{ color: "#fff", cursor: 'pointer', transition: '0.2s', '&:hover': { opacity: 0.7 } }}
                            >
                                {currentMonth.getFullYear()}
                            </Typography>
                        </Box>
                    </Typography>
                    <Box>
                        <IconButton onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} sx={{ color: "#fff" }}><ChevronLeft /></IconButton>
                        <IconButton onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} sx={{ color: "#fff" }}><ChevronRight /></IconButton>
                    </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                    {calendarGrid.map((date, i) => {
                        const dayMatches = date ? getMatchesForDate(date) : [];
                        const hasMatches = dayMatches.length > 0;
                        const isToday = date?.toDateString() === new Date().toDateString();

                        return (
                            <Box
                                key={i}
                                onClick={() => { if(hasMatches) { setSelectedDate(date); setOpenDetails(true); } }}
                                sx={{
                                    aspectRatio: '1/1', borderRadius: 4, p: 2,
                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                    cursor: hasMatches ? 'pointer' : 'default',
                                    bgcolor: hasMatches ? "rgba(255,106,0,0.2)" : "rgba(255,255,255,0.03)",
                                    border: isToday ? "2px solid #FF6A00" : "1px solid rgba(255,255,255,0.05)",
                                    transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    visibility: date ? 'visible' : 'hidden',
                                    '&:hover': { transform: date ? 'scale(1.08)' : 'none', bgcolor: hasMatches ? "rgba(255,106,0,0.3)" : "rgba(255,255,255,0.08)" }
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', lineHeight: 1, color: hasMatches ? "#FF6A00" : "rgba(255,255,255,0.2)" }}>
                                        {date?.getDate()}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: 'uppercase' }}>
                                        {date ? dayNames[date.getDay()] : ""}
                                    </Typography>
                                </Box>
                                {hasMatches && (
                                    <Chip label={`${dayMatches.length} M`} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 900, bgcolor: "#FF6A00", color: "#000" }} />
                                )}
                            </Box>
                        );
                    })}
                </Box>
            </Paper>

            <Dialog
                open={detailsOpen}
                onClose={() => setOpenDetails(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { bgcolor: "#111", borderRadius: 6, color: "#fff", border: "1px solid rgba(255,255,255,0.1)" } }}
            >
                <DialogTitle sx={{ p: 3, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5" fontWeight={900}>DNIA: {selectedDate?.toLocaleDateString()}</Typography>
                        <FormControl size="small" sx={{ minWidth: 140, bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                            <Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                sx={{ color: "#FF6A00", fontSize: '0.75rem', fontWeight: 900, ".MuiOutlinedInput-notchedOutline": { border: "none" } }}
                            >
                                <MenuItem value="time">Sortuj: Czas</MenuItem>
                                <MenuItem value="tournament">Sortuj: Turniej</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: 3, pt: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        {sortedMatches.map(match => (
                            <Paper key={match.id} sx={{ p: 2, bgcolor: "rgba(255,255,255,0.03)", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)" }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="caption" sx={{ color: "#FF6A00", fontWeight: 900, textTransform: 'uppercase' }}>{match.tournamentName}</Typography>
                                    <Typography variant="caption" sx={{ color: "#666", fontWeight: 900 }}>BOISKO {match.courtNumber || '?'}</Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    {/* Drużyna A */}
                                    <Typography sx={{ flex: 1, textAlign: 'right', pr: 2, fontWeight: 800, fontSize: '0.95rem' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, color: match.winnerId === match.teamA?.id ? "#FFD700" : "inherit" }}>
                                            {match.winnerId === match.teamA?.id && <EmojiEvents sx={{ fontSize: 18 }} />}
                                            {match.teamA?.name || "???"}
                                        </Box>
                                    </Typography>

                                    {/* Środek: Czas i Wynik/VS */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100 }}>
                                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 900, mb: 0.5 }}>
                                            {new Date(match.scheduledTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>

                                        <Box sx={{
                                            px: 2, py: 0.5, bgcolor: "#000", borderRadius: 2,
                                            border: match.result ? "1px solid #4caf50" : "1px solid #FF6A00",
                                            minWidth: 70, textAlign: 'center'
                                        }}>
                                            <Typography fontWeight={900} sx={{ color: match.result ? "#4caf50" : "#FF6A00", fontSize: '1rem' }}>
                                                {match.result || "VS"}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Drużyna B */}
                                    <Typography sx={{ flex: 1, pl: 2, fontWeight: 800, fontSize: '0.95rem' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1, color: match.winnerId === match.teamB?.id ? "#FFD700" : "inherit" }}>
                                            {match.teamB?.name || "???"}
                                            {match.winnerId === match.teamB?.id && <EmojiEvents sx={{ fontSize: 18 }} />}
                                        </Box>
                                    </Typography>
                                </Box>

                                {match.notes && (
                                    <Box sx={{ mt: 1.5, p: 1.5, bgcolor: "rgba(0,0,0,0.2)", borderRadius: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <InfoOutlined sx={{ color: "rgba(255,255,255,0.2)", fontSize: 16 }} />
                                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontStyle: 'italic' }}>{match.notes}</Typography>
                                    </Box>
                                )}
                            </Paper>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setOpenDetails(false)} sx={{ color: "#FF6A00", fontWeight: 900 }}>Zamknij</Button>
                </DialogActions>
            </Dialog>
            {/* Menu wyboru miesiąca */}
            <Menu
                anchorEl={anchorElMonth}
                open={Boolean(anchorElMonth)}
                onClose={() => setAnchorElMonth(null)}
                PaperProps={{ sx: { bgcolor: "#111", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3 } }}
            >
                {months.map((m, idx) => (
                    <MenuItem key={m} onClick={() => {
                        const newDate = new Date(currentMonth);
                        newDate.setMonth(idx);
                        setCurrentMonth(newDate);
                        setAnchorElMonth(null);
                    }} sx={{ fontWeight: 700, color: currentMonth.getMonth() === idx ? "#FF6A00" : "#fff" }}>
                        {m.toUpperCase()}
                    </MenuItem>
                ))}
            </Menu>

            {/* Menu wyboru roku */}
            <Menu
                anchorEl={anchorElYear}
                open={Boolean(anchorElYear)}
                onClose={() => setAnchorElYear(null)}
                PaperProps={{ sx: { bgcolor: "#111", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3 } }}
            >
                {years.map((y) => (
                    <MenuItem key={y} onClick={() => {
                        const newDate = new Date(currentMonth);
                        newDate.setFullYear(y);
                        setCurrentMonth(newDate);
                        setAnchorElYear(null);
                    }} sx={{ fontWeight: 700, color: currentMonth.getFullYear() === y ? "#FF6A00" : "#fff" }}>
                        {y}
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
};

export default ScheduleView;