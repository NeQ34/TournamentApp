import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  TextField,
  Typography,
  Chip,
  Alert,
  Autocomplete,
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
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

interface Team {
  id: number;
  name: string;
  sport: string;
  captainName?: string;
  captainId?: number;
  captainEmail?: string;
  description?: string;
  status: string;
  membersCount?: number;
}

interface TeamsProps {
  userData: {
    id?: number;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
  };
}

const Teams = ({ userData }: TeamsProps) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    sport: "",
    description: "",
  });

  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [similarDisciplines, setSimilarDisciplines] = useState<string[]>([]);
  const [ignoreSimilarDisciplines, setIgnoreSimilarDisciplines] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/api/teams");
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
        
        // Filtruj drużyny, których kapitanem jest zalogowany użytkownik
        const userTeams = data.filter((team: Team) => {
          return team.captainEmail === userData.email;
        });
        setMyTeams(userTeams);
        
        console.log("Wszystkie drużyny:", data);
        console.log("Drużyny użytkownika (kapitan):", userTeams);
        console.log("Email użytkownika:", userData.email);
      }
    } catch (error) {
      console.error("Błąd pobierania drużyn:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisciplines = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/disciplines");
      if (response.ok) {
        const data = await response.json();
        setDisciplines(data.map((discipline: { id: number; name: string }) => discipline.name));
      }
    } catch (error) {
      console.error("Błąd pobierania dyscyplin:", error);
    }
  };

  const getSimilarDisciplines = async (value: string): Promise<string[]> => {
    if (!value.trim()) {
      return [];
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/disciplines/similar?name=${encodeURIComponent(value)}`
      );

      if (response.ok) {
        const data = await response.json();
        return data.map((discipline: { id: number; name: string }) => discipline.name);
      }
    } catch (error) {
      console.error("Błąd sprawdzania podobnych dyscyplin:", error);
    }

    return [];
  };

  useEffect(() => {
    fetchTeams();
    fetchDisciplines();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      sport: "",
      description: "",
    });
    setSuccessMessage("");
    setErrorMessage("");
    setSimilarDisciplines([]);
    setIgnoreSimilarDisciplines(false);
  };

  const handleSubmit = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!formData.name.trim()) {
      setErrorMessage("Nazwa drużyny jest wymagana.");
      return;
    }

    if (!formData.sport.trim()) {
      setErrorMessage("Dyscyplina jest wymagana.");
      return;
    }

    const similar = await getSimilarDisciplines(formData.sport);

    if (similar.length > 0 && !ignoreSimilarDisciplines) {
      setSimilarDisciplines(similar);
      setErrorMessage(
        `Podobna dyscyplina już istnieje: ${similar.join(", ")}. Wybierz ją z listy albo kliknij "Dodaj mimo to".`
      );
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/teams/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          sport: formData.sport,
          description: formData.description,
          captainId: userData.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Zgłoszenie drużyny zostało wysłane do akceptacji administratora.");
        fetchTeams();

        setTimeout(() => {
          setOpenDialog(false);
          resetForm();
        }, 1500);
      } else {
        setErrorMessage(data.message || "Nie udało się wysłać zgłoszenia.");
      }
    } catch (error) {
      console.error("Błąd wysyłania zgłoszenia:", error);
      setErrorMessage("Nie udało się połączyć z serwerem.");
    }
  };

  // Tabela dla listy drużyn
  const TeamsTable = ({ teamsList, title }: { teamsList: Team[]; title: string }) => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" fontWeight={700} sx={{ color: "#FF6A00", mb: 2 }}>
        {title}
      </Typography>
      
      {teamsList.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "rgba(0,0,0,0.5)", borderRadius: 2 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
            Brak drużyn do wyświetlenia.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: "rgba(0,0,0,0.5)", borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(255,106,0,0.1)" }}>
                <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>Nazwa drużyny</TableCell>
                <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>Dyscyplina</TableCell>
                <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>Kapitan</TableCell>
                <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>Liczba członków</TableCell>
                <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teamsList.map((team) => (
                <TableRow key={team.id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                  <TableCell sx={{ color: "#fff", fontWeight: 500 }}>{team.name}</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.8)" }}>{team.sport}</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.8)" }}>{team.captainName || "-"}</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.8)" }}>{team.membersCount || 0}</TableCell>
                  <TableCell>
                    <Chip
                      label={team.status === "active" ? "Aktywna" : team.status === "pending" ? "Oczekująca" : "Nieaktywna"}
                      size="small"
                      sx={{
                        bgcolor: team.status === "active" 
                          ? "rgba(76, 175, 80, 0.2)" 
                          : team.status === "pending" 
                            ? "rgba(255, 193, 7, 0.2)" 
                            : "rgba(255, 255, 255, 0.1)",
                        color: team.status === "active" 
                          ? "#4caf50" 
                          : team.status === "pending" 
                            ? "#ffb300" 
                            : "#aaa",
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  const myTeamIds = myTeams.map(team => team.id);

  const availableSports = Array.from(
    new Set(teams.map((team) => team.sport).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "pl", { sensitivity: "base" }));

  const filterTeams = (teamsList: Team[]) => {
    return teamsList.filter((team) => {
      const matchesSearch =
        !searchTerm ||
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (team.captainName || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSport =
        !sportFilter || team.sport === sportFilter;

      const matchesStatus =
        !statusFilter || team.status === statusFilter;

      return matchesSearch && matchesSport && matchesStatus;
    });
  };

  const activeTeams = filterTeams(
    teams.filter(t => t.status === "active" && !myTeamIds.includes(t.id))
  );

  const pendingTeams = filterTeams(
    teams.filter(t => t.status === "pending" && !myTeamIds.includes(t.id))
  );

  const filteredMyTeams = filterTeams(myTeams);



  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: "#fff" }}>
          Drużyny
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setOpenDialog(true);
          }}
          sx={{ bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" } }}
        >
          Zgłoś drużynę
        </Button>
      </Box>

      <Paper
        sx={{
          p: 2,
          mb: 3,
          bgcolor: "rgba(0,0,0,0.5)",
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            size="small"
            label="Szukaj drużyny"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              minWidth: 240,
              input: { color: "#fff" },
              "& .MuiInputLabel-root": { color: "#ccc" },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel sx={{ color: "#ccc" }}>Dyscyplina</InputLabel>
            <Select
              value={sportFilter}
              label="Dyscyplina"
              onChange={(e) => setSportFilter(e.target.value)}
              sx={{ color: "#fff" }}
            >
              <MenuItem value="">Wszystkie</MenuItem>
              {availableSports.map((sport) => (
                <MenuItem key={sport} value={sport}>
                  {sport}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: "#ccc" }}>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ color: "#fff" }}
            >
              <MenuItem value="">Wszystkie</MenuItem>
              <MenuItem value="active">Aktywne</MenuItem>
              <MenuItem value="pending">Oczekujące</MenuItem>
              <MenuItem value="inactive">Nieaktywne</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            onClick={() => {
              setSearchTerm("");
              setSportFilter("");
              setStatusFilter("");
            }}
            sx={{ color: "#ccc", borderColor: "#666" }}
          >
            Wyczyść
          </Button>
        </Box>
      </Paper>

      {/* Sekcja: Twoje drużyny - drużyny gdzie użytkownik jest kapitanem */}
      {filteredMyTeams.length > 0 && (
        <TeamsTable teamsList={filteredMyTeams} title="Twoje drużyny" />
      )}

      {/* Sekcja: Wszystkie aktywne drużyny - BEZ drużyn użytkownika */}
      <TeamsTable 
        teamsList={activeTeams} 
        title="Aktywne drużyny" 
      />

      {/* Sekcja: Oczekujące zgłoszenia - BEZ drużyn użytkownika */}
      {pendingTeams.length > 0 && (
        <TeamsTable 
          teamsList={pendingTeams} 
          title="⏳ Oczekujące na akceptację" 
        />
      )}
    </Box>
  );
};

export default Teams;