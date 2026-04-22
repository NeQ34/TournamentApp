import { useState, useEffect, useCallback } from "react";
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
} from "@mui/material";
import {
    Delete as DeleteIcon,
    Add as AddIcon,
} from "@mui/icons-material";

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

    const fetchPlayers = useCallback(async () => {
        if (!userData?.email) return;
        try {
            const response = await fetch(`http://localhost:8080/api/players?adminEmail=${userData.email}`);
            if (response.ok) {
                const data = await response.json();
                setPlayers(data);
            }
        } catch (error) {
            console.error("Błąd pobierania:", error);
        }
    }, [userData?.email]);

    useEffect(() => {
        fetchPlayers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Pobierz raz przy zamontowaniu komponentu

    const handleAddPlayer = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/players", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...newPlayer, createdByEmail: userData.email })
            });

            if (response.ok) {
                setOpenModal(false);
                fetchPlayers();
                setNewPlayer({
                    firstName: "", lastName: "", email: "",
                    password: "", nickname: "", position: "", birthDate: ""
                });
            }
        } catch (error) {
            console.error("Błąd dodawania zawodnika:", error);
        }
    };

    const handleDeletePlayer = async (id: number) => {
        if (window.confirm("Czy na pewno chcesz usunąć tego zawodnika?")) {
            await fetch(`http://localhost:8080/api/players/${id}`, { method: "DELETE" });
            fetchPlayers();
        }
    };

    return (
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

            <TableContainer>
                <Table sx={{ minWidth: 650 }}>
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
                        {players.map((player) => (
                            <TableRow key={player.id} sx={{ '& td': { color: "#fff" } }}>
                                <TableCell>{player.firstName} {player.lastName}</TableCell>
                                <TableCell>{player.email}</TableCell>
                                <TableCell>{player.nickname || "-"}</TableCell>
                                <TableCell>{player.position || "-"}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleDeletePlayer(player.id)} sx={{ color: "#ff6b6b" }}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} PaperProps={{ sx: { bgcolor: "#1A1A1A", color: "#fff", minWidth: "450px" } }}>
                <DialogTitle>Utwórz konto zawodnika</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
                    <Box display="flex" gap={2}>
                        <TextField label="Imię" fullWidth InputLabelProps={{ sx: { color: "#ccc" } }} inputProps={{ sx: { color: "#fff" } }} onChange={(e) => setNewPlayer({...newPlayer, firstName: e.target.value})} />
                        <TextField label="Nazwisko" fullWidth InputLabelProps={{ sx: { color: "#ccc" } }} inputProps={{ sx: { color: "#fff" } }} onChange={(e) => setNewPlayer({...newPlayer, lastName: e.target.value})} />
                    </Box>
                    <TextField label="Email (Login)" fullWidth InputLabelProps={{ sx: { color: "#ccc" } }} inputProps={{ sx: { color: "#fff" } }} onChange={(e) => setNewPlayer({...newPlayer, email: e.target.value})} />
                    <TextField label="Hasło" type="password" fullWidth InputLabelProps={{ sx: { color: "#ccc" } }} inputProps={{ sx: { color: "#fff" } }} onChange={(e) => setNewPlayer({...newPlayer, password: e.target.value})} />
                    <TextField label="Pseudonim" fullWidth InputLabelProps={{ sx: { color: "#ccc" } }} inputProps={{ sx: { color: "#fff" } }} onChange={(e) => setNewPlayer({...newPlayer, nickname: e.target.value})} />
                    <TextField label="Pozycja/Rola" fullWidth InputLabelProps={{ sx: { color: "#ccc" } }} inputProps={{ sx: { color: "#fff" } }} onChange={(e) => setNewPlayer({...newPlayer, position: e.target.value})} />
                    <TextField type="date" label="Data urodzenia" fullWidth InputLabelProps={{ shrink: true, sx: { color: "#ccc" } }} inputProps={{ sx: { color: "#fff" } }} onChange={(e) => setNewPlayer({...newPlayer, birthDate: e.target.value})} />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenModal(false)} sx={{ color: "#fff" }}>Anuluj</Button>
                    <Button onClick={handleAddPlayer} variant="contained" sx={{ bgcolor: "#FF6A00" }}>Zarejestruj</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default PlayersManagement;