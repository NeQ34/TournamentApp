import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

interface Discipline {
  id: number;
  name: string;
  minMembers: number;
  maxMembers: number;
}

const DisciplinesManagement = () => {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  const [name, setName] = useState("");
  const [minMembers, setMinMembers] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [messageError, setMessageError] = useState("");
  const [messageSuccess, setMessageSuccess] = useState("");

  const fetchDisciplines = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/disciplines", {
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setDisciplines(data);
      }
    } catch (error) {
      console.error("Błąd pobierania dyscyplin:", error);
      setMessageError("Nie udało się pobrać dyscyplin.");
    }
  };

  useEffect(() => {
    fetchDisciplines();
  }, []);

    useEffect(() => {
      if (!messageError && !messageSuccess) return;

      const timer = setTimeout(() => {
        setMessageError("");
        setMessageSuccess("");
      }, 3000);

      return () => clearTimeout(timer);
    }, [messageError, messageSuccess]);

  const resetDialog = () => {
    setOpenDialog(false);
    setSelectedDiscipline(null);
    setName("");
    setMessageError("");
    setMinMembers("");
    setMaxMembers("");
  };

  const openAddDialog = () => {
    setSelectedDiscipline(null);
    setName("");
    setMessageError("");
    setOpenDialog(true);
    setMinMembers("");
    setMaxMembers("");
  };

  const openEditDialog = (discipline: Discipline) => {
    setSelectedDiscipline(discipline);
    setName(discipline.name);
    setMessageError("");
    setOpenDialog(true);
    setMinMembers(String(discipline.minMembers));
    setMaxMembers(String(discipline.maxMembers));
  };

  const handleSave = async () => {
    setMessageError("");
    setMessageSuccess("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setMessageError("Nazwa dyscypliny jest wymagana.");
      return;
    }

    try {
      const url = selectedDiscipline
        ? `http://localhost:8080/api/admin/disciplines/${selectedDiscipline.id}`
        : "http://localhost:8080/api/admin/disciplines";

      const method = selectedDiscipline ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          minMembers: Number(minMembers),
          maxMembers: Number(maxMembers),
        }),
      });

      if (response.ok) {
        const savedDiscipline = await response.json();
        const wasEdit = selectedDiscipline !== null;

        setDisciplines((prev) => {
          if (wasEdit) {
            return prev.map((discipline) =>
              discipline.id === savedDiscipline.id ? savedDiscipline : discipline
            );
          }

          return [...prev, savedDiscipline];
        });

        setOpenDialog(false);
        setSelectedDiscipline(null);
        setName("");
        setMinMembers("");
        setMaxMembers("");

        setMessageSuccess(
          wasEdit
            ? "Dyscyplina została edytowana."
            : "Dyscyplina została dodana."
        );
      }else {
        const errorData = await response.json();
        setMessageError(errorData.message || "Nie udało się zapisać dyscypliny.");
      }
    } catch (error) {
      console.error("Błąd zapisu dyscypliny:", error);
      setMessageError("Nie udało się połączyć z serwerem.");
    }
  };

  const handleDelete = async (id: number) => {
    setMessageError("");
    setMessageSuccess("");

    try {
      const response = await fetch(`http://localhost:8080/api/admin/disciplines/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchDisciplines();
        setMessageSuccess("Dyscyplina została usunięta.");
      } else {
        const errorData = await response.json();
        setMessageError(errorData.message || "Nie udało się usunąć dyscypliny.");
      }
    } catch (error) {
      console.error("Błąd usuwania dyscypliny:", error);
      setMessageError("Nie udało się połączyć z serwerem.");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: "#fff" }}>
          Słownik dyscyplin
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAddDialog}
          sx={{ bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" } }}
        >
          Dodaj dyscyplinę
        </Button>
      </Box>

      {messageError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {messageError}
        </Alert>
      )}

      {messageSuccess && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          {messageSuccess}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        sx={{
          bgcolor: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(6px)",
          borderRadius: 4,
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "rgba(255,106,0,0.1)" }}>
              <TableCell sx={{ color: "#FF6A00", fontWeight: 700 }}>Lp.</TableCell>
              <TableCell sx={{ color: "#FF6A00", fontWeight: 700 }}>Nazwa</TableCell>
              <TableCell sx={{ color: "#FF6A00", fontWeight: 700 }}>Min członków</TableCell>
              <TableCell sx={{ color: "#FF6A00", fontWeight: 700 }}>Max członków</TableCell>
              <TableCell sx={{ color: "#FF6A00", fontWeight: 700 }} align="center">
                Akcje
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {[...disciplines]
              .sort((a, b) =>
                a.name.localeCompare(b.name, "pl", { sensitivity: "base" })
              )
              .map((discipline, index) => (
              <TableRow key={discipline.id}>
                <TableCell sx={{ color: "#fff" }}>{index + 1}</TableCell>
                <TableCell sx={{ color: "#fff" }}>{discipline.name}</TableCell>
                <TableCell sx={{ color: "#fff" }}>{discipline.minMembers}</TableCell>
                <TableCell sx={{ color: "#fff" }}>{discipline.maxMembers}</TableCell>
                <TableCell align="center">
                  <IconButton
                    onClick={() => openEditDialog(discipline)}
                    sx={{ color: "#2196f3" }}
                  >
                    <EditIcon />
                  </IconButton>

                  <IconButton
                    onClick={() => handleDelete(discipline.id)}
                    sx={{ color: "#ff6b6b" }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={resetDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.9)",
            color: "#fff",
            borderRadius: 4,
          },
        }}
      >
        <DialogTitle>
          {selectedDiscipline ? "Edytuj dyscyplinę" : "Dodaj dyscyplinę"}
        </DialogTitle>

        <DialogContent>
          {messageError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {messageError}
            </Alert>
          )}

          <TextField
            label="Nazwa dyscypliny"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            InputLabelProps={{ style: { color: "#ccc" } }}
            sx={{ input: { color: "#fff" }, mt: 1 }}
          />

          <TextField
            label="Minimalna liczba członków"
            type="number"
            fullWidth
            value={minMembers}
            onChange={(e) => setMinMembers(e.target.value)}
            InputLabelProps={{ style: { color: "#ccc" } }}
            sx={{ input: { color: "#fff" }, mt: 2 }}
          />

          <TextField
            label="Maksymalna liczba członków"
            type="number"
            fullWidth
            value={maxMembers}
            onChange={(e) => setMaxMembers(e.target.value)}
            InputLabelProps={{ style: { color: "#ccc" } }}
            sx={{ input: { color: "#fff" }, mt: 2 }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={resetDialog} sx={{ color: "#ccc" }}>
            Anuluj
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            sx={{ bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" } }}
          >
            Zapisz
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DisciplinesManagement;