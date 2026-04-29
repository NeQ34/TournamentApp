import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Chip,
  Grid,
  Autocomplete, // DODAJ TO
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
} from "@mui/icons-material";


// ========== TYPY ==========
interface Team {
  id: number;
  name: string;
  sport: string;
  captainId: number;
  captainName: string;
  description?: string;
  status: "active" | "inactive" | "pending";
  membersCount?: number;
}

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "member" | "captain";
}

interface UserSearchResult {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface MembersDialogProps {
  open: boolean;
  onClose: () => void;
  team: Team | null;
  onTeamUpdate: () => void;
}

// ========== KOMPONENT ZARZĄDZANIA CZŁONKAMI ==========
const MembersManagementDialog = ({ open, onClose, team, onTeamUpdate }: MembersDialogProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [openAddMember, setOpenAddMember] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<UserSearchResult | null>(null);

  const fetchMembers = async () => {
    if (!team) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/admin/teams/${team.id}/members`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error("Błąd pobierania członków:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!team) return;
    try {
      const response = await fetch(`http://localhost:8080/api/admin/teams/${team.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ email: searchEmail }),
      });

      if (response.ok) {
        fetchMembers();
        onTeamUpdate();
        setOpenAddMember(false);
        setSearchEmail("");
        setSearchResult(null);
      } else {
        const error = await response.json();
        alert(error.message || "Nie udało się dodać zawodnika");
      }
    } catch (error) {
      console.error("Błąd dodawania zawodnika:", error);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!team) return;
    if (window.confirm("Czy na pewno chcesz usunąć tego zawodnika z drużyny?")) {
      try {
        const response = await fetch(`http://localhost:8080/api/admin/teams/${team.id}/members/${userId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          fetchMembers();
          onTeamUpdate();
        }
      } catch (error) {
        console.error("Błąd usuwania zawodnika:", error);
      }
    }
  };

  const handleChangeCaptain = async (userId: number) => {
    if (!team) return;
    if (window.confirm("Czy na pewno chcesz zmienić kapitana?")) {
      try {
        const response = await fetch(`http://localhost:8080/api/admin/teams/${team.id}/captain/${userId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          fetchMembers();
          onTeamUpdate();
        }
      } catch (error) {
        console.error("Błąd zmiany kapitana:", error);
      }
    }
  };

  const searchUser = async () => {
    if (!searchEmail) return;
    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/search?email=${searchEmail}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const user = await response.json();
        setSearchResult(user);
      } else {
        setSearchResult(null);
        alert("Nie znaleziono użytkownika z podanym emailem");
      }
    } catch (error) {
      console.error("Błąd wyszukiwania:", error);
    }
  };

  useEffect(() => {
    if (open && team) {
      fetchMembers();
    }
  }, [open, team]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.9)",
            backdropFilter: "blur(10px)",
            color: "#fff",
            borderRadius: 4,
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Członkowie drużyny: {team?.name}</Typography>
            <Button startIcon={<AddIcon />} onClick={() => setOpenAddMember(true)} sx={{ color: "#FF6A00" }}>
              Dodaj zawodnika
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Typography sx={{ textAlign: "center", py: 4 }}>Ładowanie...</Typography>
          ) : members.length === 0 ? (
            <Typography sx={{ textAlign: "center", py: 4, color: "rgba(255,255,255,0.7)" }}>
              Brak członków w tej drużynie
            </Typography>
          ) : (
            <List>
              {members.map((member) => (
                <ListItem
                  key={member.id}
                  secondaryAction={
                    <Box>
                      {member.role !== "captain" && (
                        <IconButton
                          edge="end"
                          onClick={() => handleChangeCaptain(member.id)}
                          sx={{ color: "#FF6A00", mr: 1 }}
                        >
                          <AdminPanelSettingsIcon />
                        </IconButton>
                      )}
                      <IconButton edge="end" onClick={() => handleRemoveMember(member.id)} sx={{ color: "#ff6b6b" }}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: member.role === "captain" ? "#FF6A00" : "#ccc" }}>
                      {member.firstName?.[0]}{member.lastName?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${member.firstName} ${member.lastName} ${member.role === "captain" ? "(Kapitan)" : ""}`}
                    secondary={member.email}
                    primaryTypographyProps={{ sx: { color: "#fff" } }}
                    secondaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.7)" } }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} sx={{ color: "#ccc" }}>
            Zamknij
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog dodawania zawodnika */}
      <Dialog
        open={openAddMember}
        onClose={() => {
          setOpenAddMember(false);
          setSearchEmail("");
          setSearchResult(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.9)",
            backdropFilter: "blur(10px)",
            color: "#fff",
            borderRadius: 4,
          },
        }}
      >
        <DialogTitle>Dodaj zawodnika do drużyny</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <TextField
              label="Email użytkownika"
              fullWidth
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              InputLabelProps={{ style: { color: "#ccc" } }}
              sx={{ input: { color: "#fff" } }}
            />
            <Button
              variant="contained"
              onClick={searchUser}
              sx={{ bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" } }}
            >
              Szukaj
            </Button>
          </Box>
          {searchResult && (
            <Paper sx={{ mt: 2, p: 2, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
              <Typography>
                <strong>
                  {searchResult.firstName} {searchResult.lastName}
                </strong>
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                {searchResult.email}
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={handleAddMember}
                sx={{ mt: 2, bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" } }}
              >
                Dodaj do drużyny
              </Button>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddMember(false)} sx={{ color: "#ccc" }}>
            Anuluj
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ========== GŁÓWNY KOMPONENT ZARZĄDZANIA DRUŻYNAMI ==========
const sportsDictionary = [
  "Piłka nożna", "Siatkówka", "Koszykówka", "Piłka ręczna",
  "Tenis ziemny", "Tenis stołowy", "Szachy",
  "E-sport: League of Legends", "E-sport: Counter-Strike 2", "E-sport: Valorant"
];
const TeamsManagement = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openMembersDialog, setOpenMembersDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sport: "",
    captainId: "",
    description: "",
    status: "active" as "active" | "inactive" | "pending",
  });
const [pendingTeams, setPendingTeams] = useState<Team[]>([]);

  const fetchTeams = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/admin/teams", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error("Błąd pobierania drużyn:", error);
    } finally {
      setLoading(false);
    }
  };

const fetchPendingTeams = async () => {
  try {
    const response = await fetch("http://localhost:8080/api/admin/teams/pending", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await response.json();
    setPendingTeams(data);
  } catch (error) {
    console.error("Błąd pobierania zgłoszeń:", error);
  }
};

  const handleAddTeam = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/admin/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchTeams();
        setOpenDialog(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.message || "Błąd dodawania drużyny");
      }
    } catch (error) {
      console.error("Błąd dodawania drużyny:", error);
    }
  };

  const handleEditTeam = async () => {
    if (!selectedTeam) return;
    try {
      const response = await fetch(`http://localhost:8080/api/admin/teams/${selectedTeam.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchTeams();
        setOpenDialog(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.message || "Błąd edycji drużyny");
      }
    } catch (error) {
      console.error("Błąd edycji drużyny:", error);
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (window.confirm("Czy na pewno chcesz usunąć tę drużynę?")) {
      try {
        const response = await fetch(`http://localhost:8080/api/admin/teams/${teamId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          fetchTeams();
        } else {
          const error = await response.json();
          alert(error.message || "Błąd usuwania drużyny");
        }
      } catch (error) {
        console.error("Błąd usuwania drużyny:", error);
      }
    }
  };

const handleApproveTeam = async (teamId: number) => {
  try {
    const response = await fetch(`http://localhost:8080/api/admin/teams/${teamId}/approve`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      fetchTeams();
      fetchPendingTeams();
    } else {
      const error = await response.json();
      alert(error.message || "Nie udało się zaakceptować drużyny");
    }
  } catch (error) {
    console.error("Błąd akceptacji drużyny:", error);
  }
};

  const resetForm = () => {
    setFormData({
      name: "",
      sport: "",
      captainId: "",
      description: "",
      status: "active",
    });
    setSelectedTeam(null);
  };

  const openEditDialog = (team: Team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      sport: team.sport,
      captainId: String(team.captainId),
      description: team.description || "",
      status: team.status,
    });
    setOpenDialog(true);
  };

  useEffect(() => {
    fetchTeams();
    fetchPendingTeams();
  }, []);

  if (loading) {
    return (
      <Paper
        elevation={8}
        sx={{
          p: 4,
          borderRadius: 4,
          backgroundColor: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(6px)",
          textAlign: "center",
        }}
      >
        <Typography>Ładowanie drużyn...</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Nagłówek */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: "#fff" }}>
          Zarządzanie drużynami
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" } }}
        >
          Dodaj drużynę
        </Button>
      </Box>

      {pendingTeams.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: "#fff", mb: 2 }}>
            Zgłoszenia oczekujące
          </Typography>

          <Grid container spacing={3}>
            {pendingTeams.map((team) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={team.id}>
                <Paper
                  elevation={8}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    backgroundColor: "rgba(255,106,0,0.12)",
                    backdropFilter: "blur(6px)",
                    color: "#fff",
                    border: "1px solid rgba(255,106,0,0.4)",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" fontWeight={700}>
                      {team.name}
                    </Typography>
                    <Chip
                      label="Oczekuje"
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,193,7,0.15)",
                        color: "#ffb300",
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                      <strong>Dyscyplina:</strong> {team.sport}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                      <strong>Kapitan:</strong> {team.captainName}
                    </Typography>
                    {team.description && (
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mt: 1 }}>
                        {team.description}
                      </Typography>
                    )}
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleApproveTeam(team.id)}
                    sx={{ bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" } }}
                  >
                    Akceptuj drużynę
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Lista drużyn */}
      <Grid container spacing={3}>
        {teams.map((team) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={team.id}>
            <Paper
              elevation={8}
              sx={{
                p: 3,
                borderRadius: 4,
                backgroundColor: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(6px)",
                color: "#fff",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-4px)" },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  {team.name}
                </Typography>
                <Chip
                  label={
                    team.status === "active"
                      ? "Aktywna"
                      : team.status === "pending"
                      ? "Oczekuje"
                      : "Nieaktywna"
                  }
                  size="small"
                  sx={{
                    bgcolor:
                      team.status === "active"
                        ? "rgba(76, 175, 80, 0.2)"
                        : team.status === "pending"
                        ? "rgba(255, 193, 7, 0.2)"
                        : "rgba(255, 107, 107, 0.2)",
                    color:
                      team.status === "active"
                        ? "#4caf50"
                        : team.status === "pending"
                        ? "#ffb300"
                        : "#ff6b6b",
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                  <strong>Dyscyplina:</strong> {team.sport}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                  <strong>Kapitan:</strong> {team.captainName}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                  <strong>Liczba członków:</strong> {team.membersCount || 0}
                </Typography>
                {team.description && (
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mt: 1 }}>
                    {team.description}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<GroupIcon />}
                  onClick={() => {
                    setSelectedTeam(team);
                    setOpenMembersDialog(true);
                  }}
                  sx={{ color: "#FF6A00", borderColor: "#FF6A00" }}
                >
                  Członkowie
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => openEditDialog(team)}
                  sx={{ color: "#FF6A00", borderColor: "#FF6A00" }}
                >
                  Edytuj
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteTeam(team.id)}
                  sx={{ color: "#ff6b6b", borderColor: "#ff6b6b" }}
                >
                  Usuń
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Dialog dodawania/edycji drużyny */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          resetForm();
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.9)",
            backdropFilter: "blur(10px)",
            color: "#fff",
            borderRadius: 4,
          },
        }}
      >
        <DialogTitle>{selectedTeam ? "Edytuj drużynę" : "Dodaj nową drużynę"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Nazwa drużyny"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              InputLabelProps={{ style: { color: "#ccc" } }}
              sx={{ input: { color: "#fff" } }}
            />
            <Autocomplete
                options={sportsDictionary}
                value={formData.sport || null}
                onChange={(_event, newValue) => {
                  setFormData({ ...formData, sport: newValue || "" });
                }}
                // Stylizacja listy podpowiedzi, żeby była ciemna
                PaperComponent={({ children }) => (
                    <Paper sx={{ bgcolor: "#1A1A1A", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}>
                      {children}
                    </Paper>
                )}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Dyscyplina"
                        fullWidth
                        InputLabelProps={{ style: { color: "#ccc" } }}
                        sx={{
                          input: { color: "#fff" },
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: "rgba(255,255,255,0.23)" },
                            "&:hover fieldset": { borderColor: "#FF6A00" },
                          }
                        }}
                    />
                )}
            />
            <TextField
              label="ID Kapitana (email lub ID użytkownika)"
              fullWidth
              value={formData.captainId}
              onChange={(e) => setFormData({ ...formData, captainId: e.target.value })}
              InputLabelProps={{ style: { color: "#ccc" } }}
              sx={{ input: { color: "#fff" } }}
              helperText="Podaj email lub ID użytkownika, który będzie kapitanem"
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
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                label="Status"
                sx={{ color: "#fff" }}
              >
                <MenuItem value="active">Aktywna</MenuItem>
                <MenuItem value="inactive">Nieaktywna</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: "#ccc" }}>
            Anuluj
          </Button>
          <Button
            onClick={selectedTeam ? handleEditTeam : handleAddTeam}
            variant="contained"
            sx={{ bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" } }}
          >
            {selectedTeam ? "Zapisz" : "Dodaj"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog zarządzania członkami */}
      <MembersManagementDialog
        open={openMembersDialog}
        onClose={() => setOpenMembersDialog(false)}
        team={selectedTeam}
        onTeamUpdate={fetchTeams}
      />
    </Box>
  );
};

export default TeamsManagement;