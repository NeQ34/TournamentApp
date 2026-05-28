// src/components/admin/TournamentsManagement.tsx
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  TablePagination,
  Autocomplete,
  Alert,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  GroupAdd as GroupAddIcon,
  EmojiEvents as EmojiEventsIcon,
} from "@mui/icons-material";

interface Tournament {
  id: number;
  name: string;
  discipline: string;
  startDate: string;
  endDate?: string;
  location?: string;
  description?: string;
  status: "planned" | "ongoing" | "finished" | "archived";
  maxTeams?: number;
  registeredTeamsCount?: number;
}

interface Team {
  id: number;
  name: string;
  sport: string;
  captainName: string;
  membersCount: number;
}

interface Match {
  id: number;
  matchNumber: number;
  roundNumber: number;
  matchOrder: number;
  teamA: { id: number; name: string } | null;
  teamB: { id: number; name: string } | null;
  result: string | null;
  status: string;
  winnerId: number | null;
  nextMatchId: number | null;
  notes?: string;
  scheduledTime?: string;
  courtNumber?: number;
}

const TournamentsManagement = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [dialogError, setDialogError] = useState("");
  const [dialogSuccess, setDialogSuccess] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingTimeMatch, setEditingTimeMatch] = useState<Match | null>(null);
  const [tempTime, setTempTime] = useState("");
  const [matchDuration, setMatchDuration] = useState(60);
  const [breakBetweenMatches, setBreakBetweenMatches] = useState(15);
  const [startHour, setStartHour] = useState(10);

  // Formularz
  const [formData, setFormData] = useState({
    name: "",
    discipline: "",
    startDate: "",
    endDate: "",
    location: "",
    description: "",
    status: "planned" as Tournament["status"],
    maxTeams: "",
  });

  // Zakładki w szczegółach turnieju
  const [selectedTournamentForDetails, setSelectedTournamentForDetails] = useState<Tournament | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [registeredTeams, setRegisteredTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // Drabinka
  const [bracket, setBracket] = useState<Match[]>([]);
  const [bracketLoading, setBracketLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [randomize, setRandomize] = useState(false);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [score, setScore] = useState("");
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [dialogManageError, setDialogManageError] = useState("");
  const [dialogManageSuccess, setDialogManageSuccess] = useState("");
  const [drawError, setDrawError] = useState("");

  const [showNotes, setShowNotes] = useState(false);
  const [matchNotes, setMatchNotes] = useState("");
  const [numberOfCourts, setNumberOfCourts] = useState(1);

  // Filtrowanie
  const filterTournaments = (list: Tournament[]) => {
    if (!searchTerm) return list;
    return list.filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const isValidScore = (value: string) => {
    return /^\d+:\d+$/.test(value);
  };

  // ========== POBIERANIE DANYCH ==========
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

  const fetchAvailableTeams = async (discipline: string, tournamentId?: number) => {
    if (!discipline) return;
    setTeamsLoading(true);
    try {
        let url = `http://localhost:8080/api/admin/teams/available?discipline=${encodeURIComponent(discipline)}`;
        if (tournamentId) {
            url += `&tournamentId=${tournamentId}`;
        }
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (response.ok) {
            const data = await response.json();
            setAvailableTeams(data);
        }
    } catch (error) {
        console.error("Błąd pobierania drużyn:", error);
    } finally {
        setTeamsLoading(false);
    }
};

  const fetchRegisteredTeams = async (tournamentId: number) => {
    setTeamsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/admin/tournaments/${tournamentId}/teams`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setRegisteredTeams(data);
      }
    } catch (error) {
      console.error("Błąd pobierania zgłoszonych drużyn:", error);
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchBracket = async (tournamentId: number) => {
    setBracketLoading(true);
    try {
        const response = await fetch(
            `http://localhost:8080/api/admin/tournaments/${tournamentId}/bracket`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        if (response.ok) {
            let data = await response.json();
            
            data.sort((a: Match, b: Match) => {
                if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
                return a.matchOrder - b.matchOrder;
            });
            
            const matchesWithNumbers = data.map((match: Match, index: number) => ({
                ...match,
                matchNumber: index + 1,
                courtNumber: match.courtNumber
            }));
            
            setBracket(matchesWithNumbers);
        }
    } catch (error) {
        console.error("Błąd pobierania drabinki:", error);
    } finally {
        setBracketLoading(false);
    }
  };

  const formatDateTimeForInput = (dateTime: string | null) => {
    if (!dateTime) return "";
    return dateTime.slice(0, 16);
  };

  const handleUpdateMatchTime = async (matchId: number, scheduledTime: string) => {
    try {
        const response = await fetch(
            `http://localhost:8080/api/admin/tournaments/matches/${matchId}/time`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ scheduledTime }),
            }
        );
        if (response.ok) {
            await fetchBracket(selectedTournamentForDetails!.id);
            setDialogManageSuccess("Godzina meczu została zaktualizowana.");
        } else {
            const error = await response.json();
            setDialogManageError(error.message || "Błąd zapisu godziny");
        }
    } catch (error) {
        console.error("Błąd:", error);
        setDialogManageError("Nie udało się połączyć z serwerem.");
    }
};

  const formatMatchDateTime = (scheduledTime: string | null | undefined) => {
    if (!scheduledTime) return "Brak daty";
    
    const date = new Date(scheduledTime);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  // ========== OPERACJE NA TURNIEJACH ==========
  const handleSaveTournament = async () => {
    setDialogError("");
    setDialogSuccess("");

    if (!formData.name.trim()) {
      setDialogError("Nazwa turnieju jest wymagana.");
      return;
    }
    if (!formData.discipline) {
      setDialogError("Dyscyplina jest wymagana.");
      return;
    }
    if (!formData.startDate) {
      setDialogError("Data rozpoczęcia jest wymagana.");
      return;
    }

    const url = selectedTournament
      ? `http://localhost:8080/api/admin/tournaments/${selectedTournament.id}`
      : "http://localhost:8080/api/admin/tournaments";
    const method = selectedTournament ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          discipline: formData.discipline,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          location: formData.location || null,
          description: formData.description || null,
          status: formData.status,
          maxTeams: formData.maxTeams ? Number(formData.maxTeams) : null,
        }),
      });

      if (response.ok) {
        fetchTournaments();
        fetchDisciplines();
        setOpenDialog(false);
        resetForm();
        setDialogSuccess(selectedTournament ? "Turniej został zaktualizowany." : "Turniej został dodany.");
      } else {
        const error = await response.json();
        setDialogError(error.message || "Nie udało się zapisać turnieju.");
      }
    } catch (error) {
      console.error("Błąd zapisu turnieju:", error);
      setDialogError("Nie udało się połączyć z serwerem.");
    }
  };

  const handleDeleteTournament = async () => {
    if (!tournamentToDelete) return;
    try {
      const response = await fetch(`http://localhost:8080/api/admin/tournaments/${tournamentToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        fetchTournaments();
        setDialogSuccess("Turniej został usunięty.");
      } else {
        const error = await response.json();
        setDialogError(error.message || "Nie udało się usunąć turnieju.");
      }
    } catch (error) {
      console.error("Błąd usuwania turnieju:", error);
      setDialogError("Nie udało się połączyć z serwerem.");
    } finally {
      setConfirmDeleteOpen(false);
      setTournamentToDelete(null);
    }
  };

  // ========== ZARZĄDZANIE DRUŻYNAMI W TURNIEJU ==========
  const handleAddTeamToTournament = async (teamId: number) => {
    if (!selectedTournamentForDetails) return;
    try {
        const response = await fetch(
            `http://localhost:8080/api/admin/tournaments/${selectedTournamentForDetails.id}/teams/${teamId}`,
            { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        if (response.ok) {
            // Odśwież obie listy
            await fetchRegisteredTeams(selectedTournamentForDetails.id);
            await fetchAvailableTeams(selectedTournamentForDetails.discipline, selectedTournamentForDetails.id);
            // Odśwież też listę turniejów (żeby zaktualizować licznik drużyn)
            fetchTournaments();
            setDialogManageSuccess("Drużyna została dodana do turnieju.");
        } else {
            const error = await response.json();
            setDialogManageSuccess(error.message || "Nie udało się dodać drużyny.");
            //setDialogError(error.message || "Nie udało się dodać drużyny.");
        }
    } catch (error) {
        console.error("Błąd dodawania drużyny:", error);
        setDialogError("Nie udało się połączyć z serwerem.");
    }
  };

  const handleRemoveTeamFromTournament = async (teamId: number) => {
    if (!selectedTournamentForDetails) return;
    try {
        const response = await fetch(
            `http://localhost:8080/api/admin/tournaments/${selectedTournamentForDetails.id}/teams/${teamId}`,
            { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        if (response.ok) {
            // Odśwież obie listy
            await fetchRegisteredTeams(selectedTournamentForDetails.id);
            await fetchAvailableTeams(selectedTournamentForDetails.discipline, selectedTournamentForDetails.id);
            fetchTournaments();
            setDialogManageSuccess("Drużyna została usunięta z turnieju.");
        } else {
            const error = await response.json();
            setDialogError(error.message || "Nie udało się usunąć drużyny.");
        }
    } catch (error) {
        console.error("Błąd usuwania drużyny:", error);
        setDialogError("Nie udało się połączyć z serwerem.");
    }
};

  // ========== DRABINKA ==========
  const handleGenerateBracket = async () => {
    if (!selectedTournamentForDetails) return;
    setGenerating(true);
    try {
        const response = await fetch(
            `http://localhost:8080/api/admin/tournaments/${selectedTournamentForDetails.id}/generate-bracket?randomize=${randomize}&numberOfCourts=${numberOfCourts}`,
            { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        if (response.ok) {
            await fetchBracket(selectedTournamentForDetails.id);
            setDialogSuccess("Drabinka została wygenerowana.");
        } else {
            const error = await response.json();
            setDialogError(error.message || "Błąd generowania drabinki");
        }
    } catch (error) {
        console.error("Błąd:", error);
    } finally {
        setGenerating(false);
    }
  };

  const handleSaveScore = async () => {
    if (!selectedMatch) return;
    
    setDrawError("");
    
    // Sprawdź czy chcemy zapisać tylko datę (bez wyniku)
    const hasResult = score.trim() !== "";
    
    // Walidacja tylko jeśli jest wynik
    if (hasResult) {
        if (!isValidScore(score)) {
            setDialogManageError("Nieprawidłowy format wyniku. Użyj formatu: liczba:liczba (np. 3:1)");
            return;
        }
        
        const [scoreA, scoreB] = score.split(":").map(Number);
        
        if (scoreA === scoreB) {
            setDrawError("Remis nie jest dozwolony w turnieju pucharowym.");
            return;
        }
    }
    
    try {
        // ZAWSZE zapisz datę/godzinę (jeśli zmieniona)
        if (selectedMatch.scheduledTime) {
            await fetch(
                `http://localhost:8080/api/admin/tournaments/matches/${selectedMatch.id}/time`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({ scheduledTime: selectedMatch.scheduledTime }),
                }
            );
        }
        
        // Zapisz wynik TYLKO jeśli został wprowadzony
        if (hasResult) {
            const [scoreA, scoreB] = score.split(":").map(Number);
            let winnerId = null;
            if (scoreA > scoreB) {
                winnerId = selectedMatch.teamA?.id || null;
            } else if (scoreB > scoreA) {
                winnerId = selectedMatch.teamB?.id || null;
            }
            
            if (!winnerId) {
                setDialogManageError("Nie można określić zwycięzcy.");
                return;
            }
            
            const requestBody: any = { result: score, winnerId };
            if (showNotes && matchNotes.trim()) {
                requestBody.notes = matchNotes.trim();
            }
            
            const response = await fetch(
                `http://localhost:8080/api/admin/tournaments/matches/${selectedMatch.id}/result`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify(requestBody),
                }
            );
            
            if (!response.ok) {
                const error = await response.json();
                setDialogManageError(error.message || "Błąd zapisu wyniku");
                return;
            }
        }
        
        // Odśwież drabinkę
        await fetchBracket(selectedTournamentForDetails!.id);
        setScoreDialogOpen(false);
        setSelectedMatch(null);
        setScore("");
        setShowNotes(false);
        setMatchNotes("");
        setDrawError("");
        setDialogManageSuccess(hasResult ? "Wynik i godzina zostały zapisane." : "Godzina meczu została zapisana.");
        
    } catch (error) {
        console.error("Błąd:", error);
        setDialogManageError("Nie udało się połączyć z serwerem.");
    }
  };

  // ========== POMOCNICZE ==========
  const resetForm = () => {
    setFormData({
      name: "",
      discipline: "",
      startDate: "",
      endDate: "",
      location: "",
      description: "",
      status: "planned",
      maxTeams: "",
    });
    setSelectedTournament(null);
    setDialogError("");
    setDialogSuccess("");
  };

  const openEditDialog = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setFormData({
      name: tournament.name,
      discipline: tournament.discipline,
      startDate: tournament.startDate,
      endDate: tournament.endDate || "",
      location: tournament.location || "",
      description: tournament.description || "",
      status: tournament.status,
      maxTeams: tournament.maxTeams?.toString() || "",
    });
    setOpenDialog(true);
  };

  const openDetailsDialog = (tournament: Tournament) => {
    setSelectedTournamentForDetails(tournament);
    setTabValue(0);
    fetchRegisteredTeams(tournament.id);
    fetchAvailableTeams(tournament.discipline, tournament.id);
    fetchBracket(tournament.id);
  };

  const getTeamDisplayName = (match: Match, teamSide: 'A' | 'B', allMatches: Match[]): string => {
    const team = teamSide === 'A' ? match.teamA : match.teamB;
    
    // Jeśli drużyna jest bezpośrednio przypisana
    if (team) {
        // Sprawdź czy ta drużyna przyszła z poprzedniego meczu
        const sourceMatch = allMatches.find(m => 
            m.winnerId === team.id && m.nextMatchId === match.id
        );
        if (sourceMatch) {
            return `${team.name} (z meczu ${sourceMatch.matchNumber})`;
        }
        return team.name;
    }
    
    // Szukamy meczów które wskazują na ten mecz (nextMatchId)
    let sourceMatches = allMatches.filter(m => m.nextMatchId === match.id);
    
    // Jeśli nie znaleziono po nextMatchId, użyj kolejności rund
    if (sourceMatches.length === 0 && match.roundNumber > 1) {
        const previousRound = match.roundNumber - 1;
        const previousRoundMatches = allMatches
            .filter(m => m.roundNumber === previousRound)
            .sort((a, b) => a.matchOrder - b.matchOrder);
        
        // Podziel mecze z poprzedniej rundy na pół
        const half = previousRoundMatches.length / 2;
        
        if (teamSide === 'A') {
            sourceMatches = previousRoundMatches.slice(0, half);
        } else {
            sourceMatches = previousRoundMatches.slice(half);
        }
    }
    
    // Jeśli mamy źródłowe mecze
    if (sourceMatches.length > 0) {
        // Dla finału (2 źródła) lub dla pojedynczego źródła
        const sourceMatch = teamSide === 'A' ? sourceMatches[0] : sourceMatches[sourceMatches.length - 1];
        
        if (sourceMatch && sourceMatch.winnerId) {
            const winner = getWinnerFromMatch(sourceMatch.id, allMatches);
            if (winner) {
                return `${winner.name} (z meczu ${sourceMatch.matchNumber})`;
            }
        }
        
        if (sourceMatch) {
            // Sprawdź czy mecz źródłowy ma już zwycięzcę (może być BYE)
            if (sourceMatch.winnerId) {
                const winnerName = sourceMatch.teamA?.id === sourceMatch.winnerId 
                    ? sourceMatch.teamA?.name 
                    : sourceMatch.teamB?.name;
                if (winnerName) {
                    return `${winnerName} (z meczu ${sourceMatch.matchNumber})`;
                }
            }
            return `Zwycięzca meczu ${sourceMatch.matchNumber}`;
        }
    }
    
    return "BYE";
  };

  const isMatchLocked = (match: Match, allMatches: Match[]): boolean => {
    // Jeśli mecz nie ma zwycięzcy – można edytować
    if (!match.winnerId) return false;
    
    // Znajdź następny mecz
    if (!match.nextMatchId) return false;
    
    const nextMatch = allMatches.find(m => m.id === match.nextMatchId);
    if (!nextMatch) return false;
    
    // Blokuj tylko jeśli następny mecz ma wynik
    return !!(nextMatch.result && nextMatch.winnerId);
  };

  // Pobiera zwycięzcę meczu (nazwę drużyny i numer meczu źródłowego)
  const getWinnerFromMatch = (matchId: number, allMatches: Match[]): { name: string; sourceMatchNumber: number } | null => {
    const match = allMatches.find(m => m.id === matchId);
    if (!match) return null;
    
    // Jeśli mecz ma zwycięzcę
    if (match.winnerId) {
        let winnerName = "";
        if (match.teamA?.id === match.winnerId) {
            winnerName = match.teamA.name;
        } else if (match.teamB?.id === match.winnerId) {
            winnerName = match.teamB.name;
        }
        if (winnerName) {
            return { name: winnerName, sourceMatchNumber: match.matchNumber };
        }
    }
    
    return null;
  };

  const getMatchesMap = (matches: Match[]) => {
    const map = new Map<number, Match>();
    matches.forEach(m => map.set(m.id, m));
    return map;
  };

  const getTeamSource = (match: Match, teamSide: 'A' | 'B', allMatches: Match[], matchesMap: Map<number, Match>): string => {
    // Jeśli drużyna istnieje (to drużyna początkowa, nie z awansu)
    if (teamSide === 'A' && match.teamA) {
        return match.teamA.name;
    }
    if (teamSide === 'B' && match.teamB) {
        return match.teamB.name;
    }
    
    const previousRoundMatches = allMatches.filter(m => 
        m.roundNumber === match.roundNumber - 1 && 
        m.nextMatchId === match.id
    );
    
    if (previousRoundMatches.length === 1) {
        const sourceMatch = previousRoundMatches[0];
        if (sourceMatch.winnerId && sourceMatch.teamA && sourceMatch.teamB) {
            const winnerName = sourceMatch.teamA.id === sourceMatch.winnerId 
                ? sourceMatch.teamA.name 
                : sourceMatch.teamB.name;
            return `${winnerName} (mecz ${sourceMatch.matchNumber})`;
        }
        return `Zwycięzca meczu ${sourceMatch.matchNumber}`;
    }
    
    if (previousRoundMatches.length === 2) {
        const index = teamSide === 'A' ? 0 : 1;
        const sourceMatch = previousRoundMatches[index];
        if (sourceMatch && sourceMatch.winnerId && sourceMatch.teamA && sourceMatch.teamB) {
            const winnerName = sourceMatch.teamA.id === sourceMatch.winnerId 
                ? sourceMatch.teamA.name 
                : sourceMatch.teamB.name;
            return `${winnerName} (mecz ${sourceMatch.matchNumber})`;
        }
        return sourceMatch ? `Zwycięzca meczu ${sourceMatch.matchNumber}` : 'BYE';
    }
    
    return 'BYE';
  };

  const handleCloseScoreDialog = () => {
    setScoreDialogOpen(false);
    setSelectedMatch(null);
    setScore("");
    setShowNotes(false);
    setMatchNotes("");
    setDrawError("");
    setDialogManageError("");
  };

  const handleEditScore = (match: Match) => {
    setSelectedMatch(match);
    if (match.result) {
        setScore(match.result);
        setMatchNotes(match.notes || "");
        setShowNotes(!!match.notes);
    } else {
        setScore("");
        setMatchNotes("");
        setShowNotes(false);
    }
    setScoreDialogOpen(true);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planned":
        return { label: "Planowany", color: "#2196f3" };
      case "ongoing":
        return { label: "Trwający", color: "#ff9800" };
      case "finished":
        return { label: "Zakończony", color: "#4caf50" };
      case "archived":
        return { label: "Archiwalny", color: "#9e9e9e" };
      default:
        return { label: status, color: "#fff" };
    }
  };

  useEffect(() => {
    fetchTournaments();
    fetchDisciplines();
  }, []);

  useEffect(() => {
    if (!dialogManageError && !dialogManageSuccess) return;
    const timer = setTimeout(() => {
        setDialogManageError("");
        setDialogManageSuccess("");
    }, 3000);
    return () => clearTimeout(timer);
}, [dialogManageError, dialogManageSuccess]);

  useEffect(() => {
    if (!dialogError && !dialogSuccess) return;
    const timer = setTimeout(() => {
      setDialogError("");
      setDialogSuccess("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [dialogError, dialogSuccess]);
  useEffect(() => {
    if (selectedTournamentForDetails && tabValue === 0) {
        fetchRegisteredTeams(selectedTournamentForDetails.id);
        fetchAvailableTeams(selectedTournamentForDetails.discipline, selectedTournamentForDetails.id);
    }
  }, [tabValue, selectedTournamentForDetails]);

  const filteredTournaments = filterTournaments(tournaments).sort((a, b) =>
    a.name.localeCompare(b.name, "pl", { sensitivity: "base" })
  );
  const paginatedTournaments = filteredTournaments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Paper sx={{ p: 4, borderRadius: 4, bgcolor: "rgba(0,0,0,0.7)", textAlign: "center" }}>
        <Typography>Ładowanie turniejów...</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Nagłówek */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: "#fff" }}>
          Zarządzanie turniejami
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Szukaj turnieju..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              bgcolor: "rgba(255,255,255,0.1)",
              borderRadius: 2,
              input: { color: "#fff" },
              "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "rgba(255,255,255,0.3)" } },
            }}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: "#fff", mr: 1 }} /> }}
          />

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setOpenDialog(true);
            }}
            sx={{ bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" } }}
          >
            Dodaj turniej
          </Button>
        </Box>
      </Box>

      {/* Komunikaty */}
      {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
      {dialogSuccess && <Alert severity="success" sx={{ mb: 2 }}>{dialogSuccess}</Alert>}

      {/* Tabela turniejów */}
      <TableContainer component={Paper} sx={{ bgcolor: "rgba(0,0,0,0.7)", borderRadius: 4 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "rgba(255,106,0,0.1)" }}>
              <TableCell sx={{ color: "#FF6A00", fontWeight: 700 }}>Nazwa</TableCell>
              <TableCell sx={{ color: "#FF6A00", fontWeight: 700 }}>Dyscyplina</TableCell>
              <TableCell sx={{ color: "#FF6A00", fontWeight: 700 }}>Data</TableCell>
              <TableCell sx={{ color: "#FF6A00", fontWeight: 700 }}>Drużyny</TableCell>
              <TableCell sx={{ color: "#FF6A00", fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ color: "#FF6A00", fontWeight: 700 }} align="center">Akcje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTournaments.map((tournament) => {
              const status = getStatusLabel(tournament.status);
              return (
                <TableRow key={tournament.id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>{tournament.name}</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.8)" }}>{tournament.discipline}</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.8)" }}>
                    {tournament.startDate}
                    {tournament.endDate && ` - ${tournament.endDate}`}
                  </TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.8)" }}>
                    {tournament.registeredTeamsCount || 0}
                    {tournament.maxTeams ? ` / ${tournament.maxTeams}` : ""}
                  </TableCell>
                  <TableCell>
                    <Chip label={status.label} size="small" sx={{ bgcolor: `${status.color}20`, color: status.color }} />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                      <IconButton onClick={() => openDetailsDialog(tournament)} sx={{ color: "#FF6A00" }} title="Zarządzaj">
                        <GroupAddIcon />
                      </IconButton>
                      <IconButton onClick={() => openEditDialog(tournament)} sx={{ color: "#2196f3" }} title="Edytuj">
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          setTournamentToDelete(tournament.id);
                          setConfirmDeleteOpen(true);
                        }}
                        sx={{ color: "#ff6b6b" }}
                        title="Usuń"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginacja */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredTournaments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ color: "#fff", "& .MuiTablePagination-selectIcon": { color: "#fff" } }}
        />
      </Box>

      {/* Dialog dodawania/edycji turnieju */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: "rgba(0,0,0,0.9)", color: "#fff", borderRadius: 4 } }}>
        <DialogTitle>{selectedTournament ? "Edytuj turniej" : "Dodaj turniej"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Nazwa turnieju"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              InputLabelProps={{ style: { color: "#ccc" } }}
              sx={{ input: { color: "#fff" } }}
            />
            <Autocomplete
              options={disciplines}
              value={formData.discipline || null}
              onChange={(_event, newValue) => setFormData({ ...formData, discipline: newValue || "" })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Dyscyplina"
                  fullWidth
                  InputLabelProps={{ style: { color: "#ccc" } }}
                  sx={{ input: { color: "#fff" } }}
                />
              )}
            />
            <TextField
              label="Data rozpoczęcia"
              type="date"
              fullWidth
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              InputLabelProps={{ shrink: true, style: { color: "#ccc" } }}
              sx={{ input: { color: "#fff" } }}
            />
            <TextField
              label="Data zakończenia (opcjonalna)"
              type="date"
              fullWidth
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              InputLabelProps={{ shrink: true, style: { color: "#ccc" } }}
              sx={{ input: { color: "#fff" } }}
            />
            <TextField
              label="Lokalizacja (opcjonalna)"
              fullWidth
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              InputLabelProps={{ style: { color: "#ccc" } }}
              sx={{ input: { color: "#fff" } }}
            />
            <TextField
              label="Maksymalna liczba drużyn (opcjonalna)"
              type="number"
              fullWidth
              value={formData.maxTeams}
              onChange={(e) => setFormData({ ...formData, maxTeams: e.target.value })}
              InputLabelProps={{ style: { color: "#ccc" } }}
              sx={{ input: { color: "#fff" } }}
            />
            <TextField
              label="Opis (opcjonalny)"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              InputLabelProps={{ style: { color: "#ccc" } }}
              sx={{ textarea: { color: "#fff" } }}
            />
            <FormControl fullWidth>
              <InputLabel sx={{ color: "#ccc" }}>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Tournament["status"] })}
                label="Status"
                sx={{ color: "#fff" }}
              >
                <MenuItem value="planned">Planowany</MenuItem>
                <MenuItem value="ongoing">Trwający</MenuItem>
                <MenuItem value="finished">Zakończony</MenuItem>
                <MenuItem value="archived">Archiwalny</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: "#ccc" }}>Anuluj</Button>
          <Button onClick={handleSaveTournament} variant="contained" sx={{ bgcolor: "#FF6A00" }}>
            {selectedTournament ? "Zapisz" : "Dodaj"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog zarządzania turniejem (szczegóły) */}
      <Dialog open={!!selectedTournamentForDetails} onClose={() => setSelectedTournamentForDetails(null)} maxWidth="lg" fullWidth
        PaperProps={{ sx: { bgcolor: "rgba(0,0,0,0.9)", color: "#fff", borderRadius: 4 } }}>
        <DialogTitle>
          Zarządzanie turniejem: {selectedTournamentForDetails?.name}
          <IconButton sx={{ position: "absolute", right: 8, top: 8, color: "#ccc" }} onClick={() => setSelectedTournamentForDetails(null)}>
            ✕
          </IconButton>
        </DialogTitle>
        <DialogContent>

          {dialogManageError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {dialogManageError}
            </Alert>
          )}
          {dialogManageSuccess && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                  {dialogManageSuccess}
              </Alert>
          )}

          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)", mb: 2 }}>
            <Tab label="Drużyny" sx={{ color: "#fff" }} />
            <Tab label="Drabinka" sx={{ color: "#fff" }} />
            <Tab label="Wyniki" sx={{ color: "#fff" }} />
          </Tabs>

          {/* Zakładka: Drużyny */}
          {tabValue === 0 && (
            <>
              <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}>
                Drużyny zgłoszone do turnieju ({registeredTeams.length})
              </Typography>
              {teamsLoading ? (
                <Typography>Ładowanie...</Typography>
              ) : registeredTeams.length === 0 ? (
                <Typography sx={{ py: 2 }}>Brak zgłoszonych drużyn.</Typography>
              ) : (
                <List>
                  {registeredTeams.map((team) => (
                    <ListItem key={team.id} sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 1, borderRadius: 2 }}>
                      <ListItemText
                        primary={<Typography sx={{ color: "#fff" }}>{team.name}</Typography>}
                        secondary={`Kapitan: ${team.captainName} • Członków: ${team.membersCount}`}
                      />
                      <IconButton edge="end" onClick={() => handleRemoveTeamFromTournament(team.id)} sx={{ color: "#ff6b6b" }}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              )}

              <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.7)", mt: 3, mb: 1 }}>
                Dostępne drużyny w dyscyplinie {selectedTournamentForDetails?.discipline} ({availableTeams.length})
              </Typography>
              {teamsLoading ? (
                <Typography>Ładowanie...</Typography>
              ) : availableTeams.length === 0 ? (
                <Typography sx={{ py: 2 }}>Brak dostępnych drużyn w tej dyscyplinie.</Typography>
              ) : (
                <List>
                  {availableTeams.map((team) => (
                    <ListItem key={team.id} sx={{ bgcolor: "rgba(255,255,255,0.05)", mb: 1, borderRadius: 2 }}>
                      <ListItemText
                        primary={<Typography sx={{ color: "#fff" }}>{team.name}</Typography>}
                        secondary={`Kapitan: ${team.captainName} • Członków: ${team.membersCount}`}
                      />
                      <IconButton edge="end" onClick={() => handleAddTeamToTournament(team.id)} sx={{ color: "#4caf50" }}>
                        <AddIcon />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}

          {/* Zakładka: Drabinka */}
          {tabValue === 1 && (
            <Box>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  onClick={handleGenerateBracket}
                  disabled={generating || bracket.length > 0}
                  startIcon={generating ? <CircularProgress size={20} /> : <EmojiEventsIcon />}
                  sx={{ bgcolor: "#FF6A00" }}
                >
                  {generating ? "Generowanie..." : "Generuj drabinkę"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setRandomize(!randomize)}
                  disabled={bracket.length > 0}
                  sx={{ color: randomize ? "#FF6A00" : "#fff", borderColor: "#FF6A00" }}
                >
                  Losuj pary: {randomize ? "TAK" : "NIE"}
                </Button>
                <TextField
                  type="number"
                  label="Liczba miejsc"
                  value={numberOfCourts}
                  disabled={bracket.length > 0}
                  onChange={(e) => setNumberOfCourts(Math.max(1, parseInt(e.target.value) || 1))}
                  size="small"
                  sx={{
                      width: 120,
                      "& .MuiOutlinedInput-root": {
                          color: "#fff",
                          "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                      },
                      "& .MuiInputLabel-root": { color: "#ccc" }
                  }}
                  InputLabelProps={{ shrink: true }}
              />
              </Box>

              {bracketLoading && <Typography sx={{ textAlign: "center", py: 4 }}>Ładowanie drabinki...</Typography>}

              {!bracketLoading && bracket.length === 0 && !generating && (
                <Paper sx={{ p: 4, textAlign: "center", bgcolor: "rgba(0,0,0,0.5)" }}>
                  <Typography>Drabinka nie została jeszcze wygenerowana. Kliknij przycisk powyżej.</Typography>
                </Paper>
              )}
              

              {bracket.length > 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, overflowX: "auto", py: 2 }}>
                  {Array.from(new Set(bracket.map(m => m.roundNumber))).sort((a, b) => a - b).map(round => {
                      const roundMatches = bracket.filter(m => m.roundNumber === round).sort((a, b) => a.matchOrder - b.matchOrder);
                      
                      return (
                          <Box key={round} sx={{ width: "100%" }}>
                              <Typography variant="h6" sx={{ textAlign: "center", mb: 1, color: "#FF6A00" }}>
                                  Runda {round}
                              </Typography>
                              <Box sx={{ display: "flex", justifyContent: "center", gap: 3, flexWrap: "wrap" }}>
                                  {roundMatches.map((match) => {
                                      const isLocked = isMatchLocked(match, bracket);
                                      
                                      return (
                                          <Paper key={match.id} sx={{ p: 2, minWidth: 280, textAlign: "center", bgcolor: "rgba(0,0,0,0.6)", position: "relative", opacity: isLocked ? 0.7 : 1 }}>
                                          {/* Numer meczu */}
                                          <Typography variant="caption" sx={{ position: "absolute", top: 4, left: 8, color: "#FF6A00", fontWeight: "bold" }}>
                                              Mecz #{match.matchNumber}
                                          </Typography>

                                          {/* Boisko */}
                                          {match.courtNumber && (
                                              <Typography 
                                                  variant="caption" 
                                                  sx={{ 
                                                      position: "absolute", 
                                                      top: 4, 
                                                      left: 80, 
                                                      color: "#FF6A00",
                                                      fontWeight: "bold",
                                                      fontSize: "0.7rem",
                                                      bgcolor: "rgba(255,106,0,0.2)",
                                                      px: 0.8,
                                                      borderRadius: 1
                                                  }}
                                              >
                                                  Boisko {match.courtNumber}
                                              </Typography>
                                          )}

                                          <Typography 
                                              variant="caption" 
                                              sx={{ 
                                                  position: "absolute", 
                                                  top: 4, 
                                                  right: 8, 
                                                  color: match.scheduledTime ? "#4caf50" : "rgba(255,255,255,0.5)",
                                                  fontWeight: match.scheduledTime ? "bold" : "normal",
                                                  fontSize: "0.7rem"
                                              }}
                                          >
                                              {formatMatchDateTime(match.scheduledTime)}
                                          </Typography>
                                          
                                          {/* Przycisk edycji wyniku */}
                                          <IconButton
                                              size="small"
                                              onClick={() => handleEditScore(match)}
                                              disabled={isLocked}
                                              sx={{
                                                  position: "absolute",
                                                  bottom: 4,
                                                  right: 8,
                                                  color: "#FF6A00",
                                                  bgcolor: "rgba(0,0,0,0.5)",
                                              }}
                                          >
                                              <EditIcon fontSize="small" />
                                          </IconButton>
                                          
                                          <Box sx={{ mt: 2, mb: 1 }}>                                             
                                              <Typography sx={{ fontWeight: 500 }}>
                                                  {getTeamDisplayName(match, 'A', bracket)}
                                              </Typography>
                                              <Typography variant="h6" sx={{ my: 1 }}>vs</Typography>
                                              <Typography sx={{ fontWeight: 500 }}>
                                                  {getTeamDisplayName(match, 'B', bracket)}
                                              </Typography>
                                              
                                              {match.result && (
                                                  <Typography sx={{ color: "#4caf50", mt: 1, fontWeight: "bold" }}>
                                                      Wynik: {match.result}
                                                  </Typography>
                                              )}
                                              
                                              {match.notes && (
                                                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", mt: 0.5, display: "block" }}>
                                                      📝 {match.notes.length > 30 ? match.notes.substring(0, 30) + "..." : match.notes}
                                                  </Typography>
                                              )}
                                              
                                              {match.status === "pending" && match.teamA && match.teamB && !match.result && !isLocked && (
                                                  <Button
                                                      size="small"
                                                      variant="outlined"
                                                      onClick={() => handleEditScore(match)}
                                                      sx={{ mt: 1, color: "#FF6A00" }}
                                                  >
                                                      Wprowadź wynik
                                                  </Button>
                                              )}
                                              
                                              {isLocked && (
                                                  <Chip label="Zablokowany (awans)" size="small" sx={{ mt: 1, bgcolor: "#ff9800", color: "#fff" }} />
                                              )}
                                              
                                              {match.winnerId && !isLocked && (
                                                  <Chip label="Rozegrany" size="small" sx={{ mt: 1, bgcolor: "#4caf50", color: "#fff" }} />
                                              )}
                                          </Box>
                                      </Paper>
                                      );
                                  })}
                              </Box>
                          </Box>
                      );
                  })}
              </Box>
          )}
            </Box>
          )}

          {/* Zakładka: Wyniki */}
          {tabValue === 2 && (
          <Box>
              {bracketLoading && <Typography>Ładowanie...</Typography>}
              {!bracketLoading && bracket.length === 0 && <Typography>Brak wygenerowanej drabinki.</Typography>}
              {bracket.filter(m => m.teamA && m.teamB).map(match => {
                  const isLocked = isMatchLocked(match, bracket);
                  
                  return (
                      <Paper key={match.id} sx={{ p: 2, mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: isLocked ? 0.7 : 1 }}>
                          <Box>
                              <Typography>
                                  Mecz #{match.matchNumber}: {match.teamA!.name} vs {match.teamB!.name}
                              </Typography>
                              {match.result && (
                                  <Typography variant="caption" sx={{ color: "#4caf50" }}>
                                      Wynik: {match.result}
                                  </Typography>
                              )}
                              {match.notes && (
                                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", display: "block" }}>
                                      📝 {match.notes}
                                  </Typography>
                              )}
                              {isLocked && (
                                  <Chip label="Zablokowany (awans)" size="small" sx={{ mt: 1, bgcolor: "#ff9800", color: "#fff" }} />
                              )}
                          </Box>
                          <IconButton
                              onClick={() => handleEditScore(match)}
                              disabled={isLocked}
                              sx={{ color: "#FF6A00" }}
                              title={isLocked ? "Mecz zablokowany – drużyna awansowała dalej" : "Edytuj wynik"}
                          >
                              <EditIcon />
                          </IconButton>
                      </Paper>
                  );
              })}
          </Box>
      )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTournamentForDetails(null)} sx={{ color: "#ccc" }}>Zamknij</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog wprowadzania wyniku */}
      <Dialog 
        open={scoreDialogOpen} 
        onClose={handleCloseScoreDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { bgcolor: "rgba(0,0,0,0.9)", color: "#fff", borderRadius: 4 } }}>
        <DialogTitle>Wprowadź wynik</DialogTitle>
        <DialogContent>

              {drawError && (
                <Alert 
                    severity="error" 
                    sx={{ 
                        mb: 2, 
                        borderRadius: 2,
                        bgcolor: "rgba(244,67,54,0.15)",
                        color: "#f44336"
                    }}
                >
                    {drawError}
                </Alert>
            )}

            <Typography sx={{ mb: 2 }}>
                {selectedMatch?.teamA?.name} vs {selectedMatch?.teamB?.name}
            </Typography>

            {/* Informacja o boisku */}
            {selectedMatch?.courtNumber && (
                <Typography sx={{ textAlign: "center", mb: 2, color: "#FF6A00" }}>
                    Boisko {selectedMatch.courtNumber}
                </Typography>
            )}

            <TextField
              type="datetime-local"
              label="Data i godzina meczu"
              value={selectedMatch?.scheduledTime ? selectedMatch.scheduledTime.slice(0, 16) : ""}
              onChange={(e) => {
                  if (selectedMatch) {
                      const updatedMatch = { ...selectedMatch, scheduledTime: e.target.value };
                      setSelectedMatch(updatedMatch);
                  }
              }}
              fullWidth
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
          />
            
            <TextField
                fullWidth
                label="Wynik (np. 4:3)"
                value={score}
                onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^[\d:]*$/.test(value)) {
                        setScore(value);
                        if (drawError) setDrawError("");
                    }
                }}
                placeholder="np. 4:3"
                inputProps={{ inputMode: "numeric", pattern: "[0-9:]*" }}
                sx={{ mb: 2 }}
                InputLabelProps={{ style: { color: "#ccc" } }}
                autoFocus
            />
            
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", display: "block", mb: 2 }}>
                Format: liczba:liczba (np. 3:1). Większa liczba wygrywa.
            </Typography>
            
            {/* Checkbox dla notatek */}
            <FormControlLabel
                control={
                    <Checkbox
                        checked={showNotes}
                        onChange={(e) => setShowNotes(e.target.checked)}
                        sx={{ color: "#FF6A00", "&.Mui-checked": { color: "#FF6A00" } }}
                    />
                }
                label="Notes"
                sx={{ mb: 2 }}
            />
            
            {/* Rozwijane pole tekstowe */}
            {showNotes && (
                <TextField
                    fullWidth
                    label="Przebieg meczu"
                    multiline
                    rows={4}
                    value={matchNotes}
                    onChange={(e) => setMatchNotes(e.target.value)}
                    placeholder=""
                    InputLabelProps={{ style: { color: "#ccc" } }}
                    sx={{
                        mb: 2,
                        textarea: { color: "#fff" },
                        "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                        }
                    }}
                />
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={handleCloseScoreDialog} sx={{ color: "#ccc" }}>Anuluj</Button>
            <Button onClick={handleSaveScore} variant="contained" sx={{ bgcolor: "#FF6A00" }}>Zapisz</Button>
        </DialogActions>
    </Dialog>

      {/* Dialog potwierdzenia usunięcia turnieju */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}
        PaperProps={{ sx: { bgcolor: "rgba(0,0,0,0.9)", color: "#fff", borderRadius: 4 } }}>
        <DialogTitle>Usuń turniej</DialogTitle>
        <DialogContent>
          <Typography>Czy na pewno chcesz usunąć ten turniej?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} sx={{ color: "#ccc" }}>Anuluj</Button>
          <Button color="error" variant="contained" onClick={handleDeleteTournament}>Usuń</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentsManagement;