// src/components/admin/MyProfile.tsx
import { useState, useEffect } from "react";
import {
    Box,
    Button,
    Typography,
    Paper,
    TextField,
    Alert,
    CircularProgress,
    Avatar,
    Divider,
} from "@mui/material";
import { Save as SaveIcon, Lock as LockIcon } from "@mui/icons-material";

interface UserData {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    createdAt?: string;
    lastLogin?: string;
}

const MyProfile = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
    });
    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [message, setMessage] = useState({ error: "", success: "" });
    const [passwordMessage, setPasswordMessage] = useState({ error: "", success: "" });
    const [updating, setUpdating] = useState(false);

    // Pobierz dane użytkownika
    const fetchUserData = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/admin/profile", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setUserData(data);
                setFormData({
                    firstName: data.firstName,
                    lastName: data.lastName,
                });
            } else {
                setMessage({ error: "Nie udało się pobrać danych profilu.", success: "" });
            }
        } catch (error) {
            console.error("Błąd:", error);
            setMessage({ error: "Nie udało się połączyć z serwerem.", success: "" });
        } finally {
            setLoading(false);
        }
    };

    // Aktualizacja danych osobowych
    const handleUpdateProfile = async () => {
        setMessage({ error: "", success: "" });
        setUpdating(true);

        try {
            const response = await fetch("http://localhost:8080/api/admin/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                }),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUserData(updatedUser);
                setEditMode(false);
                setMessage({ error: "", success: "Dane zostały zaktualizowane." });
                
                // Aktualizuj też dane w localStorage
                const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
                storedUser.firstName = updatedUser.firstName;
                storedUser.lastName = updatedUser.lastName;
                localStorage.setItem("user", JSON.stringify(storedUser));
            } else {
                const error = await response.json();
                setMessage({ error: error.message || "Błąd aktualizacji danych.", success: "" });
            }
        } catch (error) {
            console.error("Błąd:", error);
            setMessage({ error: "Nie udało się połączyć z serwerem.", success: "" });
        } finally {
            setUpdating(false);
        }
    };

    // Zmiana hasła
    const handleChangePassword = async () => {
        setPasswordMessage({ error: "", success: "" });

        if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordMessage({ error: "Wszystkie pola hasła są wymagane.", success: "" });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ error: "Nowe hasło i potwierdzenie nie są zgodne.", success: "" });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordMessage({ error: "Nowe hasło musi mieć co najmniej 6 znaków.", success: "" });
            return;
        }

        setUpdating(true);

        try {
            const response = await fetch("http://localhost:8080/api/admin/profile/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    oldPassword: passwordData.oldPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            if (response.ok) {
                setPasswordMessage({ error: "", success: "Hasło zostało zmienione." });
                setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                const error = await response.json();
                setPasswordMessage({ error: error.message || "Błąd zmiany hasła.", success: "" });
            }
        } catch (error) {
            console.error("Błąd:", error);
            setPasswordMessage({ error: "Nie udało się połączyć z serwerem.", success: "" });
        } finally {
            setUpdating(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

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
                Mój profil
            </Typography>

            <Paper
                elevation={8}
                sx={{
                    p: 4,
                    borderRadius: 4,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    backdropFilter: "blur(6px)",
                    color: "#fff",
                }}
            >
                {/* Avatar i podstawowe info */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4 }}>
                    <Avatar
                        sx={{
                            width: 80,
                            height: 80,
                            bgcolor: "#FF6A00",
                            fontSize: 32,
                        }}
                    >
                        {userData?.firstName?.[0]}{userData?.lastName?.[0]}
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            {userData?.firstName} {userData?.lastName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            {userData?.role === "admin" ? "Administrator" : "Użytkownik"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                            {userData?.email}
                        </Typography>
                    </Box>
                </Box>

                {/* Komunikaty */}
                {message.error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {message.error}
                    </Alert>
                )}
                {message.success && (
                    <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                        {message.success}
                    </Alert>
                )}

                {/* Dane osobowe */}
                <Typography variant="h6" sx={{ color: "#FF6A00", mb: 2 }}>
                    Dane osobowe
                </Typography>

                {!editMode ? (
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                                    Imię
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {userData?.firstName}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                                    Nazwisko
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {userData?.lastName}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                                    Email
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {userData?.email}
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="outlined"
                            onClick={() => setEditMode(true)}
                            sx={{ color: "#FF6A00", borderColor: "#FF6A00" }}
                        >
                            Edytuj dane
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 3 }}>
                            <TextField
                                label="Imię"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                sx={{ flex: 1 }}
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                inputProps={{ style: { color: "#fff" } }}
                            />
                            <TextField
                                label="Nazwisko"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                sx={{ flex: 1 }}
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                inputProps={{ style: { color: "#fff" } }}
                            />
                        </Box>
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <Button
                                variant="contained"
                                onClick={handleUpdateProfile}
                                disabled={updating}
                                startIcon={<SaveIcon />}
                                sx={{ bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" } }}
                            >
                                {updating ? "Zapisywanie..." : "Zapisz"}
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setEditMode(false);
                                    setFormData({
                                        firstName: userData?.firstName || "",
                                        lastName: userData?.lastName || "",
                                    });
                                }}
                                sx={{ color: "#ccc", borderColor: "#ccc" }}
                            >
                                Anuluj
                            </Button>
                        </Box>
                    </Box>
                )}

                <Divider sx={{ my: 4, bgcolor: "rgba(255,255,255,0.1)" }} />

                {/* Zmiana hasła */}
                <Typography variant="h6" sx={{ color: "#FF6A00", mb: 2 }}>
                    Zmiana hasła
                </Typography>

                {passwordMessage.error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {passwordMessage.error}
                    </Alert>
                )}
                {passwordMessage.success && (
                    <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                        {passwordMessage.success}
                    </Alert>
                )}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 400 }}>
                    <TextField
                        type="password"
                        label="Stare hasło"
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        fullWidth
                        InputLabelProps={{ style: { color: "#ccc" } }}
                        inputProps={{ style: { color: "#fff" } }}
                    />
                    <TextField
                        type="password"
                        label="Nowe hasło"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        fullWidth
                        InputLabelProps={{ style: { color: "#ccc" } }}
                        inputProps={{ style: { color: "#fff" } }}
                        helperText="Minimum 6 znaków"
                    />
                    <TextField
                        type="password"
                        label="Potwierdź nowe hasło"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        fullWidth
                        InputLabelProps={{ style: { color: "#ccc" } }}
                        inputProps={{ style: { color: "#fff" } }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleChangePassword}
                        disabled={updating}
                        startIcon={<LockIcon />}
                        sx={{ bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" }, alignSelf: "flex-start" }}
                    >
                        {updating ? "Zmienianie..." : "Zmień hasło"}
                    </Button>
                </Box>

                {/* Informacje dodatkowe */}
                <Divider sx={{ my: 4, bgcolor: "rgba(255,255,255,0.1)" }} />

                <Typography variant="h6" sx={{ color: "#FF6A00", mb: 2 }}>
                    Informacje o koncie
                </Typography>

                <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    <Box>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                            Rola
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {userData?.role === "admin" ? "Administrator" : "Użytkownik"}
                        </Typography>
                    </Box>
                    {userData?.createdAt && (
                        <Box>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                                Data rejestracji
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {new Date(userData.createdAt).toLocaleDateString("pl-PL")}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default MyProfile;