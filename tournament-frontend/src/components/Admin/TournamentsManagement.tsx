// src/components/admin/TournamentsManagement.tsx
import { useEffect, useState } from "react";
import {
  Box,
  Button,
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
  roundNumber: number;
  matchOrder: number;
  teamA: { id: number; name: string } | null;
  teamB: { id: number; name: string } | null;
  result: string | null;
  status: string;
  winnerId: number | null;
  nextMatchId: number | null;
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

  // Filtrowanie
  const filterTournaments = (list: Tournament[]) => {
    if (!searchTerm) return list;
    return list.filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
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
        const data = await response.json();
        setBracket(data);
      }
    } catch (error) {
      console.error("Błąd pobierania drabinki:", error);
    } finally {
      setBracketLoading(false);
    }
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
            setDialogSuccess("Drużyna została dodana do turnieju.");
        } else {
            const error = await response.json();
            setDialogError(error.message || "Nie udało się dodać drużyny.");
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
            setDialogSuccess("Drużyna została usunięta z turnieju.");
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
        `http://localhost:8080/api/admin/tournaments/${selectedTournamentForDetails.id}/generate-bracket?randomize=${randomize}`,
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
    if (!selectedMatch || !winnerId) return;
    try {
      const response = await fetch(
        `http://localhost:8080/api/admin/tournaments/matches/${selectedMatch.id}/result`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ result: score, winnerId }),
        }
      );
      if (response.ok) {
        await fetchBracket(selectedTournamentForDetails!.id);
        setScoreDialogOpen(false);
        setSelectedMatch(null);
        setScore("");
        setWinnerId(null);
        setDialogSuccess("Wynik został zapisany.");
      } else {
        const error = await response.json();
        setDialogError(error.message || "Błąd zapisu wyniku");
      }
    } catch (error) {
      console.error("Błąd:", error);
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
                  sx={{ color: randomize ? "#FF6A00" : "#fff", borderColor: "#FF6A00" }}
                >
                  Losuj pary: {randomize ? "TAK" : "NIE"}
                </Button>
              </Box>

              {bracketLoading && <Typography sx={{ textAlign: "center", py: 4 }}>Ładowanie drabinki...</Typography>}

              {!bracketLoading && bracket.length === 0 && !generating && (
                <Paper sx={{ p: 4, textAlign: "center", bgcolor: "rgba(0,0,0,0.5)" }}>
                  <Typography>Drabinka nie została jeszcze wygenerowana. Kliknij przycisk powyżej.</Typography>
                </Paper>
              )}

              {bracket.length > 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, overflowX: "auto", py: 2 }}>
                  {Array.from(new Set(bracket.map(m => m.roundNumber))).sort((a, b) => a - b).map(round => (
                    <Box key={round} sx={{ width: "100%" }}>
                      <Typography variant="h6" sx={{ textAlign: "center", mb: 1, color: "#FF6A00" }}>
                        Runda {round}
                      </Typography>
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 3, flexWrap: "wrap" }}>
                        {bracket.filter(m => m.roundNumber === round).sort((a, b) => a.matchOrder - b.matchOrder).map(match => (
                          <Paper key={match.id} sx={{ p: 2, minWidth: 200, textAlign: "center", bgcolor: "rgba(0,0,0,0.6)" }}>
                            <Typography>{match.teamA?.name || "BYE"}</Typography>
                            <Typography variant="h6">vs</Typography>
                            <Typography>{match.teamB?.name || "BYE"}</Typography>
                            {match.result && <Typography sx={{ color: "#4caf50", mt: 1 }}>Wynik: {match.result}</Typography>}
                            {match.status === "pending" && match.teamA && match.teamB && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  setSelectedMatch(match);
                                  setScoreDialogOpen(true);
                                }}
                                sx={{ mt: 1, color: "#FF6A00" }}
                              >
                                Wprowadź wynik
                              </Button>
                            )}
                            {match.winnerId && <Chip label="Rozegrany" size="small" sx={{ mt: 1 }} />}
                          </Paper>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* Zakładka: Wyniki */}
          {tabValue === 2 && (
            <Box>
              {bracketLoading && <Typography>Ładowanie...</Typography>}
              {!bracketLoading && bracket.length === 0 && <Typography>Brak wygenerowanej drabinki.</Typography>}
              {bracket.filter(m => m.teamA && m.teamB).map(match => (
                <Paper key={match.id} sx={{ p: 2, mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography>{match.teamA!.name} vs {match.teamB!.name}</Typography>
                  {match.result ? (
                    <Typography sx={{ color: "#4caf50" }}>Wynik: {match.result}</Typography>
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => {
                        setSelectedMatch(match);
                        setScoreDialogOpen(true);
                      }}
                      sx={{ bgcolor: "#FF6A00" }}
                    >
                      Wprowadź wynik
                    </Button>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTournamentForDetails(null)} sx={{ color: "#ccc" }}>Zamknij</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog wprowadzania wyniku */}
      <Dialog open={scoreDialogOpen} onClose={() => setScoreDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: "rgba(0,0,0,0.9)", color: "#fff", borderRadius: 4 } }}>
        <DialogTitle>Wprowadź wynik</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {selectedMatch?.teamA?.name} vs {selectedMatch?.teamB?.name}
          </Typography>
          <TextField
            fullWidth
            label="Wynik (np. 3:1)"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            sx={{ mb: 2 }}
            InputLabelProps={{ style: { color: "#ccc" } }}
          />
          <FormControl fullWidth>
            <InputLabel sx={{ color: "#ccc" }}>Zwycięzca</InputLabel>
            <Select
              value={winnerId || ""}
              onChange={(e) => setWinnerId(Number(e.target.value))}
              label="Zwycięzca"
              sx={{ color: "#fff" }}
            >
              <MenuItem value={selectedMatch?.teamA?.id}>{selectedMatch?.teamA?.name}</MenuItem>
              <MenuItem value={selectedMatch?.teamB?.id}>{selectedMatch?.teamB?.name}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScoreDialogOpen(false)} sx={{ color: "#ccc" }}>Anuluj</Button>
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