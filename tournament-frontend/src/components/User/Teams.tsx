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

  useEffect(() => {
    fetchTeams();
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

            <TextField
              label="Dyscyplina"
              fullWidth
              value={formData.sport}
              onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
              InputLabelProps={{ style: { color: "#ccc" } }}
              sx={{ input: { color: "#fff" } }}
            />

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