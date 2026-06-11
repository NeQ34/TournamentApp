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
  TablePagination,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

import { getAppSettings } from "../../utils/appSettings";

interface Discipline {
  id: number;
  name: string;
  minMembers: number;
  maxMembers: number;
}

interface DisciplinesManagementProps {
  disciplineToEditName?: string | null;
  onDisciplineEditHandled?: () => void;
}

const DisciplinesManagement = ({
  disciplineToEditName,
  onDisciplineEditHandled,
}: DisciplinesManagementProps) => {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  const [name, setName] = useState("");
  const [minMembers, setMinMembers] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [messageError, setMessageError] = useState("");
  const [messageSuccess, setMessageSuccess] = useState("");
  const [similarDisciplines, setSimilarDisciplines] = useState<string[]>([]);
  const [ignoreSimilarDisciplines, setIgnoreSimilarDisciplines] = useState(false);
  const appSettings = getAppSettings();
  const tableSize = appSettings.compactTables ? "small" : "medium";
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(appSettings.rowsPerPage);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [disciplineToDelete, setDisciplineToDelete] = useState<number | null>(null);

  const fetchDisciplines = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/disciplines", {
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("POBRANE DYSCYPLINY:", data);
        setDisciplines([...data]);
      }
    } catch (error) {
      console.error("Błąd pobierania dyscyplin:", error);
      setMessageError("Nie udało się pobrać dyscyplin.");
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
    fetchDisciplines();
  }, []);

useEffect(() => {
  if (!getAppSettings().autoRefreshData) return;

  const interval = setInterval(() => {
    fetchDisciplines();
  }, 10000);

  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    if (!disciplineToEditName || disciplines.length === 0) return;

    const discipline = disciplines.find(
      (d) => d.name.toLowerCase() === disciplineToEditName.toLowerCase()
    );

    if (discipline) {
      openEditDialog(discipline);
      onDisciplineEditHandled?.();
    }
  }, [disciplineToEditName, disciplines]);

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
    setSimilarDisciplines([]);
    setIgnoreSimilarDisciplines(false);
  };

  const openAddDialog = () => {
    setSelectedDiscipline(null);
    setName("");
    setMessageError("");
    setOpenDialog(true);
    setMinMembers("");
    setMaxMembers("");
    setSimilarDisciplines([]);
    setIgnoreSimilarDisciplines(false);
  };

  const openEditDialog = (discipline: Discipline) => {
    setSelectedDiscipline(discipline);
    setName(discipline.name);
    setMessageError("");
    setOpenDialog(true);
    setMinMembers(discipline.minMembers != null ? String(discipline.minMembers) : "");
    setMaxMembers(discipline.maxMembers != null ? String(discipline.maxMembers) : "");
    setSimilarDisciplines([]);
    setIgnoreSimilarDisciplines(false);
  };

  const handleSave = async () => {
    setMessageError("");
    setMessageSuccess("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setMessageError("Nazwa dyscypliny jest wymagana.");
      return;
    }

    if (!minMembers.trim() || !maxMembers.trim()) {
      setMessageError("Minimalna i maksymalna liczba członków jest wymagana.");
      return;
    }

    const min = Number(minMembers);
    const max = Number(maxMembers);

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      setMessageError("Minimalna i maksymalna liczba członków musi być liczbą.");
      return;
    }

    if (min < 1) {
      setMessageError("Minimalna liczba członków musi być większa od 0.");
      return;
    }

    if (max < min) {
      setMessageError("Maksymalna liczba członków nie może być mniejsza niż minimalna.");
      return;
    }

    const similar = await getSimilarDisciplines(trimmedName);

    const isSameEditedDiscipline =
      selectedDiscipline &&
      selectedDiscipline.name.toLowerCase() === trimmedName.toLowerCase();

    if (similar.length > 0 && !ignoreSimilarDisciplines && !isSameEditedDiscipline) {
      setSimilarDisciplines(similar);
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
          minMembers: min,
          maxMembers: max,
        }),
      });

      if (response.ok) {
        const wasEdit = selectedDiscipline !== null;

        await fetchDisciplines();

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

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/admin/disciplines/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

    if (response.ok) {
      await fetchDisciplines();
      setMessageSuccess("Dyscyplina została usunięta.");
    } else {
      setMessageError("Nie udało się usunąć dyscypliny.");
    }

      if (response.ok) {
        fetchDisciplines();
      }
    } catch (error) {
      console.error("Błąd usuwania dyscypliny:", error);
    } finally {
      setConfirmDeleteOpen(false);
      setDisciplineToDelete(null);
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

      {messageError && !openDialog && (
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
        <Table size={tableSize}>
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
              .slice(
                page * rowsPerPage,
                page * rowsPerPage + rowsPerPage
              )
              .map((discipline, index) => (
              <TableRow key={`${discipline.id}-${discipline.name}-${discipline.minMembers}-${discipline.maxMembers}`}>
                <TableCell sx={{ color: "#fff" }}>
                  {page * rowsPerPage + index + 1}
                </TableCell>
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
                    onClick={() => {
                      if (getAppSettings().confirmDangerousActions) {
                        setDisciplineToDelete(discipline.id);
                        setConfirmDeleteOpen(true);
                      } else {
                        handleDelete(discipline.id);
                      }
                    }}
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

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={disciplines.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          color: "#fff",
          "& .MuiTablePagination-selectIcon": { color: "#fff" },
          "& .MuiTablePagination-select": { color: "#fff" },
        }}
      />

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
            onChange={(e) => {
              setName(e.target.value);
              setIgnoreSimilarDisciplines(false);
              setSimilarDisciplines([]);
            }}
            InputLabelProps={{ style: { color: "#ccc" } }}
            sx={{ input: { color: "#fff" }, mt: 1 }}
          />

          {similarDisciplines.length > 0 && (
            <Alert
              severity="warning"
              sx={{ borderRadius: 2, mt: 2 }}
              action={
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      const selected = similarDisciplines[0];
                      setName(selected);
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
                      setMessageError("");
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

      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.9)",
            color: "#fff",
            borderRadius: 4,
          },
        }}
      >
        <DialogTitle>Usuń dyscyplinę</DialogTitle>

        <DialogContent>
          <Typography>
            Czy na pewno chcesz usunąć tę dyscyplinę?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} sx={{ color: "#ccc" }}>
            Anuluj
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (disciplineToDelete !== null) {
                handleDelete(disciplineToDelete);
              }
            }}
          >
            Usuń
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default DisciplinesManagement;