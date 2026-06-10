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
    CircularProgress,
    Zoom,
    Fade,
    Alert,
    Card,
    CardContent,
    Divider,
    Grid,
} from "@mui/material";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Warning as WarningIcon,
    Close as CloseIcon,
    GroupAdd as TeamIcon,
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
    status: string;
    notes?: string;
    nextMatchId?: number | null;
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
    const [saving, setSaving] = useState(false);
    
    // Dialogs
    const [openMatchDialog, setOpenMatchDialog] = useState(false);
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

    // Formularz meczu
    const [matchForm, setMatchForm] = useState({
        teamAId: "",
        teamBId: "",
        scheduledTime: "",
        courtNumber: "",
        result: "",
        winnerId: "",
        notes: "",
    });

    // Pobieranie danych
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            
            const teamsRes = await fetch(
                `http://localhost:8080/api/admin/tournaments/${tournamentId}/teams`,
                { headers }
            );
            if (teamsRes.ok) {
                const allTeams = await teamsRes.json();
                setTeams(allTeams);
            }
            
            const matchesRes = await fetch(
                `http://localhost:8080/api/admin/tournaments/${tournamentId}/bracket`,
                { headers }
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
            console.error("Błąd pobierania:", error);
            onError?.("Nie udało się pobrać danych");
        } finally {
            setLoading(false);
        }
    }, [tournamentId, onError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Generuj pustą drabinkę
    const generateEmptyBracket = async () => {
        if (teams.length < 2) {
            onError?.(`Za mało drużyn do wygenerowania drabinki (minimum 2). Obecnie masz: ${teams.length}`);
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
                onError?.(error.message || "Błąd generowania drabinki");
            }
        } catch (error) {
            console.error("Błąd:", error);
            onError?.("Nie udało się połączyć z serwerem");
        } finally {
            setGenerating(false);
        }
    };

    // Otwórz dialog edycji meczu
    const handleOpenEditDialog = (match: Match) => {
        setEditingMatch(match);
        setMatchForm({
            teamAId: match.teamA?.id?.toString() || "",
            teamBId: match.teamB?.id?.toString() || "",
            scheduledTime: match.scheduledTime ? match.scheduledTime.slice(0, 16) : "",
            courtNumber: match.courtNumber?.toString() || "",
            result: match.result || "",
            winnerId: match.winnerId?.toString() || "",
            notes: match.notes || "",
        });
        setOpenMatchDialog(true);
    };

    // Zapisz mecz
    const handleSaveMatchTeams = async () => {
        if (!editingMatch) return;
        
        if (!matchForm.teamAId || !matchForm.teamBId) {
            onError?.("Wybierz obie drużyny");
            return;
        }
        
        if (matchForm.teamAId === matchForm.teamBId) {
            onError?.("Drużyna nie może grać sama ze sobą");
            return;
        }
        
        setSaving(true);
        
        try {
            const token = localStorage.getItem("token");
            
            const teamsResponse = await fetch(
                `http://localhost:8080/api/admin/tournaments/matches/${editingMatch.id}/teams`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        teamAId: parseInt(matchForm.teamAId),
                        teamBId: parseInt(matchForm.teamBId),
                    }),
                }
            );
            
            if (!teamsResponse.ok) {
                const error = await teamsResponse.json();
                throw new Error(error.message || "Błąd zapisu drużyn");
            }
            
            if (matchForm.result) {
                let winnerId = null;
                if (matchForm.winnerId) {
                    winnerId = parseInt(matchForm.winnerId);
                } else {
                    const [scoreA, scoreB] = matchForm.result.split(":").map(Number);
                    if (scoreA > scoreB) {
                        winnerId = parseInt(matchForm.teamAId);
                    } else if (scoreB > scoreA) {
                        winnerId = parseInt(matchForm.teamBId);
                    }
                }
                
                await fetch(
                    `http://localhost:8080/api/admin/tournaments/matches/${editingMatch.id}/result`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            result: matchForm.result,
                            winnerId: winnerId,
                            notes: matchForm.notes || null,
                        }),
                    }
                );
            }
            
            if (matchForm.scheduledTime) {
                await fetch(
                    `http://localhost:8080/api/admin/tournaments/matches/${editingMatch.id}/time`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ scheduledTime: matchForm.scheduledTime }),
                    }
                );
            }
            
            onSuccess?.("Drużyny zostały zapisane");
            setOpenMatchDialog(false);
            await fetchData();
            
        } catch (error: any) {
            console.error("Błąd zapisu:", error);
            onError?.(error.message || "Nie udało się zapisać drużyn");
        } finally {
            setSaving(false);
        }
    };

    // Usuń mecz
    const handleDeleteClick = (match: Match) => {
        setMatchToDelete(match);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!matchToDelete) return;
        
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:8080/api/admin/tournaments/matches/${matchToDelete.id}`,
                { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.ok) {
                onSuccess?.("Mecz został usunięty");
                fetchData();
            } else {
                const error = await response.json();
                onError?.(error.message || "Błąd usuwania meczu");
            }
        } catch (error) {
            console.error("Błąd:", error);
            onError?.("Nie udało się połączyć z serwerem");
        } finally {
            setDeleteDialogOpen(false);
            setMatchToDelete(null);
        }
    };

    // Pobierz dostępne drużyny
    const getAvailableTeams = (currentMatch: Match | null) => {
        const usedTeamIds = new Set<number>();
        matches.forEach(match => {
            if (currentMatch && match.id === currentMatch.id) return;
            if (match.teamA) usedTeamIds.add(match.teamA.id);
            if (match.teamB) usedTeamIds.add(match.teamB.id);
        });
        return teams.filter(team => !usedTeamIds.has(team.id));
    };

    const getRoundTitle = (roundNumber: number): string => {
        if (totalRounds === 1) return "FINAŁ";
        if (totalRounds === 2) {
            if (roundNumber === 1) return "PÓŁFINAŁ";
            if (roundNumber === 2) return "FINAŁ";
        }
        if (totalRounds === 3) {
            if (roundNumber === 1) return "ĆWIERĆFINAŁ";
            if (roundNumber === 2) return "PÓŁFINAŁ";
            if (roundNumber === 3) return "FINAŁ";
        }
        if (totalRounds === 4) {
            if (roundNumber === 1) return "1/8 FINAŁU";
            if (roundNumber === 2) return "ĆWIERĆFINAŁ";
            if (roundNumber === 3) return "PÓŁFINAŁ";
            if (roundNumber === 4) return "FINAŁ";
        }
        return `RUNDA ${roundNumber}`;
    };

    const formatDateTime = (dateTime: string | null) => {
        if (!dateTime) return "Brak daty";
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

    // Brak drużyn
    if (teams.length === 0) {
        return (
            <Paper sx={{ p: 4, textAlign: "center", bgcolor: "rgba(0,0,0,0.5)", borderRadius: 2 }}>
                <TeamIcon sx={{ fontSize: 60, color: "#FF6A00", mb: 2 }} />
                <Typography variant="h6" sx={{ color: "#FF6A00", mb: 1 }}>
                    Brak drużyn
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                    Dodaj drużyny do turnieju w zakładce "Drużyny"
                </Typography>
            </Paper>
        );
    }

    // Jeśli nie ma drabinki
    if (matches.length === 0) {
        const teamCount = teams.length;
        let roundsInfo = "";
        if (teamCount <= 2) roundsInfo = "Finał";
        else if (teamCount <= 4) roundsInfo = "Półfinał → Finał";
        else if (teamCount <= 8) roundsInfo = "Ćwierćfinał → Półfinał → Finał";
        else roundsInfo = "1/8 finału → Ćwierćfinał → Półfinał → Finał";
        
        return (
            <Zoom in={true}>
                <Box sx={{ textAlign: "center", py: 6 }}>
                    <Typography variant="h4" sx={{ mb: 2, color: "#FF6A00", fontWeight: "bold" }}>
                        Utwórz drabinkę turnieju
                    </Typography>
                    
                    <Paper sx={{ maxWidth: 500, mx: "auto", p: 3, mb: 4, bgcolor: "rgba(0,0,0,0.5)", borderRadius: 3 }}>
                        <Typography variant="body1" sx={{ mb: 2, color: "#fff" }}>
                            Liczba drużyn: <strong>{teams.length}</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, color: "rgba(255,255,255,0.7)" }}>
                            System: <strong>{roundsInfo}</strong>
                        </Typography>
                        <Divider sx={{ my: 2, bgcolor: "rgba(255,255,255,0.1)" }} />
                        <Typography variant="body2" sx={{ color: "#FF6A00" }}>
                            Po wygenerowaniu będziesz mógł ręcznie przypisać drużyny do meczów
                        </Typography>
                    </Paper>
                    
                    <Button
                        variant="contained"
                        onClick={generateEmptyBracket}
                        disabled={generating}
                        size="large"
                        sx={{ bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" }, px: 6, py: 1.5 }}
                    >
                        {generating ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Generuj pustą drabinkę"}
                    </Button>
                </Box>
            </Zoom>
        );
    }

    // Główny widok drabinki - KLASYCZNY UKŁAD (rundy pionowo, mecze w rundzie poziomo)
    return (
        <Fade in={true}>
            <Box>
                {/* Header z informacjami */}
                <Paper sx={{ p: 2, mb: 3, bgcolor: "rgba(0,0,0,0.5)", borderRadius: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                        <Typography sx={{ color: "#FF6A00", fontWeight: "bold" }}>
                            Tryb ręczny - kliknij na mecz aby edytować
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Chip 
                                label={`${teams.length} drużyn`} 
                                sx={{ bgcolor: "rgba(255,106,0,0.2)", color: "#FF6A00" }}
                            />
                            <Chip 
                                label={`${totalRounds} rund`} 
                                sx={{ bgcolor: "rgba(255,106,0,0.2)", color: "#FF6A00" }}
                            />
                            <Button
                                size="small"
                                startIcon={<RefreshIcon />}
                                onClick={fetchData}
                                sx={{ color: "#FF6A00" }}
                            >
                                Odśwież
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                {/* Drabinka - RUNDY PIONOWO (jedna pod drugą) */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => (
                        <Paper key={round} sx={{ p: 2, bgcolor: "rgba(0,0,0,0.4)", borderRadius: 2 }}>
                            <Typography 
                                sx={{ 
                                    textAlign: "center", 
                                    mb: 2, 
                                    color: "#FF6A00", 
                                    fontWeight: "bold",
                                    bgcolor: "rgba(255,106,0,0.1)",
                                    py: 1,
                                    borderRadius: 2,
                                }}
                            >
                                {getRoundTitle(round)}
                            </Typography>
                            
                            {/* MECZE W RUNDZIE - POZIOMO (obok siebie) */}
                            <Box sx={{ 
                                display: "flex", 
                                flexDirection: "row", 
                                flexWrap: "wrap", 
                                justifyContent: "center",
                                gap: 2 
                            }}>
                                {(matchesByRound[round] || []).map((match) => (
                                    <Card 
                                        key={match.id} 
                                        sx={{ 
                                            bgcolor: "rgba(0,0,0,0.6)", 
                                            border: "1px solid rgba(255,106,0,0.3)",
                                            cursor: "pointer",
                                            transition: "0.2s",
                                            width: 280,
                                            flexShrink: 0,
                                            "&:hover": { borderColor: "#FF6A00", transform: "translateY(-5px)" },
                                        }}
                                        onClick={() => handleOpenEditDialog(match)}
                                    >
                                        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                                <Typography variant="caption" sx={{ color: "#FF6A00" }}>
                                                    Mecz {match.matchNumber}
                                                </Typography>
                                                {match.courtNumber && (
                                                    <Typography variant="caption" sx={{ color: "#aaa" }}>
                                                        Boisko {match.courtNumber}
                                                    </Typography>
                                                )}
                                            </Box>
                                            
                                            <Box sx={{ textAlign: "center", py: 1 }}>
                                                <Typography sx={{ fontWeight: "bold", fontSize: "0.9rem", color: match.winnerId === match.teamA?.id ? "#FFD700" : "#fff" }}>
                                                    {match.teamA?.name || "BRAK"}
                                                </Typography>
                                                <Typography variant="body2" sx={{ my: 0.5, color: "#FF6A00" }}>VS</Typography>
                                                <Typography sx={{ fontWeight: "bold", fontSize: "0.9rem", color: match.winnerId === match.teamB?.id ? "#FFD700" : "#fff" }}>
                                                    {match.teamB?.name || "BRAK"}
                                                </Typography>
                                            </Box>
                                            
                                            {match.scheduledTime && (
                                                <Typography variant="caption" sx={{ display: "block", textAlign: "center", color: "#4caf50" }}>
                                                    {formatDateTime(match.scheduledTime)}
                                                </Typography>
                                            )}
                                            
                                            {match.result && (
                                                <Typography sx={{ color: "#4caf50", textAlign: "center", fontWeight: "bold", fontSize: "0.85rem", mt: 0.5 }}>
                                                    Wynik: {match.result}
                                                </Typography>
                                            )}
                                            
                                            {match.winner && (
                                                <Chip
                                                    label={`Zwycięzca: ${match.winner.name}`}
                                                    size="small"
                                                    sx={{ mt: 1, width: "100%", bgcolor: "#FFD700", color: "#000", fontWeight: "bold", fontSize: "0.7rem" }}
                                                />
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Paper>
                    ))}
                </Box>

                {/* Dialog edycji meczu */}
                <Dialog
                    open={openMatchDialog}
                    onClose={() => setOpenMatchDialog(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: { bgcolor: "rgba(0,0,0,0.95)", color: "#fff", borderRadius: 4, border: "1px solid rgba(255,106,0,0.3)" }
                    }}
                >
                    <DialogTitle sx={{ color: "#FF6A00", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                        Edytuj mecz - Runda {editingMatch?.roundNumber}
                        <IconButton
                            onClick={() => setOpenMatchDialog(false)}
                            sx={{ position: "absolute", right: 8, top: 8, color: "#ccc" }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel sx={{ color: "#ccc" }}>Drużyna A</InputLabel>
                                <Select
                                    value={matchForm.teamAId}
                                    onChange={(e) => setMatchForm({ ...matchForm, teamAId: e.target.value })}
                                    label="Drużyna A"
                                    sx={{ color: "#fff" }}
                                >
                                    <MenuItem value="">-- Wybierz --</MenuItem>
                                    {getAvailableTeams(editingMatch).map((team) => (
                                        <MenuItem key={team.id} value={team.id}>
                                            {team.name}
                                        </MenuItem>
                                    ))}
                                    {editingMatch?.teamA && !getAvailableTeams(editingMatch).find(t => t.id === editingMatch.teamA?.id) && (
                                        <MenuItem value={editingMatch.teamA.id}>
                                            {editingMatch.teamA.name} (obecna)
                                        </MenuItem>
                                    )}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel sx={{ color: "#ccc" }}>Drużyna B</InputLabel>
                                <Select
                                    value={matchForm.teamBId}
                                    onChange={(e) => setMatchForm({ ...matchForm, teamBId: e.target.value })}
                                    label="Drużyna B"
                                    sx={{ color: "#fff" }}
                                >
                                    <MenuItem value="">-- Wybierz --</MenuItem>
                                    {getAvailableTeams(editingMatch)
                                        .filter(team => team.id.toString() !== matchForm.teamAId)
                                        .map((team) => (
                                            <MenuItem key={team.id} value={team.id}>
                                                {team.name}
                                            </MenuItem>
                                        ))}
                                    {editingMatch?.teamB && !getAvailableTeams(editingMatch).find(t => t.id === editingMatch.teamB?.id) && (
                                        <MenuItem value={editingMatch.teamB.id}>
                                            {editingMatch.teamB.name} (obecna)
                                        </MenuItem>
                                    )}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Data i godzina"
                                type="datetime-local"
                                value={matchForm.scheduledTime}
                                onChange={(e) => setMatchForm({ ...matchForm, scheduledTime: e.target.value })}
                                fullWidth
                                InputLabelProps={{ shrink: true, style: { color: "#ccc" } }}
                                sx={{ input: { color: "#fff" } }}
                            />

                            <TextField
                                label="Numer boiska"
                                type="number"
                                value={matchForm.courtNumber}
                                onChange={(e) => setMatchForm({ ...matchForm, courtNumber: e.target.value })}
                                fullWidth
                                InputProps={{ inputProps: { min: 1, max: 10 } }}
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                sx={{ input: { color: "#fff" } }}
                            />

                            <TextField
                                label="Wynik (np. 3:1)"
                                value={matchForm.result}
                                onChange={(e) => setMatchForm({ ...matchForm, result: e.target.value })}
                                fullWidth
                                placeholder="np. 3:1"
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                sx={{ input: { color: "#fff" } }}
                            />

                            <FormControl fullWidth>
                                <InputLabel sx={{ color: "#ccc" }}>Zwycięzca (opcjonalny)</InputLabel>
                                <Select
                                    value={matchForm.winnerId}
                                    onChange={(e) => setMatchForm({ ...matchForm, winnerId: e.target.value })}
                                    label="Zwycięzca (opcjonalny)"
                                    sx={{ color: "#fff" }}
                                >
                                    <MenuItem value="">-- Automatyczny --</MenuItem>
                                    {matchForm.teamAId && (
                                        <MenuItem value={matchForm.teamAId}>
                                            {teams.find(t => t.id.toString() === matchForm.teamAId)?.name}
                                        </MenuItem>
                                    )}
                                    {matchForm.teamBId && (
                                        <MenuItem value={matchForm.teamBId}>
                                            {teams.find(t => t.id.toString() === matchForm.teamBId)?.name}
                                        </MenuItem>
                                    )}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Notatki"
                                value={matchForm.notes}
                                onChange={(e) => setMatchForm({ ...matchForm, notes: e.target.value })}
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Np. Dogrywka, kartki..."
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                sx={{ textarea: { color: "#fff" } }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 0 }}>
                        <Button onClick={() => setOpenMatchDialog(false)} sx={{ color: "#ccc" }}>
                            Anuluj
                        </Button>
                        <Button 
                            onClick={handleSaveMatchTeams} 
                            variant="contained" 
                            disabled={saving}
                            sx={{ bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" } }}
                        >
                            {saving ? <CircularProgress size={24} /> : "Zapisz"}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Dialog usuwania meczu */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    maxWidth="xs"
                    fullWidth
                    PaperProps={{
                        sx: { bgcolor: "rgba(0,0,0,0.95)", color: "#fff", borderRadius: 4, textAlign: "center" }
                    }}
                >
                    <DialogTitle sx={{ color: "#ff6b6b" }}>
                        <WarningIcon sx={{ fontSize: 50, color: "#ff6b6b", mb: 1 }} />
                        <Typography variant="h6">Usunięcie meczu</Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Typography>Czy na pewno chcesz usunąć ten mecz?</Typography>
                        {matchToDelete && (
                            <Paper sx={{ p: 2, mt: 2, bgcolor: "rgba(255,107,107,0.1)", borderRadius: 2 }}>
                                <Typography fontWeight="bold">
                                    {matchToDelete.teamA?.name || "?"} vs {matchToDelete.teamB?.name || "?"}
                                </Typography>
                            </Paper>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
                        <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined" sx={{ color: "#ccc" }}>
                            Anuluj
                        </Button>
                        <Button onClick={handleConfirmDelete} variant="contained" sx={{ bgcolor: "#ff6b6b" }}>
                            Usuń
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Fade>
    );
};

export default ManualBracket;