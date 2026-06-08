import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tab,
    Tabs,
} from "@mui/material";
import { Visibility as VisibilityIcon } from "@mui/icons-material";

interface Tournament {
    id: number;
    name: string;
    discipline: string;
    status: string;
}

interface Match {
    matchOrder: any;
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

const BracketsView = () => {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState<number | "">("");
    const [bracket, setBracket] = useState<Match[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [tabValue, setTabValue] = useState(0);

    // Pobierz listę turniejów
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

    // Pobierz drabinkę dla wybranego turnieju
    const fetchBracket = async (tournamentId: number) => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(
                `http://localhost:8080/api/admin/tournaments/${tournamentId}/bracket`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            if (response.ok) {
                let data = await response.json();
                
                // Sortuj po rundzie i kolejności
                data.sort((a: Match, b: Match) => {
                    if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
                    return a.matchOrder - b.matchOrder;
                });
                
                // Dodaj numer meczu
                const matchesWithNumbers = data.map((match: Match, index: number) => ({
                    ...match,
                    matchNumber: index + 1
                }));
                
                setBracket(matchesWithNumbers);
            } else {
                setError("Nie udało się pobrać drabinki.");
            }
        } catch (error) {
            console.error("Błąd:", error);
            setError("Nie udało się połączyć z serwerem.");
        } finally {
            setLoading(false);
        }
    };

    // Po wybraniu turnieju – pobierz drabinkę
    useEffect(() => {
        if (selectedTournamentId) {
            fetchBracket(selectedTournamentId as number);
        } else {
            setBracket([]);
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

    // Grupowanie meczów po rundach
    const groupedByRound = bracket.reduce((acc, match) => {
        if (!acc[match.roundNumber]) acc[match.roundNumber] = [];
        acc[match.roundNumber].push(match);
        return acc;
    }, {} as Record<number, Match[]>);

    const totalRounds = Object.keys(groupedByRound).length;

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: "#fff", mb: 3 }}>
                Drabinki turniejów
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
                        <MenuItem value="">-- Wybierz turniej --</MenuItem>
                        {tournaments.map((t) => (
                            <MenuItem key={t.id} value={t.id}>
                                {t.name} ({t.discipline}) – {t.status === "planned" ? "Planowany" : t.status === "ongoing" ? "Trwający" : "Zakończony"}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress sx={{ color: "#FF6A00" }} />
                    </Box>
                )}

                {!loading && selectedTournamentId && bracket.length === 0 && !error && (
                    <Typography sx={{ color: "rgba(255,255,255,0.7)", textAlign: "center", py: 4 }}>
                        Brak drabinki dla tego turnieju. Wygeneruj drabinkę w zakładce Turnieje.
                    </Typography>
                )}

                {!loading && bracket.length > 0 && (
                    <Box>
                        <Typography variant="subtitle1" sx={{ color: "#FF6A00", mb: 2 }}>
                            Drabinka turnieju: {tournaments.find(t => t.id === selectedTournamentId)?.name}
                        </Typography>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 4, overflowX: "auto", py: 2 }}>
                            {Object.entries(groupedByRound)
                                .sort(([a], [b]) => Number(a) - Number(b))
                                .map(([round, matches]) => (
                                    <Box key={round}>
                                        <Typography variant="h6" sx={{ textAlign: "center", mb: 2, color: "#FF6A00" }}>
                                            {getRoundName(Number(round), totalRounds)}
                                        </Typography>
                                        <Box sx={{ display: "flex", justifyContent: "center", gap: 3, flexWrap: "wrap" }}>
                                            {matches.map((match) => (
                                                <Paper
                                                    key={match.id}
                                                    sx={{
                                                        p: 2,
                                                        minWidth: 250,
                                                        textAlign: "center",
                                                        bgcolor: "rgba(0,0,0,0.6)",
                                                        borderRadius: 2,
                                                        border: "1px solid rgba(255,106,0,0.3)"
                                                    }}
                                                >
                                                    {match.courtNumber && (
                                                        <Typography variant="caption" sx={{ color: "#FF6A00", display: "block" }}>
                                                            Boisko {match.courtNumber}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="caption" sx={{ color: "#fff", display: "block" }}>
                                                        {formatDateTime(match.scheduledTime)}
                                                    </Typography>
                                                    <Box sx={{ mt: 1 }}>
                                                        <Typography sx={{ fontWeight: 500 }}>
                                                            {match.teamA?.name || "BYE"}
                                                        </Typography>
                                                        <Typography variant="h6" sx={{ my: 1 }}>vs</Typography>
                                                        <Typography sx={{ fontWeight: 500 }}>
                                                            {match.teamB?.name || "BYE"}
                                                        </Typography>
                                                        {match.result && (
                                                            <Typography sx={{ color: "#4caf50", mt: 1, fontWeight: "bold" }}>
                                                                Wynik: {match.result}
                                                            </Typography>
                                                        )}
                                                        {match.winnerId && (
                                                            <Chip
                                                                label="Rozegrany"
                                                                size="small"
                                                                sx={{ mt: 1, bgcolor: "#4caf50", color: "#fff" }}
                                                            />
                                                        )}
                                                    </Box>
                                                </Paper>
                                            ))}
                                        </Box>
                                    </Box>
                                ))}
                        </Box>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default BracketsView;