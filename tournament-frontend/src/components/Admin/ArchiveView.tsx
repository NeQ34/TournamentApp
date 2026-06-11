// src/components/admin/ArchiveView.tsx
import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Tab,
    Tabs,
} from "@mui/material";
import {
    Search as SearchIcon,
    PictureAsPdf as PdfIcon,
    Visibility as ViewIcon,
} from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Tournament {
    id: number;
    name: string;
    discipline: string;
    startDate: string;
    endDate?: string;
    location?: string;
    status: string;
    maxTeams?: number;
    registeredTeamsCount?: number;
}

interface Team {
    id: number;
    name: string;
    sport: string;
    captainName: string;
}

interface Match {
    id: number;
    matchNumber: number;
    roundNumber: number;
    matchOrder: number;
    teamA: { id: number; name: string } | null;
    teamB: { id: number; name: string } | null;
    result: string | null;
    winnerId: number | null;
    scheduledTime: string | null;
    courtNumber: number | null;
    notes?: string;
}

const ArchiveView = () => {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [disciplineFilter, setDisciplineFilter] = useState("");
    const [disciplines, setDisciplines] = useState<string[]>([]);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [teamFilter, setTeamFilter] = useState("");
    const [tournamentTeamsMap, setTournamentTeamsMap] = useState<Record<number, Team[]>>({});
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [tournamentTeams, setTournamentTeams] = useState<Team[]>([]);
    const [tournamentBracket, setTournamentBracket] = useState<Match[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [message, setMessage] = useState({ error: "", success: "" });

    const fetchArchivedTournaments = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/admin/tournaments", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (response.ok) {
                const data = await response.json();
                const archived = data.filter(
                    (t: Tournament) => t.status === "finished" || t.status === "archived"
                );
                setTournaments(archived);
                setFilteredTournaments(archived);

                // Pobieranie drużyn dla turniejów archiwalnych pod filtrację
                const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
                const teamPromises = archived.map(async (t: Tournament) => {
                    const res = await fetch(`http://localhost:8080/api/admin/tournaments/${t.id}/teams`, { headers });
                    if (res.ok) {
                        const teamsData = await res.json();
                        return { id: t.id, teams: teamsData };
                    }
                    return { id: t.id, teams: [] };
                });
                const resolvedTeams = await Promise.all(teamPromises);
                const map: Record<number, Team[]> = {};
                resolvedTeams.forEach(item => {
                    map[item.id] = item.teams;
                });
                setTournamentTeamsMap(map);
            }
        } catch (error) {
            console.error("Błąd pobierania:", error);
        } finally {
            setLoading(false);
        }
    };
    const fetchDisciplines = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/disciplines");
            if (response.ok) {
                const data = await response.json();
                setDisciplines(data.map((d: { name: string }) => d.name));
            }
        } catch (error) {
            console.error("Błąd pobierania dyscyplin:", error);
        }
    };
    const fetchAllTeams = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/teams");
            if (response.ok) {
                const data = await response.json();
                setAllTeams(data);
            }
        } catch (error) {
            console.error("Błąd pobierania drużyn:", error);
        }
    };

    useEffect(() => {
        fetchArchivedTournaments();
        fetchDisciplines();
        fetchAllTeams();
    }, []);

    const fetchTournamentDetails = async (tournamentId: number) => {
        setDetailsLoading(true);
        try {
            const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
            
            const teamsRes = await fetch(
                `http://localhost:8080/api/admin/tournaments/${tournamentId}/teams`,
                { headers }
            );
            const teams = teamsRes.ok ? await teamsRes.json() : [];
            setTournamentTeams(teams);
            
            const bracketRes = await fetch(
                `http://localhost:8080/api/admin/tournaments/${tournamentId}/bracket`,
                { headers }
            );
            if (bracketRes.ok) {
                let data = await bracketRes.json();
                data.sort((a: Match, b: Match) => {
                    if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
                    return a.matchOrder - b.matchOrder;
                });
                const matchesWithNumbers = data.map((match: Match, index: number) => ({
                    ...match,
                    matchNumber: index + 1,
                }));
                setTournamentBracket(matchesWithNumbers);
            } else {
                setTournamentBracket([]);
            }
        } catch (error) {
            console.error("Błąd pobierania szczegółów:", error);
        } finally {
            setDetailsLoading(false);
        }
    };

    // Funkcja zastępująca polskie znaki na odpowiedniki bez ogonków
    const removePolishChars = (text: string): string => {
        const polishChars: { [key: string]: string } = {
            'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
            'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
        };
        return text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, char => polishChars[char] || char);
    };

    const generatePDF = () => {
        if (!selectedTournament) return;
        
        const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        
        // Użyj standardowej czcionki "helvetica" (działa ale bez polskich znaków)
        // Dlatego usuwamy polskie znaki przed zapisaniem
        pdf.setFont("helvetica", "normal");
        
        const title = removePolishChars(`Raport turnieju: ${selectedTournament.name}`);
        pdf.setFontSize(18);
        pdf.setTextColor(255, 106, 0);
        pdf.text(title, 14, 20);
        
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        let y = 30;
        
        const discipline = removePolishChars(selectedTournament.discipline);
        pdf.text(`Dyscyplina: ${discipline}`, 14, y);
        y += 7;
        
        const dateRange = `${selectedTournament.startDate}${selectedTournament.endDate ? ` - ${selectedTournament.endDate}` : ""}`;
        pdf.text(`Data: ${dateRange}`, 14, y);
        y += 7;
        pdf.text(`Liczba druzyn: ${tournamentTeams.length}`, 14, y);
        y += 7;
        
        if (selectedTournament.location) {
            const location = removePolishChars(selectedTournament.location);
            pdf.text(`Lokalizacja: ${location}`, 14, y);
            y += 7;
        }
        
        y += 10;
        
        pdf.setFontSize(12);
        pdf.setTextColor(255, 106, 0);
        pdf.text("Lista druzyn:", 14, y);
        y += 7;
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        const teamNames = tournamentTeams.map((t, i) => `${i + 1}. ${removePolishChars(t.name)}`).join("  ");
        const teamLines = pdf.splitTextToSize(teamNames, 180);
        pdf.text(teamLines, 14, y);
        y += teamLines.length * 7 + 10;
        
        if (tournamentBracket.length > 0) {
            pdf.setFontSize(12);
            pdf.setTextColor(255, 106, 0);
            pdf.text("Drabinka i wyniki:", 14, y);
            y += 7;
            
            const grouped = tournamentBracket.reduce((acc, m) => {
                if (!acc[m.roundNumber]) acc[m.roundNumber] = [];
                acc[m.roundNumber].push(m);
                return acc;
            }, {} as Record<number, Match[]>);
            
            for (const round of Object.keys(grouped).sort((a, b) => Number(a) - Number(b))) {
                const roundNum = Number(round);
                const matches = grouped[roundNum];
                
                if (y > 250) {
                    pdf.addPage();
                    y = 20;
                }
                
                pdf.setFontSize(10);
                pdf.setTextColor(255, 106, 0);
                pdf.text(`Runda ${roundNum}:`, 14, y);
                y += 5;
                
                const tableData = matches.map(m => [
                    m.matchNumber.toString(),
                    `${removePolishChars(m.teamA?.name || "BYE")} vs ${removePolishChars(m.teamB?.name || "BYE")}`,
                    m.result || "-",
                ]);
                
                autoTable(pdf, {
                    startY: y,
                    head: [["Mecz", "Druzyny", "Wynik"]],
                    body: tableData,
                    theme: "grid",
                    headStyles: { fillColor: [255, 106, 0], textColor: [255, 255, 255] },
                    margin: { left: 14, right: 14 },
                });
                
                y = (pdf as any).lastAutoTable.finalY + 10;
            }
        }
        
        pdf.save(`raport_${removePolishChars(selectedTournament.name)}.pdf`);
    };

    const handleViewDetails = async (tournament: Tournament) => {
        setSelectedTournament(tournament);
        await fetchTournamentDetails(tournament.id);
        setTabValue(0);
        setDetailsOpen(true);
    };
    // Automatyczny reset filtra drużyny przy zmianie dyscypliny na niezgodną
    useEffect(() => {
        if (disciplineFilter && teamFilter) {
            const selectedTeamObj = allTeams.find(t => t.name === teamFilter);
            if (selectedTeamObj && selectedTeamObj.sport && selectedTeamObj.sport.toLowerCase() !== disciplineFilter.toLowerCase()) {
                setTeamFilter("");
            }
        }
    }, [disciplineFilter, teamFilter, allTeams]);

    useEffect(() => {
        let filtered = [...tournaments];
        if (searchTerm) {
            filtered = filtered.filter(t =>
                t.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (disciplineFilter) {
            filtered = filtered.filter(t => t.discipline === disciplineFilter);
        }
        if (teamFilter) {
            filtered = filtered.filter(t => {
                const tTeams = tournamentTeamsMap[t.id] || [];
                return tTeams.some(team => team.name === teamFilter);
            });
        }
        setFilteredTournaments(filtered);
    }, [searchTerm, disciplineFilter, teamFilter, tournaments, tournamentTeamsMap]);

    useEffect(() => {
        fetchArchivedTournaments();
        fetchDisciplines();
    }, []);

    const getRoundName = (roundNumber: number, totalRounds: number): string => {
        if (roundNumber === 1 && totalRounds === 4) return "1/8 finału";
        if (roundNumber === 2 && totalRounds === 4) return "Ćwierćfinał";
        if (roundNumber === 3 && totalRounds === 4) return "Półfinał";
        if (roundNumber === 4 && totalRounds === 4) return "Finał";
        if (roundNumber === 1 && totalRounds === 3) return "Ćwierćfinał";
        if (roundNumber === 2 && totalRounds === 3) return "Półfinał";
        if (roundNumber === 3 && totalRounds === 3) return "Finał";
        if (roundNumber === 1 && totalRounds === 2) return "Półfinał";
        if (roundNumber === 2 && totalRounds === 2) return "Finał";
        return `Runda ${roundNumber}`;
    };

    const getStatusLabel = (status: string) => {
        return status === "finished" ? "Zakończony" : "Archiwalny";
    };

    const formatMatchDateTime = (dateTime: string | null) => {
        if (!dateTime) return "—";
        const date = new Date(dateTime);
        return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress sx={{ color: "#FF6A00" }} />
            </Box>
        );
    }

    const totalRounds = Math.max(...tournamentBracket.map(m => m.roundNumber), 0);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" fontWeight={700} sx={{ color: "#fff" }}>
                    Archiwum turniejów
                </Typography>
                <Typography variant="body2" sx={{ color: "#aaa", fontWeight: 500 }}>
                    Znaleziono: {filteredTournaments.length} turniejów
                </Typography>
            </Box>

            {message.error && <Alert severity="error" sx={{ mb: 2 }}>{message.error}</Alert>}
            {message.success && <Alert severity="success" sx={{ mb: 2 }}>{message.success}</Alert>}

            <Paper sx={{ p: 2, mb: 3, bgcolor: "rgba(0,0,0,0.7)", borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    {/* Okno Szukaj turnieju */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            size="small"
                            placeholder="Szukaj turnieju..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            fullWidth
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ color: "#fff", mr: 1, fontSize: 20 }} />,
                            }}
                            sx={{ input: { color: "#fff" } }}
                        />
                    </Grid>

                    {/* Okno Wybierz dyscyplinę */}
                    <Grid size={{ xs: 12, md: 4 }}>

                    <Grid item xs={12} md={4}>

                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ color: "#ccc" }}>Dyscyplina</InputLabel>
                            <Select
                                value={disciplineFilter}
                                onChange={(e) => setDisciplineFilter(e.target.value)}
                                label="Dyscyplina"
                                sx={{ color: "#fff" }}
                            >
                                <MenuItem value="">Wszystkie dyscypliny</MenuItem>
                                {disciplines.map(d => (
                                    <MenuItem key={d} value={d}>{d}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Okno Wybierz drużynę */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ color: "#ccc" }}>Drużyna</InputLabel>
                            <Select
                                value={teamFilter}
                                onChange={(e) => setTeamFilter(e.target.value)}
                                label="Drużyna"
                                sx={{ color: "#fff" }}
                            >
                                <MenuItem value="">Wszystkie drużyny</MenuItem>
                                {allTeams
                                    .filter(t => !disciplineFilter || (t.sport && t.sport.toLowerCase() === disciplineFilter.toLowerCase()))
                                    .map(t => (
                                        <MenuItem key={t.id} value={t.name}>{t.name}</MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>
            {filteredTournaments.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center", bgcolor: "rgba(0,0,0,0.7)", borderRadius: 2 }}>
                    <Typography sx={{ color: "#aaa" }}>Brak archiwalnych turniejów.</Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {filteredTournaments.map((tournament) => (
                        <Grid size={{ xs: 12 }} key={tournament.id}>
                            <Card sx={{ bgcolor: "rgba(0,0,0,0.7)", borderRadius: 2, border: "1px solid rgba(255,106,0,0.3)" }}>
                                <CardContent>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
                                        <Box>
                                            <Typography variant="h6" sx={{ color: "#FF6A00", fontWeight: "bold" }}>
                                                {tournament.name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: "#fff" }}>
                                                {tournament.discipline}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: "#aaa", display: "block" }}>
                                                {tournament.startDate} {tournament.endDate && `- ${tournament.endDate}`}
                                            </Typography>
                                            {tournament.location && (
                                                <Typography variant="caption" sx={{ color: "#aaa", display: "block" }}>
                                                    📍 {tournament.location}
                                                </Typography>
                                            )}
                                            <Typography variant="caption" sx={{ color: "#aaa", display: "block" }}>
                                                👥 {tournament.registeredTeamsCount || 0} drużyn
                                                {tournament.maxTeams ? ` / max ${tournament.maxTeams}` : ""}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={getStatusLabel(tournament.status)}
                                            size="small"
                                            sx={{
                                                bgcolor: tournament.status === "finished" ? "rgba(76,175,80,0.2)" : "rgba(158,158,158,0.2)",
                                                color: tournament.status === "finished" ? "#4caf50" : "#9e9e9e",
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                                <CardActions sx={{ display: "flex", gap: 1, justifyContent: "flex-end", p: 2, pt: 0 }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<ViewIcon />}
                                        onClick={() => handleViewDetails(tournament)}
                                        sx={{ color: "#FF6A00", borderColor: "#FF6A00" }}
                                    >
                                        Szczegóły
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<PdfIcon />}
                                        onClick={() => {
                                            setSelectedTournament(tournament);
                                            fetchTournamentDetails(tournament.id);
                                            setTimeout(() => generatePDF(), 500);
                                        }}
                                        sx={{ color: "#FF6A00", borderColor: "#FF6A00" }}
                                    >
                                        Pobierz PDF
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Dialog szczegółów turnieju */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { bgcolor: "rgba(0,0,0,0.9)", color: "#fff", borderRadius: 2 } }}
            >
                <DialogTitle>
                    Szczegóły turnieju: {selectedTournament?.name}
                    <IconButton
                        sx={{ position: "absolute", right: 8, top: 8, color: "#ccc" }}
                        onClick={() => setDetailsOpen(false)}
                    >
                        ✕
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {detailsLoading ? (
                        <CircularProgress sx={{ color: "#FF6A00" }} />
                    ) : (
                        <>
                            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)", mb: 2 }}>
                                <Tab label="Informacje" sx={{ color: "#fff" }} />
                                <Tab label="Drużyny" sx={{ color: "#fff" }} />
                                <Tab label="Drabinka" sx={{ color: "#fff" }} />
                            </Tabs>

                            {tabValue === 0 && (
                                <Box>
                                    <Typography variant="subtitle1" sx={{ color: "#FF6A00", mb: 1 }}>Podstawowe informacje</Typography>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Typography variant="caption" sx={{ color: "#aaa" }}>Nazwa turnieju</Typography>
                                            <Typography variant="body1" sx={{ color: "#fff", mb: 1 }}>{selectedTournament?.name}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Typography variant="caption" sx={{ color: "#aaa" }}>Dyscyplina</Typography>
                                            <Typography variant="body1" sx={{ color: "#fff", mb: 1 }}>{selectedTournament?.discipline}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Typography variant="caption" sx={{ color: "#aaa" }}>Data rozpoczęcia</Typography>
                                            <Typography variant="body1" sx={{ color: "#fff", mb: 1 }}>{selectedTournament?.startDate}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Typography variant="caption" sx={{ color: "#aaa" }}>Data zakończenia</Typography>
                                            <Typography variant="body1" sx={{ color: "#fff", mb: 1 }}>{selectedTournament?.endDate || "—"}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Typography variant="caption" sx={{ color: "#aaa" }}>Lokalizacja</Typography>
                                            <Typography variant="body1" sx={{ color: "#fff", mb: 1 }}>{selectedTournament?.location || "—"}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Typography variant="caption" sx={{ color: "#aaa" }}>Status</Typography>
                                            <Chip label={getStatusLabel(selectedTournament?.status || "")} size="small" sx={{ mt: 0.5 }} />
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            {tabValue === 1 && (
                                <Box>
                                    <Typography variant="subtitle1" sx={{ color: "#FF6A00", mb: 2 }}>Lista drużyn ({tournamentTeams.length})</Typography>
                                    <TableContainer component={Paper} sx={{ bgcolor: "rgba(0,0,0,0.5)" }}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ color: "#FF6A00" }}>Lp.</TableCell>
                                                    <TableCell sx={{ color: "#FF6A00" }}>Nazwa drużyny</TableCell>
                                                    <TableCell sx={{ color: "#FF6A00" }}>Dyscyplina</TableCell>
                                                    <TableCell sx={{ color: "#FF6A00" }}>Kapitan</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {tournamentTeams.map((team, idx) => (
                                                    <TableRow key={team.id}>
                                                        <TableCell sx={{ color: "#fff" }}>{idx + 1}</TableCell>
                                                        <TableCell sx={{ color: "#fff" }}>{team.name}</TableCell>
                                                        <TableCell sx={{ color: "#fff" }}>{team.sport}</TableCell>
                                                        <TableCell sx={{ color: "#fff" }}>{team.captainName}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}

                            {tabValue === 2 && (
                                <Box>
                                    {tournamentBracket.length === 0 ? (
                                        <Typography sx={{ color: "#aaa", textAlign: "center", py: 4 }}>
                                            Brak drabinki dla tego turnieju.
                                        </Typography>
                                    ) : (
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 4, py: 2 }}>
                                            {Array.from(new Set(tournamentBracket.map(m => m.roundNumber))).sort((a, b) => a - b).map(round => {
                                                const roundMatches = tournamentBracket.filter(m => m.roundNumber === round).sort((a, b) => a.matchOrder - b.matchOrder);
                                                return (
                                                    <Box key={round}>
                                                        <Typography variant="h6" sx={{ textAlign: "center", mb: 2, color: "#FF6A00" }}>
                                                            {getRoundName(round, totalRounds)}
                                                        </Typography>
                                                        <Box sx={{ display: "flex", justifyContent: "center", gap: 3, flexWrap: "wrap" }}>
                                                            {roundMatches.map((match) => (
                                                                <Paper
                                                                    key={match.id}
                                                                    sx={{
                                                                        p: 2,
                                                                        minWidth: 250,
                                                                        textAlign: "center",
                                                                        bgcolor: "rgba(0,0,0,0.6)",
                                                                        borderRadius: 2,
                                                                        border: "1px solid rgba(255,106,0,0.3)",
                                                                        position: "relative",
                                                                    }}
                                                                >
                                                                    <Typography variant="caption" sx={{ position: "absolute", top: 4, left: 8, color: "#FF6A00" }}>
                                                                        Mecz #{match.matchNumber}
                                                                    </Typography>
                                                                    {match.courtNumber && (
                                                                        <Typography variant="caption" sx={{ position: "absolute", top: 4, right: 8, color: "#FF6A00" }}>
                                                                            Boisko {match.courtNumber}
                                                                        </Typography>
                                                                    )}
                                                                    <Box sx={{ mt: 2 }}>
                                                                        <Typography sx={{ fontWeight: 500 }}>
                                                                            {match.teamA?.name || "BYE"}
                                                                        </Typography>
                                                                        <Typography variant="h6" sx={{ my: 1 }}>vs</Typography>
                                                                        <Typography sx={{ fontWeight: 500 }}>
                                                                            {match.teamB?.name || "BYE"}
                                                                        </Typography>
                                                                        {match.scheduledTime && (
                                                                            <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#aaa" }}>
                                                                                📅 {formatMatchDateTime(match.scheduledTime)}
                                                                            </Typography>
                                                                        )}
                                                                        {match.result && (
                                                                            <Typography sx={{ color: "#4caf50", mt: 1, fontWeight: "bold" }}>
                                                                                Wynik: {match.result}
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                </Paper>
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsOpen(false)} sx={{ color: "#ccc" }}>Zamknij</Button>
                    <Button variant="contained" onClick={generatePDF} sx={{ bgcolor: "#FF6A00" }}>Pobierz PDF</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ArchiveView;