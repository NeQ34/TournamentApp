// src/components/admin/TournamentsManagement.tsx
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useEffect, useState, useRef } from "react";
import ManualBracket from "./ManualBracket";
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
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  GroupAdd as GroupAddIcon,
  EmojiEvents as EmojiEventsIcon,
} from "@mui/icons-material";
import autoTable from "jspdf-autotable";
import { getAppSettings, formatAppDate } from "../../utils/appSettings";

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
  const [rowsPerPage, setRowsPerPage] = useState(() => getAppSettings().rowsPerPage);
  useEffect(() => {
    const interval = setInterval(() => {
      setRowsPerPage(getAppSettings().rowsPerPage);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const [editingTimeMatch, setEditingTimeMatch] = useState<Match | null>(null);
  const [tempTime, setTempTime] = useState("");
  const getSavedAppSettings = () => {
    try {
      const saved = localStorage.getItem("app_settings");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const savedSettings = getSavedAppSettings();

  const [numberOfCourts, setNumberOfCourts] = useState(savedSettings?.defaultCourts || 1);
  const [startHour, setStartHour] = useState(savedSettings?.defaultStartHour || 10);
  const [matchDuration, setMatchDuration] = useState(savedSettings?.defaultMatchDuration || 60);
  const [breakBetweenMatches, setBreakBetweenMatches] = useState(savedSettings?.defaultBreakBetweenMatches || 15);
  const appSettings = getAppSettings();
  const tableSize = appSettings.compactTables ? "small" : "medium";

  // Formularz
  const [formData, setFormData] = useState({
    name: "",
    discipline: "",
    startDate: "",
    endDate: "",
    location: "",
    description: "",
    status: "auto" as any,
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
  const [extraTimeScore, setExtraTimeScore] = useState("");
  const [penaltyScore, setPenaltyScore] = useState("");
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [dialogManageError, setDialogManageError] = useState("");
  const [dialogManageSuccess, setDialogManageSuccess] = useState("");
  const [drawError, setDrawError] = useState("");
  const [scoreDialogError, setScoreDialogError] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [matchNotes, setMatchNotes] = useState("");
  const [setScores, setSetScores] = useState<string[]>([]);
  const bracketContainerRef = useRef<HTMLDivElement>(null);
  const [bracketType, setBracketType] = useState<"elimination" | "swiss" | "manual">("elimination");
  const [swissRounds, setSwissRounds] = useState(5);
  const [currentSwissRound, setCurrentSwissRound] = useState(1);
  const [swissStandings, setSwissStandings] = useState<any[]>([]);
  const [swissPairings, setSwissPairings] = useState<any[]>([]);
  const [swissLoading, setSwissLoading] = useState(false);
  const [swissInitialized, setSwissInitialized] = useState(false);
  const [swissScoreDialogOpen, setSwissScoreDialogOpen] = useState(false);
  const [selectedSwissPairing, setSelectedSwissPairing] = useState<any>(null);
  const [swissScoreA, setSwissScoreA] = useState(0);
  const [swissScoreB, setSwissScoreB] = useState(0);
  const [swissGeneratingNext, setSwissGeneratingNext] = useState(false);

  // Filtrowanie
  const filterTournaments = (list: Tournament[]) => {
    if (!searchTerm) return list;
    return list.filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const getScorePlaceholder = (discipline?: string) => {
      switch (discipline?.toLowerCase()) {
          case "siatkówka":
              return "np. 3:1";
          case "szachy":
              return "np. 1:0";
          case "tenis":
              return "np. 2:1";
          default:
              return "np. 4:3";
      }
  };

  type ScoreConfig = {
    label: string;
    placeholder: string;
    helperText: string;
    pattern: RegExp;
    detailsLabel?: string;
    detailsPlaceholder?: string;
  };

  const normalizeDiscipline = (value?: string) =>
    value?.toLowerCase().trim() || "";

  const getScoreConfig = (discipline?: string): ScoreConfig => {
    const d = normalizeDiscipline(discipline);

    if (d === "szachy") {
      return {
        label: "Wynik partii",
        placeholder: "np. 1:0",
        helperText: "Dozwolone: 1:0 albo 0:1. Remis nie jest dozwolony w turnieju pucharowym.",
        pattern: /^(1:0|0:1)$/,
        detailsLabel: "Opis partii",
        detailsPlaceholder: "np. zwycięstwo białych, walkower, czas przeciwnika",
      };
    }

    if (d === "siatkówka") {
      return {
        label: "Wynik w setach",
        placeholder: "np. 3:1",
        helperText: "Dozwolone: 3:0, 3:1, 3:2, 0:3, 1:3, 2:3.",
        pattern: /^(3:0|3:1|3:2|0:3|1:3|2:3)$/,
        detailsLabel: "Wyniki setów",
        detailsPlaceholder: "np. 25:20, 22:25, 25:18, 25:19",
      };
    }

    if (d === "tenis ziemny" || d === "tenis stołowy") {
      return {
        label: "Wynik w setach",
        placeholder: "np. 2:1",
        helperText: "Dozwolone: 2:0, 2:1, 0:2, 1:2.",
        pattern: /^(2:0|2:1|0:2|1:2)$/,
        detailsLabel: "Wyniki setów",
        detailsPlaceholder: "np. 6:4, 3:6, 7:5",
      };
    }

    return {
      label: "Wynik meczu w czasie podstawowym",
      placeholder: "np. 4:3",
      helperText: "Format: liczba:liczba, np. 3:1. Remis nie jest dozwolony w turnieju pucharowym.",
      pattern: /^\d+:\d+$/,
      detailsLabel: "Dodatkowe informacje",
      detailsPlaceholder: "np. dogrywka, karne, przebieg meczu",
    };
  };

  const isValidScore = (score: string, discipline?: string) => {
    return getScoreConfig(discipline).pattern.test(score);
  };

  const supportsExtraTime = (discipline?: string) => {
    const d = normalizeDiscipline(discipline);
    return d === "piłka nożna" || d === "piłka wodna" || d === "hokej";
  };

  const getScoreHelperText = (discipline?: string) => {
    if (supportsExtraTime(discipline)) {
      return "Wpisz wynik czasu podstawowego. Jeśli będzie remis, automatycznie pojawi się pole dogrywki, a potem rzutów karnych.";
    }

    return getScoreConfig(discipline).helperText;
  };

  const isDrawScore = (value: string) => {
    const [a, b] = value.split(":").map(Number);
    return !Number.isNaN(a) && !Number.isNaN(b) && a === b;
  };

  const isSetDiscipline = (discipline?: string) => {
    const d = normalizeDiscipline(discipline);
    return d === "siatkówka" || d === "tenis ziemny" || d === "tenis stołowy";
  };

  const getNumberOfSetsFromScore = (value: string) => {
    if (!/^\d+:\d+$/.test(value)) return 0;

    const [a, b] = value.split(":").map(Number);
    return a + b;
  };

  const validateSetScoresConsistency = (
    mainScore: string,
    setScores: string[],
    teamAName?: string,
    teamBName?: string
  ) => {
    if (!/^\d+:\d+$/.test(mainScore)) return "Nieprawidłowy wynik główny.";

    const [expectedA, expectedB] = mainScore.split(":").map(Number);

    const filledSets = setScores.filter(s => s.trim() !== "");

    if (filledSets.length !== expectedA + expectedB) {
      return `Wpisz dokładnie ${expectedA + expectedB} wyników setów.`;
    }

    let wonByA = 0;
    let wonByB = 0;

    for (let i = 0; i < filledSets.length; i++) {
      const set = filledSets[i];

      if (!/^\d+:\d+$/.test(set)) {
        return `Set ${i + 1} ma nieprawidłowy format. Użyj np. 25:20.`;
      }

      const [a, b] = set.split(":").map(Number);

      if (a === b) {
        return `Set ${i + 1} nie może zakończyć się remisem.`;
      }

      if (a > b) wonByA++;
      if (b > a) wonByB++;
    }

    if (wonByA !== expectedA || wonByB !== expectedB) {
      return `Wyniki setów nie zgadzają się z wynikiem głównym. `;
    }

    return "";
  };

  const getWinnerFromScore = (
    value: string,
    teamAId?: number,
    teamBId?: number
  ) => {
    const [a, b] = value.split(":").map(Number);

    if (a > b) return teamAId || null;
    if (b > a) return teamBId || null;

    return null;
  };

  const getDisplayResult = (
    result: string | null,
    discipline?: string
  ) => {
    if (!result) {
      return { main: "", details: "" };
    }

    const parts = result.split(",").map(p => p.trim());
    const base = parts[0];

    const extra = parts.find(p => p.startsWith("dogr."));
    const penalties = parts.find(p => p.startsWith("karne"));

    if (penalties) {
      return {
        main: penalties.replace("karne ", "") + " po karnych",
        details: `czas podstawowy: ${base}${extra ? `, dogrywka: ${extra.replace("dogr. ", "")}` : ""}`,
      };
    }

    if (extra) {
      return {
        main: extra.replace("dogr. ", "") + " po dogrywce",
        details: `czas podstawowy: ${base}`,
      };
    }

    if (isSetDiscipline(discipline)) {
      return {
        main: base,
        details: "",
      };
    }

    return {
      main: base + " w czasie podstawowym",
      details: "",
    };
  };

  const initializeSwiss = async () => {
    if (!selectedTournamentForDetails) return;
    setSwissLoading(true);
    try {
        const response = await fetch(
            `http://localhost:8080/api/admin/tournaments/${selectedTournamentForDetails.id}/swiss/initialize?numberOfRounds=${swissRounds}&startHour=${startHour}`,
            { 
                method: "POST", 
                headers: { 
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json"
                } 
            }
        );
        if (response.ok) {
            setSwissInitialized(true);
            await fetchSwissStandings();
            await fetchSwissPairings(1);
            setDialogSuccess("System szwajcarski został zainicjalizowany.");
        } else {
            const error = await response.json();
            setDialogError(error.message || "Błąd inicjalizacji systemu szwajcarskiego.");
        }
    } catch (error) {
        console.error("Błąd inicjalizacji:", error);
        setDialogError("Nie udało się połączyć z serwerem.");
    } finally {
        setSwissLoading(false);
    }
  };

  const handleGenerateNextSwissRound = async () => {
    if (!selectedTournamentForDetails) return;
    setSwissGeneratingNext(true);
    try {
        const response = await fetch(
            `http://localhost:8080/api/admin/tournaments/${selectedTournamentForDetails.id}/swiss/generate-next-round`,
            { 
                method: "POST", 
                headers: { 
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json"
                } 
            }
        );
        if (response.ok) {
            const nextRound = currentSwissRound + 1;
            setCurrentSwissRound(nextRound);
            await fetchSwissPairings(nextRound);
            await fetchSwissStandings();
            setDialogSuccess(`Wygenerowano rundę ${nextRound}.`);
        } else {
            const error = await response.json();
            setDialogError(error.message || "Błąd generowania rundy.");
        }
    } catch (error) {
        console.error("Błąd:", error);
        setDialogError("Nie udało się połączyć z serwerem.");
    } finally {
        setSwissGeneratingNext(false);
    }
  };

  const fetchSwissStandings = async () => {
    if (!selectedTournamentForDetails) return;
    try {
        const response = await fetch(
            `http://localhost:8080/api/admin/tournaments/${selectedTournamentForDetails.id}/swiss/standings`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        if (response.ok) {
            const data = await response.json();
            setSwissStandings(data);
        }
    } catch (error) {
        console.error("Błąd pobierania rankingu:", error);
    }
  };

  const fetchSwissPairings = async (roundNumber: number) => {
    if (!selectedTournamentForDetails) return;
    try {
        const response = await fetch(
            `http://localhost:8080/api/admin/tournaments/${selectedTournamentForDetails.id}/swiss/pairings/${roundNumber}`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        if (response.ok) {
            const data = await response.json();
            setSwissPairings(data);
        }
    } catch (error) {
        console.error("Błąd pobierania par:", error);
    }
  };

  const handleEditSwissScore = (pairing: any) => {
    setSelectedSwissPairing(pairing);
    // Jeśli mecz już ma wynik, wczytaj go
    if (pairing.result && pairing.result.includes(":")) {
        const [a, b] = pairing.result.split(":").map(Number);
        setSwissScoreA(a);
        setSwissScoreB(b);
    } else {
        setSwissScoreA(0);
        setSwissScoreB(0);
    }
    setSwissScoreDialogOpen(true);
  };

  const handleSaveSwissScore = async () => {
    if (!selectedSwissPairing) return;
    
    try {
        const response = await fetch(
            `http://localhost:8080/api/admin/tournaments/${selectedTournamentForDetails!.id}/swiss/pairings/${selectedSwissPairing.id}/result`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ 
                    scoreA: swissScoreA, 
                    scoreB: swissScoreB 
                }),
            }
        );
        
        if (response.ok) {
            // Po prostu odśwież wszystko
            await fetchSwissStandings();
            await fetchSwissPairings(currentSwissRound);
            
            // Zamknij dialog
            setSwissScoreDialogOpen(false);
            setSelectedSwissPairing(null);
            setSwissScoreA(0);
            setSwissScoreB(0);
            setDialogSuccess("Wynik został zapisany.");
            
            // Sprawdź czy pojawiły się nowe pary w kolejnej rundzie (opcjonalnie)
            // Możesz dodać małe opóźnienie i odświeżyć jeszcze raz
            setTimeout(async () => {
                await fetchSwissPairings(currentSwissRound);
                // Sprawdź czy są jakieś pary w następnej rundzie
                for (let i = currentSwissRound + 1; i <= swissRounds; i++) {
                    const nextRoundResponse = await fetch(
                        `http://localhost:8080/api/admin/tournaments/${selectedTournamentForDetails!.id}/swiss/pairings/${i}`,
                        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                    );
                    if (nextRoundResponse.ok) {
                        const nextRoundData = await nextRoundResponse.json();
                        if (nextRoundData.length > 0) {
                            setCurrentSwissRound(i);
                            setSwissPairings(nextRoundData);
                            setDialogSuccess(`Wynik zapisany. Wygenerowano rundę ${i}.`);
                            break;
                        }
                    }
                }
            }, 500);
        } else {
            const error = await response.json();
            setDialogError(error.message || "Błąd zapisu wyniku.");
        }
    } catch (error) {
        console.error("Błąd zapisu wyniku:", error);
        setDialogError("Nie udało się połączyć z serwerem.");
    }
  };

  const handleCloseSwissScoreDialog = () => {
    setSwissScoreDialogOpen(false);
    setSelectedSwissPairing(null);
    setSwissScoreA(0);
    setSwissScoreB(0);
  };

  const isCurrentRoundCompleted = () => {
    if (swissPairings.length === 0) return false;
    return swissPairings.every(pairing => pairing.result !== null);
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
          location: formData.location || savedSettings?.defaultLocation || null,
          description: formData.description || null,
          status: formData.status === "archived" ? "archived" : "auto",
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
    setDialogError("");
    setDialogManageError("");

    try {
      const params = new URLSearchParams({
        randomize: String(randomize),
        numberOfCourts: String(numberOfCourts),
        startHour: String(startHour),
        matchDuration: String(matchDuration),
        breakBetweenMatches: String(breakBetweenMatches),
      });

      const response = await fetch(
        `http://localhost:8080/api/admin/tournaments/${selectedTournamentForDetails.id}/generate-bracket?${params.toString()}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        await fetchBracket(selectedTournamentForDetails.id);
        setDialogManageSuccess("Drabinka została wygenerowana.");
      } else {
        const error = await response.json();
        setDialogManageError(error.message || "Błąd generowania drabinki.");
      }
    } catch (error) {
      console.error("Błąd:", error);
      setDialogManageError("Nie udało się połączyć z serwerem.");
    } finally {
      setGenerating(false);
    }
  };
  const handleSaveScore = async () => {
    if (!selectedMatch) return;

    setScoreDialogError("");
    setDrawError("");
    
    // Sprawdź czy chcemy zapisać tylko datę (bez wyniku)
    const hasResult = score.trim() !== "";

    // Nie można zapisać wyniku bez daty meczu
    if (hasResult && !selectedMatch.scheduledTime) {
        setScoreDialogError("Najpierw ustaw datę i godzinę meczu.");
        return;
    }

    // Walidacja tylko jeśli jest wynik
    if (hasResult) {
        const scoreConfig = getScoreConfig(selectedTournamentForDetails?.discipline);

        if (!isValidScore(score, selectedTournamentForDetails?.discipline)) {
          setScoreDialogError(scoreConfig.helperText);
          return;
        }

        if (isSetDiscipline(selectedTournamentForDetails?.discipline)) {
          const setError = validateSetScoresConsistency(
            score,
            setScores,
            selectedMatch.teamA?.name,
            selectedMatch.teamB?.name
          );

          if (setError) {
            setScoreDialogError(setError);
            return;
          }
        }
    }
    
    try {
        const tournament = tournaments.find(
            t => t.id === selectedTournamentForDetails?.id
        );

        if (selectedMatch.scheduledTime && tournament) {
            const matchDate = new Date(selectedMatch.scheduledTime);
            const startDate = new Date(tournament.startDate);

            // ustaw początek dnia
            startDate.setHours(0, 0, 0, 0);

            if (matchDate < startDate) {
                setDrawError("Data meczu nie może być wcześniejsza niż data rozpoczęcia turnieju.");
                return;
            }

            if (tournament.endDate) {
                const endDate = new Date(tournament.endDate);

                // koniec dnia
                endDate.setHours(23, 59, 59, 999);

                if (matchDate > endDate) {
                    setDrawError("Data meczu nie może być późniejsza niż data zakończenia turnieju.");
                    return;
                }
            }
        }

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
            let decidingScore = score;

            if (supportsExtraTime(selectedTournamentForDetails?.discipline) && isDrawScore(score)) {
                if (!extraTimeScore.trim()) {
                    setScoreDialogError("Wpisz wynik po dogrywce.");
                    return;
                }

                if (!/^\d+:\d+$/.test(extraTimeScore)) {
                    setScoreDialogError("Nieprawidłowy format dogrywki. Użyj np. 2:1.");
                    return;
                }

                decidingScore = extraTimeScore;

                if (isDrawScore(extraTimeScore)) {
                    if (!penaltyScore.trim()) {
                        setScoreDialogError("Wpisz wynik rzutów karnych.");
                        return;
                    }

                    if (!/^\d+:\d+$/.test(penaltyScore)) {
                        setScoreDialogError("Nieprawidłowy format rzutów karnych. Użyj np. 5:4.");
                        return;
                    }

                    if (isDrawScore(penaltyScore)) {
                        setScoreDialogError("Rzuty karne muszą wskazywać zwycięzcę.");
                        return;
                    }

                    decidingScore = penaltyScore;
                }
            }

            const winnerId = getWinnerFromScore(
                decidingScore,
                selectedMatch.teamA?.id,
                selectedMatch.teamB?.id
            );
            
            if (!winnerId) {
                setScoreDialogError("Nie można określić zwycięzcy. Najpierw rozstrzygnij wcześniejsze mecze.");
                return;
            }
            
            let finalResult = score;

            if (extraTimeScore.trim()) {
                finalResult += `, dogr. ${extraTimeScore}`;
            }

            if (penaltyScore.trim()) {
                finalResult += `, karne ${penaltyScore}`;
            }

            const requestBody: any = { result: finalResult, winnerId };

            if (isSetDiscipline(selectedTournamentForDetails?.discipline)) {
                requestBody.notes = setScores.filter(Boolean).join(", ");
            } else if (showNotes && matchNotes.trim()) {
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
      location: savedSettings?.defaultLocation || "",
      description: "",
      status: "auto",
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
      status: tournament.status === "archived" ? "archived" : "auto",
      maxTeams: tournament.maxTeams?.toString() || "",
    });
    setOpenDialog(true);
  };

  const openDetailsDialog = (tournament: Tournament) => {
    const currentSettings = getSavedAppSettings();

    setNumberOfCourts(currentSettings?.defaultCourts || 1);
    setStartHour(currentSettings?.defaultStartHour || 10);
    setMatchDuration(currentSettings?.defaultMatchDuration || 60);
    setBreakBetweenMatches(currentSettings?.defaultBreakBetweenMatches || 15);

    setSelectedTournamentForDetails(tournament);
    setTabValue(0);
    setBracketType("elimination");

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

  const removePolishChars = (text: string): string => {
    if (!text) return "";
    
    const polishChars: { [key: string]: string } = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
    };
    
    return text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, char => polishChars[char] || char);
  };

  const handleExportBracketToPDF = () => {
    if (!bracket.length) {
        setDialogManageError("Brak drabinki do wyeksportowania.");
        return;
    }
    
    const pdf = new jsPDF({
        orientation: "landscape", // landscape - więcej miejsca na szerokość
        unit: "mm",
        format: "a4",
    });
    
    // Pomocnicza funkcja do zamiany polskich znaków
    const removePolishChars = (text: string): string => {
        if (!text) return "";
        const polishChars: { [key: string]: string } = {
            'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
            'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
        };
        return text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, char => polishChars[char] || char);
    };
    
    // Pobierz liczbę drużyn
    const teamsCount = selectedTournamentForDetails?.registeredTeamsCount || 0;
    
    // ========== NAGŁÓWEK ==========
    pdf.setFontSize(18);
    pdf.setTextColor(255, 106, 0);
    pdf.setFont("helvetica", "bold");
    pdf.text(removePolishChars(selectedTournamentForDetails?.name || "DRABINKA TURNIEJU"), 148, 20, { align: "center" });
    
    pdf.setDrawColor(255, 106, 0);
    pdf.setLineWidth(0.5);
    pdf.line(15, 27, 282, 27);
    
    pdf.setFontSize(9);
    pdf.setTextColor(80, 80, 80);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Dyscyplina: ${removePolishChars(selectedTournamentForDetails?.discipline || "-")}`, 15, 38);
    pdf.text(`Data turnieju: ${selectedTournamentForDetails?.startDate || "-"}`, 15, 45);
    pdf.text(`Liczba druzyn: ${teamsCount}`, 15, 52);
    pdf.text(`Liczba meczow: ${bracket.length}`, 15, 59);
    pdf.text(`Wygenerowano: ${new Date().toLocaleString()}`, 15, 66);
    
    // ========== GRUPOWANIE MECZÓW ==========
    const groupedByRound = bracket.reduce((acc, match) => {
        if (!acc[match.roundNumber]) acc[match.roundNumber] = [];
        acc[match.roundNumber].push(match);
        return acc;
    }, {} as Record<number, Match[]>);
    
    let yOffset = 80;
    const roundNumbers = Object.keys(groupedByRound).map(Number).sort((a, b) => a - b);
    const totalRounds = roundNumbers.length;
    
    // ========== DLA KAŻDEJ RUNDY ==========
    for (const roundNum of roundNumbers) {
        const matches = groupedByRound[roundNum];
        
        if (yOffset > 180) {
            pdf.addPage();
            yOffset = 25;
        }
        
        // ========== TYTUŁ RUNDY ==========
        pdf.setFontSize(13);
        pdf.setTextColor(255, 106, 0);
        pdf.setFont("helvetica", "bold");
        
        let roundTitle = "";
        if (totalRounds === 1) roundTitle = "FINAŁ";
        else if (totalRounds === 2) {
            roundTitle = roundNum === 1 ? "PÓŁFINAŁ" : "FINAŁ";
        } else if (totalRounds === 3) {
            if (roundNum === 1) roundTitle = "ĆWIERĆFINAŁ";
            else if (roundNum === 2) roundTitle = "PÓŁFINAŁ";
            else roundTitle = "FINAŁ";
        } else if (totalRounds === 4) {
            if (roundNum === 1) roundTitle = "1/8 FINAŁU";
            else if (roundNum === 2) roundTitle = "ĆWIERĆFINAŁ";
            else if (roundNum === 3) roundTitle = "PÓŁFINAŁ";
            else roundTitle = "FINAŁ";
        } else {
            roundTitle = `RUNDA ${roundNum}`;
        }
        
        pdf.text(removePolishChars(roundTitle), 15, yOffset);
        yOffset += 7;
        
        // ========== TABELA MECZÓW ==========
        const tableHeaders = [["Mecz", "Druzyna A", "Druzyna B", "Wynik", "Data/Godzina", "Boisko"]];
        const tableData = matches.map((match, idx) => {
            // Format daty i godziny
            let dateTimeStr = "-";
            if (match.scheduledTime) {
                const date = new Date(match.scheduledTime);
                dateTimeStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            }
            
            let teamA = removePolishChars(match.teamA?.name || "---");
            let teamB = removePolishChars(match.teamB?.name || "---");
            
            // Dodaj wyróżnienie dla zwycięzców
            if (match.winnerId === match.teamA?.id) {
                teamA = `★ ${teamA}`;
            } else if (match.winnerId === match.teamB?.id) {
                teamB = `★ ${teamB}`;
            }
            
            return [
                `${match.matchNumber || idx + 1}`,
                teamA,
                teamB,
                match.result || "-",
                dateTimeStr,
                match.courtNumber ? `${match.courtNumber}` : "-",
            ];
        });
        
        autoTable(pdf, {
            startY: yOffset,
            head: tableHeaders,
            body: tableData,
            theme: "grid",
            styles: {
                fontSize: 9,
                cellPadding: 3,
                textColor: [255, 255, 255],
                lineColor: [255, 106, 0],
                lineWidth: 0.2,
            },
            headStyles: {
                fillColor: [255, 106, 0],
                textColor: [0, 0, 0],
                fontStyle: "bold",
                fontSize: 10,
                halign: "center",
            },
            bodyStyles: {
                fillColor: [30, 30, 35],
            },
            alternateRowStyles: {
                fillColor: [45, 45, 50],
            },
            columnStyles: {
                0: { cellWidth: 20, halign: "center" },
                1: { cellWidth: 75 },
                2: { cellWidth: 75 },
                3: { cellWidth: 25, halign: "center" },
                4: { cellWidth: 35, halign: "center" },
                5: { cellWidth: 18, halign: "center" },
            },
            margin: { left: 15, right: 15 },
        });
        
        yOffset = (pdf as any).lastAutoTable.finalY + 10;
        
        // Linia między rundami
        if (roundNum !== roundNumbers[roundNumbers.length - 1]) {
            pdf.setDrawColor(255, 106, 0, 0.3);
            pdf.setLineWidth(0.3);
            pdf.line(15, yOffset - 3, 282, yOffset - 3);
        }
    }
    
    // ========== STOPKA ==========
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`Strona ${i} z ${pageCount}`, 148, 195, { align: "center" });
    }
    
    // Zapisz plik
    const fileName = `drabinka_${removePolishChars(selectedTournamentForDetails?.name || "turniej").replace(/\s+/g, "_")}.pdf`;
    pdf.save(fileName);
    setDialogManageSuccess(`Drabinka została pobrana (${bracket.length} meczów, ${teamsCount} drużyn)`);
};


  const getRoundTitle = (roundNumber: number): string => {
    switch (roundNumber) {
        case 1: return "1/8 FINAŁU";
        case 2: return "ĆWIERĆFINAŁ";
        case 3: return "PÓŁFINAŁ";
        case 4: return "FINAŁ";
        default: return `RUNDA ${roundNumber}`;
    }
  };

  const handleCloseScoreDialog = () => {
    setScoreDialogOpen(false);
    setSelectedMatch(null);
    setScore("");
    setShowNotes(false);
    setMatchNotes("");
    setDrawError("");
    setDialogManageError("");
    setScoreDialogError("");
    setExtraTimeScore("");
    setPenaltyScore("");
    setSetScores([]);
  };

  const handleEditScore = (match: Match) => {
       setSelectedMatch(match);

       if (match.result) {
           const parts = match.result.split(",").map(p => p.trim());

           const baseScore = parts[0];

           const extra = parts.find(p => p.startsWith("dogr."));
           const penalties = parts.find(p => p.startsWith("karne"));

           setScore(baseScore);

           setExtraTimeScore(
               extra ? extra.replace("dogr. ", "") : ""
           );

           setPenaltyScore(
               penalties ? penalties.replace("karne ", "") : ""
           );
           setSetScores(
               match.notes
                   ? match.notes.split(",").map(s => s.trim())
                   : []
           );

           setMatchNotes(match.notes || "");
           setShowNotes(!!match.notes);
       } else {
           setScore("");
           setExtraTimeScore("");
           setPenaltyScore("");
           setSetScores([]);

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
  if (!getAppSettings().autoRefreshData) return;

  const interval = setInterval(() => {
    fetchTournaments();
  }, 10000);

  return () => clearInterval(interval);
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
        <Table size={tableSize}>
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
                    {formatAppDate(tournament.startDate)}
                    {tournament.endDate ? ` - ${formatAppDate(tournament.endDate)}` : ""}
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
                          if (getAppSettings().confirmDangerousActions) {
                            setTournamentToDelete(tournament.id);
                            setConfirmDeleteOpen(true);
                          } else {
                            setTournamentToDelete(tournament.id);
                            setTimeout(() => {
                              handleDeleteTournament();
                            }, 0);
                          }
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
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                label="Status"
                sx={{ color: "#fff" }}
              >
                <MenuItem value="auto">Automatyczny według daty</MenuItem>
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
                      {/* Wybór formatu rozgrywek */}
                      <FormControl sx={{ minWidth: 150 }} size="small">
                          <InputLabel sx={{ color: "#ccc" }}>Format</InputLabel>
                          <Select
                              value={bracketType}
                              onChange={(e) => setBracketType(e.target.value as "elimination" | "swiss" | "manual")}
                              label="Format"
                              sx={{ color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.3)" } }}
                          >
                              <MenuItem value="elimination">Pucharowy</MenuItem>
                              <MenuItem value="swiss">Szwajcarski</MenuItem>
                              <MenuItem value="manual">ręczny</MenuItem>
                          </Select>
                      </FormControl>

                      {/* Opcje dla systemu pucharowego */}
                      {bracketType === "elimination" && (
                          <>
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
                                  label="Liczba boisk"
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
                              <TextField
                                type="number"
                                label="Godzina startu"
                                value={startHour}
                                disabled={bracket.length > 0}
                                onChange={(e) => setStartHour(Number(e.target.value))}
                                size="small"
                                sx={{
                                  width: 140,
                                  "& .MuiOutlinedInput-root": {
                                    color: "#fff",
                                    "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                  },
                                  "& .MuiInputLabel-root": { color: "#ccc" },
                                }}
                                InputLabelProps={{ shrink: true }}
                              />

                              <TextField
                                type="number"
                                label="Czas meczu / min"
                                value={matchDuration}
                                disabled={bracket.length > 0}
                                onChange={(e) => setMatchDuration(Number(e.target.value))}
                                size="small"
                                sx={{
                                  width: 150,
                                  "& .MuiOutlinedInput-root": {
                                    color: "#fff",
                                    "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                  },
                                  "& .MuiInputLabel-root": { color: "#ccc" },
                                }}
                                InputLabelProps={{ shrink: true }}
                              />

                              <TextField
                                type="number"
                                label="Przerwa / min"
                                value={breakBetweenMatches}
                                disabled={bracket.length > 0}
                                onChange={(e) => setBreakBetweenMatches(Number(e.target.value))}
                                size="small"
                                sx={{
                                  width: 140,
                                  "& .MuiOutlinedInput-root": {
                                    color: "#fff",
                                    "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                  },
                                  "& .MuiInputLabel-root": { color: "#ccc" },
                                }}
                                InputLabelProps={{ shrink: true }}
                              />
                          </>
                      )}

                      {/* Opcje dla systemu szwajcarskiego */}
                      {bracketType === "swiss" && (
                          <>
                              <TextField
                                  type="number"
                                  label="Liczba rund"
                                  value={swissRounds}
                                  onChange={(e) => setSwissRounds(Math.max(1, parseInt(e.target.value) || 1))}
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
                              <Button
                                  variant="contained"
                                  onClick={initializeSwiss}
                                  disabled={swissInitialized}
                                  startIcon={swissLoading ? <CircularProgress size={20} /> : <EmojiEventsIcon />}
                                  sx={{ bgcolor: "#FF6A00" }}
                              >
                                  {swissLoading ? "Inicjalizowanie..." : "Inicjalizuj system szwajcarski"}
                              </Button>
                          </>
                      )}

                      {/* ===== TRYB RĘCZNY ===== */}
                      {bracketType === "manual" && selectedTournamentForDetails && (
                          <ManualBracket
                              tournamentId={selectedTournamentForDetails.id}
                              tournamentName={selectedTournamentForDetails.name}
                              discipline={selectedTournamentForDetails.discipline}
                              onSuccess={(msg) => {
                                  setDialogManageSuccess(msg);
                                  setTimeout(() => setDialogManageSuccess(""), 3000);
                              }}
                              onError={(msg) => {
                                  setDialogManageError(msg);
                                  setTimeout(() => setDialogManageError(""), 3000);
                              }}
                          />
                      )}
                  </Box>

                  {/* WIDOK DLA SYSTEMU PUCHAROWEGO */}
                  {/* ========== TRYB PUCHAROWY AUTOMATYCZNY ========== */}
                  {bracketType === "elimination" && (
                      <Box>
                          {bracketLoading && (
                              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                                  <CircularProgress sx={{ color: "#FF6A00" }} />
                              </Box>
                          )}

                          {!bracketLoading && bracket.length === 0 && !generating && (
                              <Paper sx={{ p: 4, textAlign: "center", bgcolor: "rgba(0,0,0,0.5)", borderRadius: 2 }}>
                                  <Typography>Drabinka nie została jeszcze wygenerowana. Kliknij przycisk "Generuj drabinkę".</Typography>
                              </Paper>
                          )}

                          {bracket.length > 0 && (
                              <Box>
                                  {/* Header z informacjami */}
                                  <Paper sx={{ p: 2, mb: 3, bgcolor: "rgba(0,0,0,0.5)", borderRadius: 2 }}>
                                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                                          <Typography sx={{ color: "#FF6A00", fontWeight: "bold" }}>
                                              Drabinka turnieju - system pucharowy
                                          </Typography>
                                          <Button
                                              size="small"
                                              variant="outlined"
                                              onClick={handleExportBracketToPDF}
                                              sx={{ color: "#FF6A00", borderColor: "#FF6A00" }}
                                          >
                                              Pobierz PDF
                                          </Button>
                                      </Box>
                                  </Paper>

                                  {/* Drabinka - KAFELKI jak w trybie ręcznym */}
                                  <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                      {(() => {
                                          const groupedByRound: Record<number, Match[]> = {};
                                          bracket.forEach((match: Match) => {
                                              if (!groupedByRound[match.roundNumber]) groupedByRound[match.roundNumber] = [];
                                              groupedByRound[match.roundNumber].push(match);
                                          });
                                          
                                          const roundNumbers = Object.keys(groupedByRound).map(Number).sort((a, b) => a - b);
                                          const totalRounds = roundNumbers.length;
                                          
                                          return roundNumbers.map((roundNum) => {
                                              const matches = groupedByRound[roundNum];
                                              
                                              let roundTitle = "";
                                              if (totalRounds === 1) roundTitle = "FINAŁ";
                                              else if (totalRounds === 2) {
                                                  roundTitle = roundNum === 1 ? "PÓŁFINAŁ" : "FINAŁ";
                                              } else if (totalRounds === 3) {
                                                  if (roundNum === 1) roundTitle = "ĆWIERĆFINAŁ";
                                                  else if (roundNum === 2) roundTitle = "PÓŁFINAŁ";
                                                  else roundTitle = "FINAŁ";
                                              } else if (totalRounds === 4) {
                                                  if (roundNum === 1) roundTitle = "1/8 FINAŁU";
                                                  else if (roundNum === 2) roundTitle = "ĆWIERĆFINAŁ";
                                                  else if (roundNum === 3) roundTitle = "PÓŁFINAŁ";
                                                  else roundTitle = "FINAŁ";
                                              } else {
                                                  roundTitle = `RUNDA ${roundNum}`;
                                              }
                                              
                                              return (
                                                  <Paper key={roundNum} sx={{ p: 2, bgcolor: "rgba(0,0,0,0.4)", borderRadius: 2 }}>
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
                                                          {roundTitle}
                                                      </Typography>
                                                      
                                                      {/* KAFELKI MECZÓW - POZIOMO */}
                                                      <Box sx={{ 
                                                          display: "flex", 
                                                          flexDirection: "row", 
                                                          flexWrap: "wrap", 
                                                          justifyContent: "center",
                                                          gap: 2 
                                                      }}>
                                                          {matches.map((match: Match) => (
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
                                                                  onClick={() => handleEditScore(match)}
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
                                                                              {match.teamA?.name || "BYE"}
                                                                          </Typography>
                                                                          <Typography variant="body2" sx={{ my: 0.5, color: "#FF6A00" }}>VS</Typography>
                                                                          <Typography sx={{ fontWeight: "bold", fontSize: "0.9rem", color: match.winnerId === match.teamB?.id ? "#FFD700" : "#fff" }}>
                                                                              {match.teamB?.name || "BYE"}
                                                                          </Typography>
                                                                      </Box>
                                                                      
                                                                      {match.scheduledTime && (
                                                                          <Typography variant="caption" sx={{ display: "block", textAlign: "center", color: "#4caf50" }}>
                                                                              {formatMatchDateTime(match.scheduledTime)}
                                                                          </Typography>
                                                                      )}
                                                                      
                                                                      {match.result && match.result !== "BYE" && (
                                                                          <Typography sx={{ color: "#4caf50", textAlign: "center", fontWeight: "bold", fontSize: "0.85rem", mt: 0.5 }}>
                                                                              Wynik: {match.result}
                                                                          </Typography>
                                                                      )}
                                                                      
                                                                      {match.result === "BYE" && (
                                                                          <Typography sx={{ color: "#FF6A00", textAlign: "center", fontSize: "0.7rem", mt: 0.5 }}>
                                                                              Wolny los - automatyczny awans
                                                                          </Typography>
                                                                      )}
                                                                  </CardContent>
                                                              </Card>
                                                          ))}
                                                      </Box>
                                                  </Paper>
                                              );
                                          });
                                      })()}
                                  </Box>
                              </Box>
                          )}
                      </Box>
                  )}

                  {/* WIDOK DLA SYSTEMU SZWAJCARSKIEGO */}
                  {bracketType === "swiss" && swissStandings.length > 0 && (
                      <Box>
                          {/* Ranking */}
                          <Typography variant="h6" sx={{ color: "#FF6A00", mt: 3, mb: 2 }}>Ranking</Typography>
                          <TableContainer component={Paper} sx={{ bgcolor: "rgba(0,0,0,0.7)", mb: 3, borderRadius: 2 }}>
                              <Table size="small">
                                  <TableHead>
                                      <TableRow sx={{ bgcolor: "rgba(255,106,0,0.2)" }}>
                                          <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>Miejsce</TableCell>
                                          <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>Drużyna</TableCell>
                                          <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>Punkty</TableCell>
                                          <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>W</TableCell>
                                          <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>R</TableCell>
                                          <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>P</TableCell>
                                      </TableRow>
                                  </TableHead>
                                  <TableBody>
                                      {swissStandings.map((standing, idx) => (
                                          <TableRow key={standing.id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                                              <TableCell sx={{ color: "#fff" }}>{idx + 1}</TableCell>
                                              <TableCell sx={{ color: "#fff", fontWeight: 500 }}>{standing.team?.name}</TableCell>
                                              <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>{standing.points}</TableCell>
                                              <TableCell sx={{ color: "#4caf50" }}>{standing.wins}</TableCell>
                                              <TableCell sx={{ color: "#ff9800" }}>{standing.draws}</TableCell>
                                              <TableCell sx={{ color: "#f44336" }}>{standing.losses}</TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </TableContainer>

                          {/* Przycisk do generowania następnej rundy */}
                          {currentSwissRound < swissRounds && isCurrentRoundCompleted() && (
                            <Button
                                variant="contained"
                                onClick={handleGenerateNextSwissRound}
                                disabled={swissGeneratingNext}
                                sx={{ bgcolor: "#FF6A00", ml: 2 }}
                            >
                                {swissGeneratingNext ? "Generowanie..." : "Generuj następną rundę"}
                            </Button>
                        )}

                          {/* Nawigacja po rundach */}
                          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                              {Array.from({ length: swissRounds }, (_, i) => i + 1).map(round => (
                                  <Chip
                                      key={round}
                                      label={`Runda ${round}`}
                                      onClick={() => {
                                          setCurrentSwissRound(round);
                                          fetchSwissPairings(round);
                                      }}
                                      sx={{
                                          bgcolor: currentSwissRound === round ? "#FF6A00" : "rgba(255,255,255,0.1)",
                                          color: currentSwissRound === round ? "#000" : "#fff",
                                          cursor: "pointer",
                                          "&:hover": { bgcolor: currentSwissRound === round ? "#FF6A00" : "rgba(255,255,255,0.2)" }
                                      }}
                                  />
                              ))}

                              <Dialog 
                              open={swissScoreDialogOpen} 
                              onClose={handleCloseSwissScoreDialog} 
                              maxWidth="sm" 
                              fullWidth
                              PaperProps={{ sx: { bgcolor: "rgba(0,0,0,0.9)", color: "#fff", borderRadius: 4 } }}
                          >
                              <DialogTitle>Wprowadź wynik</DialogTitle>
                              <DialogContent>
                                  <Typography sx={{ mb: 2, fontWeight: "bold", textAlign: "center" }}>
                                      {selectedSwissPairing?.teamA?.name} vs {selectedSwissPairing?.teamB?.name}
                                  </Typography>
                                  
                                  <Box sx={{ display: "flex", gap: 2, alignItems: "center", justifyContent: "center", mb: 2 }}>
                                      <TextField
                                          type="number"
                                          label={selectedSwissPairing?.teamA?.name}
                                          value={swissScoreA}
                                          onChange={(e) => setSwissScoreA(parseInt(e.target.value) || 0)}
                                          sx={{ 
                                              flex: 1,
                                              "& .MuiOutlinedInput-root": { color: "#fff" },
                                              "& .MuiInputLabel-root": { color: "#ccc" }
                                          }}
                                          InputLabelProps={{ shrink: true }}
                                          autoFocus
                                      />
                                      <Typography variant="h4" sx={{ color: "#FF6A00" }}>:</Typography>
                                      <TextField
                                          type="number"
                                          label={selectedSwissPairing?.teamB?.name}
                                          value={swissScoreB}
                                          onChange={(e) => setSwissScoreB(parseInt(e.target.value) || 0)}
                                          sx={{ 
                                              flex: 1,
                                              "& .MuiOutlinedInput-root": { color: "#fff" },
                                              "& .MuiInputLabel-root": { color: "#ccc" }
                                          }}
                                          InputLabelProps={{ shrink: true }}
                                      />
                                  </Box>
                                  
                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", display: "block", textAlign: "center" }}>
                                        Wprowadź liczbę punktów/ goli dla każdej drużyny.
                                        {selectedSwissPairing?.isDraw !== undefined && " Remis jest dozwolony."}
                                    </Typography>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={handleCloseSwissScoreDialog} sx={{ color: "#ccc" }}>
                                        Anuluj
                                    </Button>
                                    <Button 
                                        onClick={handleSaveSwissScore} 
                                        variant="contained" 
                                        sx={{ bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" } }}
                                    >
                                        Zapisz
                                    </Button>
                                </DialogActions>
                            </Dialog>
                          </Box>

                          {/* Pary w wybranej rundzie */}
                          <Typography variant="h6" sx={{ color: "#FF6A00", mb: 2 }}>Runda {currentSwissRound}</Typography>
                          <Grid container spacing={2}>
                              {swissPairings.length === 0 ? (
                                  <Grid item xs={12}>
                                      <Paper sx={{ p: 3, textAlign: "center", bgcolor: "rgba(0,0,0,0.5)" }}>
                                          <Typography>Brak par w tej rundzie lub runda jeszcze nie wygenerowana.</Typography>
                                      </Paper>
                                  </Grid>
                              ) : (
                                  swissPairings.map(pairing => (
                                      <Grid item xs={12} md={6} key={pairing.id}>
                                          <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.7)", borderRadius: 2, border: "1px solid rgba(255,106,0,0.2)" }}>
                                              <Typography sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                                                  {pairing.teamA?.name} vs {pairing.teamB?.name}
                                              </Typography>
                                              {pairing.result ? (
                                                  <>
                                                      <Typography sx={{ color: "#4caf50", mt: 1, fontWeight: "bold" }}>
                                                          Wynik: {pairing.result}
                                                      </Typography>
                                                      {pairing.winner && (
                                                          <Typography variant="caption" sx={{ color: "#FFD700", display: "block" }}>
                                                              Zwycięzca: {pairing.winner.name}
                                                          </Typography>
                                                      )}
                                                  </>
                                              ) : (
                                                  <Button
                                                      size="small"
                                                      variant="outlined"
                                                      onClick={() => handleEditSwissScore(pairing)}
                                                      sx={{ mt: 1, color: "#FF6A00", borderColor: "#FF6A00" }}
                                                  >
                                                      Wprowadź wynik
                                                  </Button>
                                              )}
                                          </Paper>
                                      </Grid>
                                  ))
                              )}
                          </Grid>
                      </Box>
                  )}

                  {/* Komunikat gdy system szwajcarski nie został zainicjalizowany */}
                  {bracketType === "swiss" && swissStandings.length === 0 && !swissLoading && (
                      <Paper sx={{ p: 4, textAlign: "center", bgcolor: "rgba(0,0,0,0.5)", mt: 2 }}>
                          <Typography>System szwajcarski nie został jeszcze zainicjalizowany. Ustaw liczbę rund i kliknij "Inicjalizuj".</Typography>
                      </Paper>
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

                              {match.result && (() => {
                                  const display = getDisplayResult(
                                    match.result,
                                    selectedTournamentForDetails?.discipline
                                  );

                                  return (
                                      <>
                                          <Typography
                                              variant="caption"
                                              sx={{
                                                  color: "#4caf50",
                                                  display: "block",
                                                  fontWeight: "bold"
                                              }}
                                          >
                                              Wynik: {display.main}
                                          </Typography>

                                          {display.details && (
                                              <Typography
                                                  variant="caption"
                                                  sx={{
                                                      color: "rgba(255,255,255,0.6)",
                                                      display: "block"
                                                  }}
                                              >
                                                  {display.details}
                                              </Typography>
                                          )}
                                      </>
                                  );
                              })()}

                              {match.winnerId && (
                                  <Typography
                                      variant="caption"
                                      sx={{
                                          display: "block",
                                          mt: 0.5,
                                          color: "#FFD700",
                                          fontWeight: "bold"
                                      }}
                                  >
                                      Wygrany: {
                                          match.teamA?.id === match.winnerId
                                              ? match.teamA?.name
                                              : match.teamB?.name
                                      }
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

            {scoreDialogError && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 2,
                        borderRadius: 2
                    }}
                >
                    {scoreDialogError}
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
              label={getScoreConfig(selectedTournamentForDetails?.discipline).label}
              value={score}
              onChange={(e) => {
                const value = e.target.value;

                if (value === "" || /^[\d:.]*$/.test(value)) {
                  setScore(value);
                  if (isSetDiscipline(selectedTournamentForDetails?.discipline)) {
                    const setsCount = getNumberOfSetsFromScore(value);
                    setSetScores(Array.from({ length: setsCount }, (_, i) => setScores[i] || ""));
                  }
                  setScoreDialogError("");
                  if (drawError) setDrawError("");
                }
              }}
              placeholder={getScoreConfig(selectedTournamentForDetails?.discipline).placeholder}
              inputProps={{ inputMode: "decimal" }}
              sx={{ mb: 1 }}
              InputLabelProps={{ style: { color: "#ccc" } }}
            />

            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)", display: "block", mb: 2 }}>
              {getScoreHelperText(selectedTournamentForDetails?.discipline)}
            </Typography>

            {supportsExtraTime(selectedTournamentForDetails?.discipline) && isDrawScore(score) && (
              <TextField
                fullWidth
                label="Wynik po dogrywce"
                value={extraTimeScore}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^[\d:]*$/.test(value)) {
                    setExtraTimeScore(value);
                    setScoreDialogError("");
                  }
                }}
                placeholder="np. 2:1"
                inputProps={{ inputMode: "numeric" }}
                sx={{ mb: 2 }}
                InputLabelProps={{ style: { color: "#ccc" } }}
              />
            )}

            {supportsExtraTime(selectedTournamentForDetails?.discipline) &&
              isDrawScore(score) &&
              isDrawScore(extraTimeScore) && (
                <TextField
                  fullWidth
                  label="Wynik rzutów karnych"
                  value={penaltyScore}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^[\d:]*$/.test(value)) {
                      setPenaltyScore(value);
                      setScoreDialogError("");
                    }
                  }}
                  placeholder="np. 5:4"
                  inputProps={{ inputMode: "numeric" }}
                  sx={{ mb: 2 }}
                  InputLabelProps={{ style: { color: "#ccc" } }}
                />
            )}



            {isSetDiscipline(selectedTournamentForDetails?.discipline) && setScores.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: "#FF6A00", mb: 1 }}>
                  Wyniki setów
                </Typography>

                {setScores.map((setScore, index) => (
                  <TextField
                    key={index}
                    fullWidth
                    label={`Set ${index + 1}`}
                    value={setScore}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value === "" || /^[\d:]*$/.test(value)) {
                        const updated = [...setScores];
                        updated[index] = value;
                        setSetScores(updated);
                        setMatchNotes(updated.filter(Boolean).join(", "));
                      }
                    }}
                    placeholder={
                      normalizeDiscipline(selectedTournamentForDetails?.discipline) === "siatkówka"
                        ? "np. 25:20"
                        : "np. 6:4"
                    }
                    inputProps={{ inputMode: "numeric" }}
                    sx={{ mb: 1 }}
                    InputLabelProps={{ style: { color: "#ccc" } }}
                  />
                ))}
              </Box>
            )}

            {/* Checkbox dla notatek */}
            {!["siatkówka", "tenis ziemny", "tenis stołowy"].includes(
              normalizeDiscipline(selectedTournamentForDetails?.discipline)
            ) && (
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
            )}
            
            {/* Rozwijane pole tekstowe */}
            {!["siatkówka", "tenis ziemny", "tenis stołowy"].includes(
              normalizeDiscipline(selectedTournamentForDetails?.discipline)
            ) && showNotes && (
                <TextField
                    fullWidth
                    label={getScoreConfig(selectedTournamentForDetails?.discipline).detailsLabel}
                    multiline
                    rows={4}
                    value={matchNotes}
                    onChange={(e) => setMatchNotes(e.target.value)}
                    placeholder={getScoreConfig(selectedTournamentForDetails?.discipline).detailsPlaceholder}
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