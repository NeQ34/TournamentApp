import { useState, useEffect } from "react";
import {
    Box, Button, Typography, Paper, TextField, Alert, Avatar, Divider,
} from "@mui/material";
import { Save as SaveIcon, Lock as LockIcon } from "@mui/icons-material";

interface UserData {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

const MyProfile = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ firstName: "", lastName: "" });
    const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [message, setMessage] = useState({ error: "", success: "" });
    const [passwordMessage, setPasswordMessage] = useState({ error: "", success: "" });

    // Wczytaj dane z localStorage przy starcie
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setUserData({
                id: user.id || 1,
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",
                role: user.role || "admin",
            });
            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
            });
        } else {
            // Domyślne dane jeśli nic nie ma w localStorage
            const defaultUser = {
                id: 1,
                firstName: "Jan",
                lastName: "Kowalski",
                email: "admin@example.com",
                role: "admin",
            };
            setUserData(defaultUser);
            setFormData({ firstName: "Jan", lastName: "Kowalski" });
            localStorage.setItem("user", JSON.stringify(defaultUser));
        }
    }, []);

    // Aktualizacja danych osobowych
    const handleUpdateProfile = () => {
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            setMessage({ error: "Imię i nazwisko są wymagane.", success: "" });
            return;
        }

        // Zaktualizuj dane w localStorage
        const updatedUser = {
            ...userData!,
            firstName: formData.firstName,
            lastName: formData.lastName,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUserData(updatedUser);
        
        setMessage({ error: "", success: "Dane zostały zaktualizowane." });
        setEditMode(false);
        
        // Ukryj komunikat po 3 sekundach
        setTimeout(() => setMessage({ error: "", success: "" }), 3000);
    };

    // Zmiana hasła (tylko localStorage)
    const handleChangePassword = () => {
        if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordMessage({ error: "Wszystkie pola są wymagane.", success: "" });
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

        // Sprawdź stare hasło (dla symulacji – możesz dodać własne hasło w localStorage)
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const savedPassword = localStorage.getItem("user_password") || "admin123";
        
        if (passwordData.oldPassword !== savedPassword) {
            setPasswordMessage({ error: "Stare hasło jest nieprawidłowe.", success: "" });
            return;
        }

        // Zapisz nowe hasło
        localStorage.setItem("user_password", passwordData.newPassword);
        setPasswordMessage({ error: "", success: "Hasło zostało zmienione." });
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        
        // Ukryj komunikat po 3 sekundach
        setTimeout(() => setPasswordMessage({ error: "", success: "" }), 3000);
    };

    if (!userData) return null;

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: "#fff", mb: 3 }}>Mój profil</Typography>
            
            <Paper sx={{ p: 4, borderRadius: 4, bgcolor: "rgba(0,0,0,0.7)", color: "#fff" }}>
                {/* Avatar */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4 }}>
                    <Avatar sx={{ width: 80, height: 80, bgcolor: "#FF6A00", fontSize: 32 }}>
                        {userData.firstName?.[0]}{userData.lastName?.[0]}
                    </Avatar>
                    <Box>
                        <Typography variant="h5">{userData.firstName} {userData.lastName}</Typography>
                        <Typography variant="body2">{userData.email}</Typography>
                        <Typography variant="caption" sx={{ color: "#FF6A00" }}>{userData.role === "admin" ? "Administrator" : "Użytkownik"}</Typography>
                    </Box>
                </Box>

                {/* Komunikaty */}
                {message.error && <Alert severity="error" sx={{ mb: 2 }}>{message.error}</Alert>}
                {message.success && <Alert severity="success" sx={{ mb: 2 }}>{message.success}</Alert>}

                {/* Dane osobowe */}
                <Typography variant="h6" sx={{ color: "#FF6A00", mb: 2 }}>Dane osobowe</Typography>
                
                {!editMode ? (
                    <>
                        <Box sx={{ display: "flex", gap: 3, mb: 2, flexWrap: "wrap" }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: "#aaa" }}>Imię</Typography>
                                <Typography>{userData.firstName}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: "#aaa" }}>Nazwisko</Typography>
                                <Typography>{userData.lastName}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: "#aaa" }}>Email</Typography>
                                <Typography>{userData.email}</Typography>
                            </Box>
                        </Box>
                        <Button variant="outlined" onClick={() => setEditMode(true)} sx={{ color: "#FF6A00", borderColor: "#FF6A00" }}>
                            Edytuj dane
                        </Button>
                    </>
                ) : (
                    <Box>
                        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
                            <TextField 
                                label="Imię" 
                                value={formData.firstName} 
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
                                sx={{ flex: 1, minWidth: 200 }}
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                inputProps={{ style: { color: "#fff" } }}
                            />
                            <TextField 
                                label="Nazwisko" 
                                value={formData.lastName} 
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
                                sx={{ flex: 1, minWidth: 200 }}
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                inputProps={{ style: { color: "#fff" } }}
                            />
                        </Box>
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <Button variant="contained" onClick={handleUpdateProfile} startIcon={<SaveIcon />} sx={{ bgcolor: "#FF6A00" }}>
                                Zapisz
                            </Button>
                            <Button variant="outlined" onClick={() => setEditMode(false)} sx={{ color: "#ccc", borderColor: "#ccc" }}>
                                Anuluj
                            </Button>
                        </Box>
                    </Box>
                )}

                <Divider sx={{ my: 4, bgcolor: "rgba(255,255,255,0.1)" }} />

                {/* Zmiana hasła */}
                <Typography variant="h6" sx={{ color: "#FF6A00", mb: 2 }}>Zmiana hasła</Typography>
                
                {passwordMessage.error && <Alert severity="error" sx={{ mb: 2 }}>{passwordMessage.error}</Alert>}
                {passwordMessage.success && <Alert severity="success" sx={{ mb: 2 }}>{passwordMessage.success}</Alert>}
                
                <Box sx={{ maxWidth: 400 }}>
                    <TextField 
                        type="password" 
                        label="Stare hasło" 
                        fullWidth 
                        value={passwordData.oldPassword} 
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })} 
                        sx={{ mb: 2 }}
                        InputLabelProps={{ style: { color: "#ccc" } }}
                        inputProps={{ style: { color: "#fff" } }}
                    />
                    <TextField 
                        type="password" 
                        label="Nowe hasło" 
                        fullWidth 
                        value={passwordData.newPassword} 
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
                        sx={{ mb: 2 }}
                        InputLabelProps={{ style: { color: "#ccc" } }}
                        inputProps={{ style: { color: "#fff" } }}
                        helperText="Minimum 6 znaków"
                    />
                    <TextField 
                        type="password" 
                        label="Potwierdź nowe hasło" 
                        fullWidth 
                        value={passwordData.confirmPassword} 
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
                        sx={{ mb: 2 }}
                        InputLabelProps={{ style: { color: "#ccc" } }}
                        inputProps={{ style: { color: "#fff" } }}
                    />
                    <Button variant="contained" onClick={handleChangePassword} startIcon={<LockIcon />} sx={{ bgcolor: "#FF6A00" }}>
                        Zmień hasło
                    </Button>
                    <Typography variant="caption" sx={{ color: "#aaa", display: "block", mt: 1 }}>
                        Domyślne hasło: admin123
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default MyProfile;