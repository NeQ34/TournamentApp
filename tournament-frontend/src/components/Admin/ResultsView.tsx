import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Chip,
    Alert,
    CircularProgress,
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";

interface Tournament {
    id: number;
    name: string;
    discipline: string;
}

interface Match {
    id: number;
    matchNumber: number;
    roundNumber: number;
    teamA: { name: string } | null;
    teamB: { name: string } | null;
    result: string | null;
    winnerId: number | null;
    scheduledTime: string | null;
    courtNumber: number | null;
}

const ScheduleView = () => {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState<number | "">("");
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const getRoundTitle = (roundNumber: number, totalRounds: number): string => {
        const diff = totalRounds - roundNumber;
        switch (diff) {
            case 0: return "FINAŁ";
            case 1: return "PÓŁFINAŁ";
            case 2: return "ĆWIERĆFINAŁ";
            case 3: return "1/8 FINAŁU";
            case 4: return "1/16 FINAŁU";
            default: return `RUNDA ${roundNumber}`;
        }
    };

    const fetchTournaments = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/admin/tournaments", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (response.ok) {
                const data = await response.json();
                setTournaments(data);
            }
        } catch (error) {
            console.error("Błąd pobierania turniejów:", error);
        }
    };

    const fetchBracket = async (tournamentId: number) => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(
                `http://localhost:8080/api/admin/tournaments/${tournamentId}/bracket`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            if (response.ok) {
                const data = await response.json();
                // Sortuj po dacie
                const sorted = [...data].sort((a, b) => {
                    // Najpierw po rundzie
                    if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
                    // Potem po dacie
                    if (!a.scheduledTime && !b.scheduledTime) return 0;
                    if (!a.scheduledTime) return 1;
                    if (!b.scheduledTime) return -1;
                    return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
                });
                setMatches(sorted);
            } else {
                setError("Nie udało się pobrać terminarza.");
            }
        } catch (error) {
            console.error("Błąd:", error);
            setError("Nie udało się połączyć z serwerem.");
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        if (selectedTournamentId) {
            fetchBracket(selectedTournamentId as number);
        } else {
            setMatches([]);
        }
    }, [selectedTournamentId]);

    useEffect(() => {
        fetchTournaments();
    }, []);

    const formatDateTime = (dateTime: string | null) => {
        if (!dateTime) return "—";
        const date = new Date(dateTime);
        return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: "#fff", mb: 3 }}>
                Wyniki
            </Typography>

            <Paper sx={{ p: 3, mb: 3, bgcolor: "rgba(0,0,0,0.7)", borderRadius: 4 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel sx={{ color: "#ccc" }}>Wybierz turniej</InputLabel>
                    <Select
                        value={selectedTournamentId}
                        onChange={(e) => setSelectedTournamentId(e.target.value as number)}
                        label="Wybierz turniej"
                        sx={{ color: "#fff" }}
                    >
                        <MenuItem value="">Wybierz turniej</MenuItem>
                        {tournaments.map((t) => (
                            <MenuItem key={t.id} value={t.id}>
                                {t.name} ({t.discipline})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {loading && <CircularProgress sx={{ color: "#FF6A00" }} />}

                {!loading && selectedTournamentId && matches.length === 0 && !error && (
                    <Typography sx={{ color: "rgba(255,255,255,0.7)", textAlign: "center", py: 4 }}>
                        Brak meczów w tym turnieju. Wygeneruj drabinkę w zakładce Turnieje.
                    </Typography>
                )}

                {!loading && matches.length > 0 && (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "rgba(255,106,0,0.1)" }}>
                                <TableCell sx={{ color: "#FF6A00" }}>Data / Godzina</TableCell>
                                <TableCell sx={{ color: "#FF6A00" }}>Boisko</TableCell>
                                <TableCell sx={{ color: "#FF6A00" }}>Mecz</TableCell>
                                <TableCell sx={{ color: "#FF6A00" }}>Drużyny</TableCell>
                                <TableCell sx={{ color: "#FF6A00" }}>Wynik</TableCell>
                                <TableCell sx={{ color: "#FF6A00" }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(() => {
                                const grouped = matches.reduce((acc, match) => {
                                    if (!acc[match.roundNumber]) acc[match.roundNumber] = [];
                                    acc[match.roundNumber].push(match);
                                    return acc;
                                }, {} as Record<number, Match[]>);
                                
                                const rows: React.ReactNode[] = [];
                                const roundNumbers = Object.keys(grouped).map(Number).sort((a, b) => a - b);
                                const totalRounds = roundNumbers.length > 0 ? Math.max(...roundNumbers) : 0;
                                
                                for (let i = 0; i < roundNumbers.length; i++) {
                                    const round = roundNumbers[i];
                                    const roundMatches = grouped[round];
                                    
                                    rows.push(
                                        <TableRow key={`round-header-${round}`} sx={{ bgcolor: "rgba(255,106,0,0.15)" }}>
                                            <TableCell colSpan={6} sx={{ py: 1, textAlign: "center" }}>
                                                <Typography variant="subtitle2" sx={{ color: "#FF6A00", fontWeight: "bold" }}>
                                                    {getRoundTitle(round, totalRounds)}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                    
                                    for (const match of roundMatches) {
                                        rows.push(
                                            <TableRow key={match.id}>
                                                <TableCell sx={{ color: "#fff" }}>{formatDateTime(match.scheduledTime)}</TableCell>
                                                <TableCell sx={{ color: "#fff" }}>{match.courtNumber ? `Boisko ${match.courtNumber}` : "—"}</TableCell>
                                                <TableCell sx={{ color: "#fff" }}>Mecz #{match.matchNumber}</TableCell>
                                                <TableCell sx={{ color: "#fff" }}>{match.teamA?.name} vs {match.teamB?.name}</TableCell>
                                                <TableCell sx={{ color: match.result ? "#4caf50" : "rgba(255,255,255,0.5)" }}>
                                                    {match.result || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {match.winnerId ? (
                                                        <Chip label="Rozegrany" size="small" sx={{ bgcolor: "#4caf50", color: "#fff" }} />
                                                    ) : (
                                                        <Chip label="Planowany" size="small" sx={{ bgcolor: "#2196f3", color: "#fff" }} />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }
                                }
                                
                                return rows;
                            })()}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            </Paper>
        </Box>
    );
};

export default ScheduleView;