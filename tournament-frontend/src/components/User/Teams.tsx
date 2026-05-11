import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  TextField,
  Typography,
  Chip,
  Alert,
  Autocomplete,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

interface Team {
  id: number;
  name: string;
  sport: string;
  captainName?: string;
  description?: string;
  status: string;
  membersCount?: number;
}

interface TeamsProps {
  userData: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

const Teams = ({ userData }: TeamsProps) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [openDialog, setOpenDialog] = useState(false);

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
      const response = await fetch("http://localhost:8080/api/teams");
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error("Błąd pobierania drużyn:", error);
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
  };

  const handleSubmit = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    const similar = await getSimilarDisciplines(formData.sport);

    if (similar.length > 0 && !ignoreSimilarDisciplines) {
      setSimilarDisciplines(similar);
      setError(
        `Podobna dyscyplina już istnieje: ${similar.join(", ")}. Wybierz ją z listy albo kliknij "Użyj istniejącej".`
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
        }, 1200);
      } else {
        setErrorMessage(data.message || "Nie udało się wysłać zgłoszenia.");
      }
    } catch (error) {
      console.error("Błąd wysyłania zgłoszenia:", error);
      setErrorMessage("Nie udało się połączyć z serwerem.");
    }
  };

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
                height: "100%",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  {team.name}
                </Typography>
                <Chip
                  label="Aktywna"
                  size="small"
                  sx={{
                    bgcolor: "rgba(76, 175, 80, 0.2)",
                    color: "#4caf50",
                  }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                <strong>Dyscyplina:</strong> {team.sport}
              </Typography>

              {team.captainName && (
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                  <strong>Kapitan:</strong> {team.captainName}
                </Typography>
              )}

              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                <strong>Liczba członków:</strong> {team.membersCount || 0}
              </Typography>

              {team.description && (
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mt: 1 }}>
                  {team.description}
                </Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

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
        <DialogTitle>Zgłoś nową drużynę</DialogTitle>

        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {successMessage && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                {successMessage}
              </Alert>
            )}

            {errorMessage && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {errorMessage}
              </Alert>
            )}

            <TextField
              label="Nazwa drużyny"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              InputLabelProps={{ style: { color: "#ccc" } }}
              sx={{ input: { color: "#fff" } }}
            />

            <Autocomplete
              freeSolo
              options={disciplines}
              value={formData.sport || null}
              onChange={(_event, newValue) => {
                setFormData({ ...formData, sport: newValue || "" });
              }}
              onInputChange={(_event, newInputValue) => {
                setFormData({ ...formData, sport: newInputValue });
                setIgnoreSimilarDisciplines(false);
              }}
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
                  helperText="Wybierz dyscyplinę z listy albo wpisz nową"
                  InputLabelProps={{ style: { color: "#ccc" } }}
                  sx={{
                    input: { color: "#fff" },
                    "& .MuiFormHelperText-root": { color: "rgba(255,255,255,0.7)" },
                  }}
                />
              )}
            />

            {similarDisciplines.length > 0 && (
              <Alert
                severity="warning"
                sx={{ borderRadius: 2 }}
                action={
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => {
                        const selected = similarDisciplines[0];
                        setFormData({ ...formData, sport: selected });
                        setSimilarDisciplines([]);
                        setIgnoreSimilarDisciplines(false);
                      }}
                    >
                      Użyj istniejącej
                    </Button>

                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => {
                        setIgnoreSimilarDisciplines(true);
                        setSimilarDisciplines([]);
                        setDialogError("");
                      }}
                    >
                      Dodaj mimo to
                    </Button>
                  </Box>
                }
              >
                Podobna dyscyplina już istnieje: {similarDisciplines.join(", ")}
              </Alert>
            )}

            <TextField
              label="Opis (opcjonalny)"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              InputLabelProps={{ style: { color: "#ccc" } }}
              sx={{ textarea: { color: "#fff" } }}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: "#ccc" }}>
            Anuluj
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" } }}
          >
            Wyślij zgłoszenie
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Teams;