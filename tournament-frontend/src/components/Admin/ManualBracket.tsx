import { useState, useEffect, useCallback } from "react";
import {
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Grid,
    CircularProgress,
    Alert,
    Card,
    CardContent,
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    Refresh as RefreshIcon,
} from "@mui/icons-material";

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
    teamA: Team | null;
    teamB: Team | null;
    result: string | null;
    winnerId: number | null;
    winner: Team | null;
    scheduledTime: string | null;
    courtNumber: number | null;
}

interface ManualBracketProps {
    tournamentId: number;
    tournamentName: string;
    discipline: string;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

const ManualBracket = ({ tournamentId, tournamentName, discipline, onSuccess, onError }: ManualBracketProps) => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [matchesByRound, setMatchesByRound] = useState<Record<number, Match[]>>({});
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [totalRounds, setTotalRounds] = useState(0);
    const [openMatchDialog, setOpenMatchDialog] = useState(false);
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);
    const [matchForm, setMatchForm] = useState({
        teamAId: "",
        teamBId: "",
        scheduledTime: "",
        courtNumber: "",
        result: "",
        winnerId: "",
    });

    // Pobierz dane
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            
            // Pobierz drużyny
            const teamsRes = await fetch(
                `http://localhost:8080/api/admin/tournaments/${tournamentId}/teams`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (teamsRes.ok) {
                const allTeams = await teamsRes.json();
                setTeams(allTeams);
            }
            
            // Pobierz drabinkę
            const matchesRes = await fetch(
                `http://localhost:8080/api/admin/tournaments/${tournamentId}/bracket`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (matchesRes.ok) {
                let data = await matchesRes.json();
                data.sort((a: Match, b: Match) => {
                    if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
                    return a.matchOrder - b.matchOrder;
                });
                
                const matchesWithNumbers = data.map((match: Match, index: number) => ({
                    ...match,
                    matchNumber: index + 1
                }));
                
                setMatches(matchesWithNumbers);
                
                const grouped: Record<number, Match[]> = {};
                matchesWithNumbers.forEach((match: Match) => {
                    if (!grouped[match.roundNumber]) grouped[match.roundNumber] = [];
                    grouped[match.roundNumber].push(match);
                });
                setMatchesByRound(grouped);
                
                const maxRound = Math.max(...Object.keys(grouped).map(Number), 0);
                setTotalRounds(maxRound);
            }
        } catch (error) {
            console.error("Błąd:", error);
        } finally {
            setLoading(false);
        }
    }, [tournamentId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Generuj pustą drabinkę
    const generateEmptyBracket = async () => {
        if (teams.length < 2) {
            onError?.("Potrzebujesz co najmniej 2 drużyny");
            return;
        }
        
        setGenerating(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:8080/api/admin/tournaments/${tournamentId}/generate-empty-bracket?numberOfCourts=1`,
                { 
                    method: "POST", 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    } 
                }
            );
            
            if (response.ok) {
                onSuccess?.("Pusta drabinka została wygenerowana");
                await fetchData();
            } else {
                const error = await response.json();
                onError?.(error.message || "Błąd generowania");
            }
        } catch (error) {
            onError?.("Błąd połączenia");
        } finally {
            setGenerating(false);
        }
    };

    // Edytuj mecz
    const handleEditMatch = (match: Match) => {
        setEditingMatch(match);
        setMatchForm({
            teamAId: match.teamA?.id?.toString() || "",
            teamBId: match.teamB?.id?.toString() || "",
            scheduledTime: match.scheduledTime ? match.scheduledTime.slice(0, 16) : "",
            courtNumber: match.courtNumber?.toString() || "",
            result: match.result || "",
            winnerId: match.winnerId?.toString() || "",
        });
        setOpenMatchDialog(true);
    };

    // Zapisz mecz
    const handleSaveMatch = async () => {
        if (!editingMatch) return;
        if (!matchForm.teamAId || !matchForm.teamBId) {
            onError?.("Wybierz obie drużyny");
            return;
        }
        
        try {
            const token = localStorage.getItem("token");
            
            // Zapisz drużyny
            await fetch(
                `http://localhost:8080/api/admin/tournaments/matches/${editingMatch.id}/teams`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        teamAId: parseInt(matchForm.teamAId),
                        teamBId: parseInt(matchForm.teamBId),
                    }),
                }
            );
            
            // Zapisz wynik jeśli jest
            if (matchForm.result) {
                let winnerId = null;
                if (matchForm.winnerId) {
                    winnerId = parseInt(matchForm.winnerId);
                } else {
                    const [scoreA, scoreB] = matchForm.result.split(":").map(Number);
                    if (scoreA > scoreB) winnerId = parseInt(matchForm.teamAId);
                    else if (scoreB > scoreA) winnerId = parseInt(matchForm.teamBId);
                }
                
                await fetch(
                    `http://localhost:8080/api/admin/tournaments/matches/${editingMatch.id}/result`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ result: matchForm.result, winnerId }),
                    }
                );
            }
            
            // Zapisz datę
            if (matchForm.scheduledTime) {
                await fetch(
                    `http://localhost:8080/api/admin/tournaments/matches/${editingMatch.id}/time`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ scheduledTime: matchForm.scheduledTime }),
                    }
                );
            }
            
            onSuccess?.("Mecz zaktualizowany");
            setOpenMatchDialog(false);
            await fetchData();
        } catch (error) {
            onError?.("Błąd zapisu");
        }
    };

    const getRoundTitle = (roundNumber: number): string => {
        if (totalRounds === 1) return "🏆 FINAŁ";
        if (totalRounds === 2) {
            if (roundNumber === 1) return "🥇 PÓŁFINAŁ";
            return "🏆 FINAŁ";
        }
        if (totalRounds === 3) {
            if (roundNumber === 1) return "🥈 ĆWIERĆFINAŁ";
            if (roundNumber === 2) return "🥇 PÓŁFINAŁ";
            return "🏆 FINAŁ";
        }
        return `RUNDA ${roundNumber}`;
    };

    if (loading) {
        return <CircularProgress sx={{ color: "#FF6A00" }} />;
    }

    // Brak drabinki
    if (matches.length === 0) {
        return (
            <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography sx={{ mb: 2, color: "#FF6A00" }}>
                    Brak drabinki. Kliknij poniżej aby wygenerować pustą drabinkę.
                </Typography>
                <Button
                    variant="contained"
                    onClick={generateEmptyBracket}
                    disabled={generating}
                    sx={{ bgcolor: "#FF6A00" }}
                >
                    {generating ? <CircularProgress size={24} /> : "Generuj pustą drabinkę"}
                </Button>
            </Box>
        );
    }

    // Widok drabinki
    return (
        <Box>
            <Paper sx={{ p: 2, mb: 2, bgcolor: "rgba(0,0,0,0.5)" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ color: "#FF6A00" }}>
                        ✏️ Tryb ręczny - kliknij na mecz aby edytować
                    </Typography>
                    <Button size="small" startIcon={<RefreshIcon />} onClick={fetchData} sx={{ color: "#FF6A00" }}>
                        Odśwież
                    </Button>
                </Box>
            </Paper>

            <Box sx={{ overflowX: "auto" }}>
                <Box sx={{ display: "flex", gap: 4, minWidth: "min-content" }}>
                    {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => (
                        <Box key={round} sx={{ minWidth: 280 }}>
                            <Typography sx={{ textAlign: "center", mb: 2, color: "#FF6A00", fontWeight: "bold" }}>
                                {getRoundTitle(round)}
                            </Typography>
                            
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {(matchesByRound[round] || []).map((match) => (
                                    <Card
                                        key={match.id}
                                        onClick={() => handleEditMatch(match)}
                                        sx={{
                                            cursor: "pointer",
                                            bgcolor: "rgba(0,0,0,0.6)",
                                            border: "1px solid rgba(255,106,0,0.3)",
                                            "&:hover": { borderColor: "#FF6A00" }
                                        }}
                                    >
                                        <CardContent>
                                            <Typography variant="caption" sx={{ color: "#FF6A00" }}>
                                                Mecz {match.matchNumber}
                                            </Typography>
                                            <Box sx={{ textAlign: "center", py: 1 }}>
                                                <Typography fontWeight="bold">
                                                    {match.teamA?.name || "❓ BRAK"}
                                                </Typography>
                                                <Typography sx={{ my: 0.5, color: "#FF6A00" }}>VS</Typography>
                                                <Typography fontWeight="bold">
                                                    {match.teamB?.name || "❓ BRAK"}
                                                </Typography>
                                            </Box>
                                            {match.result && (
                                                <Typography sx={{ color: "#4caf50", textAlign: "center" }}>
                                                    {match.result}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Dialog edycji meczu */}
            <Dialog open={openMatchDialog} onClose={() => setOpenMatchDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: "#1a1a1a", color: "#FF6A00" }}>
                    Edytuj mecz
                    <IconButton sx={{ position: "absolute", right: 8, top: 8 }} onClick={() => setOpenMatchDialog(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ bgcolor: "#1a1a1a" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Drużyna A</InputLabel>
                            <Select
                                value={matchForm.teamAId}
                                onChange={(e) => setMatchForm({ ...matchForm, teamAId: e.target.value })}
                                label="Drużyna A"
                            >
                                <MenuItem value="">-- Wybierz --</MenuItem>
                                {teams.map((team) => (
                                    <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Drużyna B</InputLabel>
                            <Select
                                value={matchForm.teamBId}
                                onChange={(e) => setMatchForm({ ...matchForm, teamBId: e.target.value })}
                                label="Drużyna B"
                            >
                                <MenuItem value="">-- Wybierz --</MenuItem>
                                {teams.map((team) => (
                                    <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Data i godzina"
                            type="datetime-local"
                            value={matchForm.scheduledTime}
                            onChange={(e) => setMatchForm({ ...matchForm, scheduledTime: e.target.value })}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="Wynik (np. 3:1)"
                            value={matchForm.result}
                            onChange={(e) => setMatchForm({ ...matchForm, result: e.target.value })}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ bgcolor: "#1a1a1a" }}>
                    <Button onClick={() => setOpenMatchDialog(false)}>Anuluj</Button>
                    <Button onClick={handleSaveMatch} variant="contained" sx={{ bgcolor: "#FF6A00" }}>
                        Zapisz
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManualBracket;