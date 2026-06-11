import { useState, useEffect } from "react";
import {
    Box, Button, Typography, Paper, TextField, Alert, Avatar, Divider, CircularProgress,
} from "@mui/material";
import { Save as SaveIcon, Lock as LockIcon } from "@mui/icons-material";
import {
    getAppSettings,
    validatePasswordBySettings,
} from "../../utils/appSettings";

interface UserData {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

const getPasswordRequirements = (password: string) => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
});

const MyProfile = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ firstName: "", lastName: "" });
    const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [message, setMessage] = useState({ error: "", success: "" });
    const [passwordMessage, setPasswordMessage] = useState({ error: "", success: "" });
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const passwordRequirements = getPasswordRequirements(passwordData.newPassword);
    const strongPasswordRequired = getAppSettings().requireStrongPassword;
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

    // Pobierz dane z backendu
    const fetchUserProfile = async () => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;
        
        const localUser = JSON.parse(storedUser);
        const email = localUser.email;
        
        try {
            const response = await fetch(`http://localhost:8080/api/admin/profile?email=${email}`);
            
            if (response.ok) {
                const data = await response.json();
                setUserData(data);
                setFormData({
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                });
                // Zaktualizuj localStorage
                localStorage.setItem("user", JSON.stringify(data));
            } else {
                // Fallback do localStorage
                setUserData(localUser);
                setFormData({
                    firstName: localUser.firstName || "",
                    lastName: localUser.lastName || "",
                });
            }
        } catch (error) {
            console.error("Błąd pobierania:", error);
            setUserData(localUser);
            setFormData({
                firstName: localUser.firstName || "",
                lastName: localUser.lastName || "",
            });
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    // Aktualizacja danych osobowych - ZAPIS DO BAZY
    const handleUpdateProfile = async () => {
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            setMessage({ error: "Imię i nazwisko są wymagane.", success: "" });
            return;
        }

        setLoading(true);
        setMessage({ error: "", success: "" });

        try {
            const response = await fetch("http://localhost:8080/api/admin/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: userData?.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Zaktualizuj stan i localStorage
                setUserData(data);
                localStorage.setItem("user", JSON.stringify(data));
                setMessage({ error: "", success: "Dane zostały zapisane w bazie danych!" });
                setEditMode(false);
            } else {
                setMessage({ error: data.message || "Błąd aktualizacji", success: "" });
            }
        } catch (error) {
            console.error("Błąd:", error);
            setMessage({ error: "Nie udało się połączyć z serwerem", success: "" });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ error: "", success: "" }), 3000);
        }
    };

    // Zmiana hasła - ZAPIS DO BAZY
    const handleChangePassword = async () => {
        if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordMessage({ error: "Wszystkie pola są wymagane.", success: "" });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ error: "Nowe hasło i potwierdzenie nie są zgodne.", success: "" });
            return;
        }

        const passwordError = validatePasswordBySettings(passwordData.newPassword);

        if (passwordError) {
            setPasswordMessage({ error: passwordError, success: "" });
            return;
        }

        setPasswordLoading(true);
        setPasswordMessage({ error: "", success: "" });

        try {
            const response = await fetch("http://localhost:8080/api/admin/profile/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: userData?.email,
                    oldPassword: passwordData.oldPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setPasswordMessage({
                    error: "",
                    success: "Hasło zostało zmienione w bazie danych!"
                });

                setPasswordData({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                });

                setShowPasswordRequirements(false);
            } else {
                setPasswordMessage({ error: data.message || "Błąd zmiany hasła", success: "" });
            }
        } catch (error) {
            console.error("Błąd:", error);
            setPasswordMessage({ error: "Nie udało się połączyć z serwerem", success: "" });
        } finally {
            setPasswordLoading(false);
            setTimeout(() => setPasswordMessage({ error: "", success: "" }), 3000);
        }
    };

    if (!userData) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress sx={{ color: "#FF6A00" }} />
            </Box>
        );
    }

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
                            <Button 
                                variant="contained" 
                                onClick={handleUpdateProfile} 
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />} 
                                sx={{ bgcolor: "#FF6A00" }}
                            >
                                {loading ? "Zapisywanie..." : "Zapisz w bazie"}
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
                        onFocus={() => setShowPasswordRequirements(true)}
                        onBlur={() => {
                            if (!passwordData.newPassword) {
                                setShowPasswordRequirements(false);
                            }
                        }}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        sx={{ mb: 2 }}
                        InputLabelProps={{ style: { color: "#ccc" } }}
                        inputProps={{ style: { color: "#fff" } }}
                    />
                    {strongPasswordRequired && showPasswordRequirements && (
                        <Box sx={{ ml: 1, mt: -1, mb: 2 }}>
                            {[
                                ["Minimum 8 znaków", passwordRequirements.length],
                                ["Wielka litera", passwordRequirements.upper],
                                ["Mała litera", passwordRequirements.lower],
                                ["Cyfra", passwordRequirements.digit],
                                ["Znak specjalny", passwordRequirements.special],
                            ].map(([label, ok]) => (
                                <Typography
                                    key={String(label)}
                                    variant="caption"
                                    sx={{
                                        display: "block",
                                        color: ok ? "#4caf50" : "#ff6b6b",
                                    }}
                                >
                                    {ok ? "✓" : "✗"} {label}
                                </Typography>
                            ))}
                        </Box>
                    )}
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
                    <Button 
                        variant="contained" 
                        onClick={handleChangePassword} 
                        disabled={passwordLoading}
                        startIcon={passwordLoading ? <CircularProgress size={20} /> : <LockIcon />} 
                        sx={{ bgcolor: "#FF6A00" }}
                    >
                        {passwordLoading ? "Zmienianie..." : "Zmień hasło w bazie"}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default MyProfile;