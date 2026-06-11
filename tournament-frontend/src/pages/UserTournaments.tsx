import { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { formatAppDate, getAppSettings } from "../utils/appSettings";

interface Tournament {
  id: number;
  name: string;
  discipline: string;
  startDate: string;
  endDate?: string;
  location?: string;
  status: string;
  registeredTeamsCount?: number;
}

const UserTournaments = ({ userData }: { userData: any }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchTournaments = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/admin/tournaments");
      if (response.ok) {
        const data = await response.json();
        setTournaments(data);
      }
    } catch (error) {
      console.error("Błąd:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (!getAppSettings().autoRefreshData) return;

    const interval = setInterval(() => {
      fetchTournaments();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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

  const availableDisciplines = Array.from(
    new Set(tournaments.map((tournament) => tournament.discipline).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "pl", { sensitivity: "base" }));

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch =
      !searchTerm ||
      tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.discipline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tournament.location || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDiscipline =
      !disciplineFilter || tournament.discipline === disciplineFilter;

    const matchesStatus =
      !statusFilter || tournament.status === statusFilter;

    return matchesSearch && matchesDiscipline && matchesStatus;
  });

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "#FF6A00" }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ color: "#fff", mb: 3 }}>
        Turnieje
      </Typography>

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
          label="Szukaj turnieju"
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
            value={disciplineFilter}
            label="Dyscyplina"
            onChange={(e) => setDisciplineFilter(e.target.value)}
            sx={{ color: "#fff" }}
          >
            <MenuItem value="">Wszystkie</MenuItem>
            {availableDisciplines.map((discipline) => (
              <MenuItem key={discipline} value={discipline}>
                {discipline}
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
            <MenuItem value="planned">Planowane</MenuItem>
            <MenuItem value="ongoing">Trwające</MenuItem>
            <MenuItem value="finished">Zakończone</MenuItem>
            <MenuItem value="archived">Archiwalne</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          onClick={() => {
            setSearchTerm("");
            setDisciplineFilter("");
            setStatusFilter("");
          }}
          sx={{ color: "#ccc", borderColor: "#666" }}
        >
          Wyczyść
        </Button>
      </Box>
    </Paper>

      {filteredTournaments.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", bgcolor: "rgba(0,0,0,0.5)", borderRadius: 2 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
            Brak turniejów do wyświetlenia.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: "rgba(0,0,0,0.5)", borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(255,106,0,0.1)" }}>
                <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>Nazwa turnieju</TableCell>
                <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>Dyscyplina</TableCell>
                <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>Data rozpoczęcia</TableCell>
                <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>Data zakończenia</TableCell>
                <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>Lokalizacja</TableCell>
                <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>Drużyny</TableCell>
                <TableCell sx={{ color: "#FF6A00", fontWeight: "bold" }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTournaments.map((tournament) => {
                const status = getStatusLabel(tournament.status);
                return (
                  <TableRow key={tournament.id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                    <TableCell sx={{ color: "#fff", fontWeight: 500 }}>{tournament.name}</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.8)" }}>{tournament.discipline}</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.8)" }}>{formatAppDate(tournament.startDate)}</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.8)" }}>{formatAppDate(tournament.endDate)}</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.8)" }}>{tournament.location || "-"}</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.8)" }}>{tournament.registeredTeamsCount || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        size="small"
                        sx={{ bgcolor: `${status.color}20`, color: status.color }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default UserTournaments;