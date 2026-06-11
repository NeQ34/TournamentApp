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

  // Pobierz ID drużyn, w których użytkownik jest kapitanem
  const myTeamIds = myTeams.map(team => team.id);

  // Aktywne drużyny - bez drużyn użytkownika
  const activeTeams = teams.filter(t => 
    t.status === "active" && !myTeamIds.includes(t.id)
  );

  // Oczekujące drużyny - bez drużyn użytkownika (ale tu mogą być jego zgłoszenia)
  const pendingTeams = teams.filter(t => 
    t.status === "pending" && !myTeamIds.includes(t.id)
  );

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

      {/* Sekcja: Twoje drużyny - drużyny gdzie użytkownik jest kapitanem */}
      {myTeams.length > 0 && (
        <TeamsTable teamsList={myTeams} title="Twoje drużyny" />
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