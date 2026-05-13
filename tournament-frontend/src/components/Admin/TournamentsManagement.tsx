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
  ListItemSecondaryAction,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  GroupAdd as GroupAddIcon,
} from "@mui/icons-material";

interface Tournament {
  id: number;
  name: string;
  discipline: string;
  startDate: string;
  endDate: string;
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

  interface AvailableTeam {
    id: number;
    name: string;
    sport: string;
    captainName: string;
    membersCount: number;
}

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
  const [availableTeams, setAvailableTeams] = useState<AvailableTeam[]>([]);
  const [registeredTeams, setRegisteredTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // Filtrowanie
  const filterTournaments = (list: Tournament[]) => {
    if (!searchTerm) return list;
    return list.filter((t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Pobieranie turniejów
  const fetchTournaments = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/admin/tournaments", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
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

  // Pobieranie dyscyplin
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

  // Pobieranie dostępnych drużyn (aktywne, w danej dyscyplinie)
  const fetchAvailableTeams = async (discipline: string) => {
    if (!discipline) return;
    setTeamsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/admin/teams/available?discipline=${encodeURIComponent(discipline)}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
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

  // Pobieranie zgłoszonych drużyn do turnieju
  const fetchRegisteredTeams = async (tournamentId: number) => {
    setTeamsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/admin/tournaments/${tournamentId}/teams`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
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

  // Dodawanie drużyny do turnieju
  const handleAddTeamToTournament = async (teamId: number) => {
    if (!selectedTournamentForDetails) return;

    try {
      const response = await fetch(
        `http://localhost:8080/api/admin/tournaments/${selectedTournamentForDetails.id}/teams/${teamId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        fetchRegisteredTeams(selectedTournamentForDetails.id);
        fetchAvailableTeams(selectedTournamentForDetails.discipline);
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

  // Usuwanie drużyny z turnieju
  const handleRemoveTeamFromTournament = async (teamId: number) => {
    if (!selectedTournamentForDetails) return;

    try {
      const response = await fetch(
        `http://localhost:8080/api/admin/tournaments/${selectedTournamentForDetails.id}/teams/${teamId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        fetchRegisteredTeams(selectedTournamentForDetails.id);
        fetchAvailableTeams(selectedTournamentForDetails.discipline);
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

  // Dodawanie / edycja turnieju
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
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
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

  const openDetailsDialog = (tournament: Tournament) => {
    setSelectedTournamentForDetails(tournament);
    setTabValue(0);
    fetchAvailableTeams(tournament.discipline);
    fetchRegisteredTeams(tournament.id);
  };

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

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  const filteredTournaments = filterTournaments(tournaments).sort((a, b) =>
    a.name.localeCompare(b.name, "pl", { sensitivity: "base" })
  );
  const paginatedTournaments = filteredTournaments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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

      {/* Dialog zarządzania drużynami w turnieju */}
      <Dialog open={!!selectedTournamentForDetails} onClose={() => setSelectedTournamentForDetails(null)} maxWidth="md" fullWidth
        PaperProps={{ sx: { bgcolor: "rgba(0,0,0,0.9)", color: "#fff", borderRadius: 4 } }}>
        <DialogTitle>
          Zarządzanie turniejem: {selectedTournamentForDetails?.name}
          <IconButton sx={{ position: "absolute", right: 8, top: 8, color: "#ccc" }} onClick={() => setSelectedTournamentForDetails(null)}>
            ✕
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)", mb: 2 }}>
            <Tab label="Zgłoszone drużyny" sx={{ color: "#fff" }} />
            <Tab label="Dostępne drużyny" sx={{ color: "#fff" }} />
          </Tabs>

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
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemoveTeamFromTournament(team.id)} sx={{ color: "#ff6b6b" }}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}

          {tabValue === 1 && (
            <>
              <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}>
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
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleAddTeamToTournament(team.id)} sx={{ color: "#4caf50" }}>
                          <AddIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTournamentForDetails(null)} sx={{ color: "#ccc" }}>Zamknij</Button>
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