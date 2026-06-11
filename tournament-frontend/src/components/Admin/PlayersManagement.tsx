import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TablePagination,
    Alert,
} from "@mui/material";
import {
    Delete as DeleteIcon,
    Add as AddIcon,
} from "@mui/icons-material";

import {
  getAppSettings,
  validatePasswordBySettings
} from "../../utils/appSettings";

interface Player {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    nickname?: string;
    position?: string;
    birthDate?: string;
}

interface PlayersManagementProps {
    userData: {
        email: string;
    };
}

const getPasswordRequirements = (password: string) => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
});

const PlayersManagement = ({ userData }: PlayersManagementProps) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [openModal, setOpenModal] = useState(false);
    const [newPlayer, setNewPlayer] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        nickname: "",
        position: "",
        birthDate: ""
    });
    const appSettings = getAppSettings();
    const tableSize = appSettings.compactTables ? "small" : "medium";
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(appSettings.rowsPerPage);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [playerToDelete, setPlayerToDelete] = useState<number | null>(null);
    const [messageError, setMessageError] = useState("");
    const [messageSuccess, setMessageSuccess] = useState("");
    const passwordRequirements = getPasswordRequirements(newPlayer.password);

    const fetchPlayers = async () => {
        if (!userData?.email) return;
        try {
            const response = await fetch(`http://localhost:8080/api/players?adminEmail=${encodeURIComponent(userData.email)}`);
            if (response.ok) {
                const data = await response.json();
                setPlayers(data);
            }
        } catch (error) {
            console.error("Błąd pobierania:", error);
        }
    };

    useEffect(() => {
        fetchPlayers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData?.email]);

useEffect(() => {
  if (!getAppSettings().autoRefreshData) return;

  const interval = setInterval(() => {
    fetchPlayers();
  }, 10000);

  return () => clearInterval(interval);
}, [userData?.email]);

useEffect(() => {
    if (!messageError && !messageSuccess) return;

    const timer = setTimeout(() => {
        setMessageError("");
        setMessageSuccess("");
    }, 3000);

    return () => clearTimeout(timer);
}, [messageError, messageSuccess]);

    const handleAddPlayer = async () => {
        setMessageError("");
        setMessageSuccess("");

        if (!newPlayer.firstName || !newPlayer.lastName || !newPlayer.email) {
            setMessageError("Wypełnij wymagane pola.");
            return;
        }

        const passwordError = validatePasswordBySettings(newPlayer.password);

        if (passwordError) {
            setMessageError(passwordError);
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/players", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newPlayer,
                    createdByEmail: userData.email
                })
            });

            if (response.ok) {
                setOpenModal(false);
                setNewPlayer({
                    firstName: "", lastName: "", email: "",
                    password: "", nickname: "", position: "", birthDate: ""
                });
                fetchPlayers();
            }
        } catch (error) {
            console.error("Błąd dodawania:", error);
        }
    };

    const handleChangePage = (_event: unknown, newPage: number) => {
      setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    };

    const handleDeletePlayer = async (id: number) => {
      const response = await fetch(`http://localhost:8080/api/players/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchPlayers();
        setMessageSuccess("Zawodnik został usunięty.");
      } else {
        setMessageError("Nie udało się usunąć zawodnika.");
      }

      setConfirmDeleteOpen(false);
      setPlayerToDelete(null);
    };

    return (
        <>
            <Paper elevation={8} sx={{ p: 4, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", color: "#fff" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight={700}>Zarządzanie zawodnikami</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" } }}
                    onClick={() => setOpenModal(true)}
                >
                    Dodaj zawodnika
                </Button>
            </Box>

            {messageError && <Alert severity="error" sx={{ mb: 2 }}>{messageError}</Alert>}
            {messageSuccess && <Alert severity="success" sx={{ mb: 2 }}>{messageSuccess}</Alert>}

            <TableContainer>
                <Table size={tableSize} sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: "#FF6A00", fontWeight: 'bold' }}>Imię i Nazwisko</TableCell>
                            <TableCell sx={{ color: "#FF6A00", fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ color: "#FF6A00", fontWeight: 'bold' }}>Pseudonim</TableCell>
                            <TableCell sx={{ color: "#FF6A00", fontWeight: 'bold' }}>Pozycja</TableCell>
                            <TableCell align="right" sx={{ color: "#FF6A00", fontWeight: 'bold' }}>Akcje</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {players
                            .slice(
                                page * rowsPerPage,
                                page * rowsPerPage + rowsPerPage
                            )
                            .map((player) => (
                            <TableRow key={player.id} sx={{ '& td': { color: "#fff" } }}>
                                <TableCell>{player.firstName} {player.lastName}</TableCell>
                                <TableCell>{player.email}</TableCell>
                                <TableCell>{player.nickname || "-"}</TableCell>
                                <TableCell>{player.position || "-"}</TableCell>
                                <TableCell align="right">
                                    <IconButton
                                      onClick={() => {
                                        if (getAppSettings().confirmDangerousActions) {
                                          setPlayerToDelete(player.id);
                                          setConfirmDeleteOpen(true);
                                        } else {
                                          handleDeletePlayer(player.id);
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
                    </Paper>

                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={players.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(_event, newPage) => setPage(newPage)}
                            onRowsPerPageChange={(event) => {
                                setRowsPerPage(parseInt(event.target.value, 10));
                                setPage(0);
                            }}
                            sx={{
                                color: "#fff",
                                "& .MuiTablePagination-selectIcon": { color: "#fff" },
                                "& .MuiTablePagination-select": { color: "#fff" },
                            }}
                        />
                    </Box>

                    <Dialog open={openModal} onClose={() => setOpenModal(false)} PaperProps={{ sx: { bgcolor: "#1A1A1A", color: "#fff", minWidth: "450px" } }}>
                <DialogTitle>Utwórz konto zawodnika</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
                {messageError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {messageError}
                  </Alert>
                )}
                    <Box display="flex" gap={2}>
                        <TextField label="Imię" fullWidth InputLabelProps={{ sx: { color: "#ccc" } }} inputProps={{ sx: { color: "#fff" } }} onChange={(e) => setNewPlayer({...newPlayer, firstName: e.target.value})} />
                        <TextField label="Nazwisko" fullWidth InputLabelProps={{ sx: { color: "#ccc" } }} inputProps={{ sx: { color: "#fff" } }} onChange={(e) => setNewPlayer({...newPlayer, lastName: e.target.value})} />
                    </Box>
                    <TextField label="Email (Login)" fullWidth InputLabelProps={{ sx: { color: "#ccc" } }} inputProps={{ sx: { color: "#fff" } }} onChange={(e) => setNewPlayer({...newPlayer, email: e.target.value})} />
                    <TextField label="Hasło" type="password" fullWidth InputLabelProps={{ sx: { color: "#ccc" } }} inputProps={{ sx: { color: "#fff" } }} onChange={(e) => setNewPlayer({...newPlayer, password: e.target.value})} />
                    {getAppSettings().requireStrongPassword && (
                        <Box sx={{ ml: 1, mt: -1 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    display: "block",
                                    color: passwordRequirements.length ? "#4caf50" : "#ff6b6b",
                                }}
                            >
                                {passwordRequirements.length ? "✓" : "✗"} Minimum 8 znaków
                            </Typography>

                            <Typography
                                variant="caption"
                                sx={{
                                    display: "block",
                                    color: passwordRequirements.upper ? "#4caf50" : "#ff6b6b",
                                }}
                            >
                                {passwordRequirements.upper ? "✓" : "✗"} Wielka litera
                            </Typography>

                            <Typography
                                variant="caption"
                                sx={{
                                    display: "block",
                                    color: passwordRequirements.lower ? "#4caf50" : "#ff6b6b",
                                }}
                            >
                                {passwordRequirements.lower ? "✓" : "✗"} Mała litera
                            </Typography>

                            <Typography
                                variant="caption"
                                sx={{
                                    display: "block",
                                    color: passwordRequirements.digit ? "#4caf50" : "#ff6b6b",
                                }}
                            >
                                {passwordRequirements.digit ? "✓" : "✗"} Cyfra
                            </Typography>

                            <Typography
                                variant="caption"
                                sx={{
                                    display: "block",
                                    color: passwordRequirements.special ? "#4caf50" : "#ff6b6b",
                                }}
                            >
                                {passwordRequirements.special ? "✓" : "✗"} Znak specjalny
                            </Typography>
                        </Box>
                    )}
                    <TextField label="Pseudonim" fullWidth InputLabelProps={{ sx: { color: "#ccc" } }} inputProps={{ sx: { color: "#fff" } }} onChange={(e) => setNewPlayer({...newPlayer, nickname: e.target.value})} />
                    <TextField label="Pozycja/Rola" fullWidth InputLabelProps={{ sx: { color: "#ccc" } }} inputProps={{ sx: { color: "#fff" } }} onChange={(e) => setNewPlayer({...newPlayer, position: e.target.value})} />
                    <TextField type="date" label="Data urodzenia" fullWidth InputLabelProps={{ shrink: true, sx: { color: "#ccc" } }} inputProps={{ sx: { color: "#fff" } }} onChange={(e) => setNewPlayer({...newPlayer, birthDate: e.target.value})} />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenModal(false)} sx={{ color: "#fff" }}>Anuluj</Button>
                    <Button onClick={handleAddPlayer} variant="contained" sx={{ bgcolor: "#FF6A00" }}>Zarejestruj</Button>
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
              <DialogTitle>Usuń zawodnika</DialogTitle>

              <DialogContent>
                <Typography>
                  Czy na pewno chcesz usunąć tego zawodnika?
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
                    if (playerToDelete !== null) {
                      handleDeletePlayer(playerToDelete);
                    }
                  }}
                >
                  Usuń
                </Button>
              </DialogActions>
            </Dialog>

          </>
    );
};

export default PlayersManagement;