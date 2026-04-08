
import { Box, Container, Paper, Typography, Button, Avatar, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import backgroundImage from "../photos/img2.jpg";

type UserData = {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
};

const UserPanel = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        console.log("Dane z localStorage:", storedUser);
        
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUserData(parsedUser);
                console.log("Sparsowane dane:", parsedUser);
            } catch (error) {
                console.error("Błąd parsowania danych:", error);
                localStorage.removeItem("user");
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!loading && !userData) {
            console.log("Brak danych - przekierowanie do rejestracji");
            navigate("/register");
        }
    }, [loading, userData, navigate]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/register");
    };

    const getRoleColor = (role: string) => {
        return role === "admin" ? "#FF6A00" : "#4caf50";
    };

    const getRoleLabel = (role: string) => {
        return role === "admin" ? "Administrator" : "Zwykły użytkownik";
    };

    if (loading) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography>Ładowanie panelu...</Typography>
            </Box>
        );
    }

    if (!userData) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography>Brak danych użytkownika. Przekierowywanie...</Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
            }}
        >
            <Container maxWidth="md">
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
                    {}
                    <Box display="flex" alignItems="center" gap={3} mb={4}>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                bgcolor: "#FF6A00",
                                fontSize: 32,
                            }}
                        >
                            {userData.firstName?.[0] || "?"}{userData.lastName?.[0] || "?"}
                        </Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight={700}>
                                Witaj, {userData.firstName} {userData.lastName}!
                            </Typography>
                            <Chip
                                label={getRoleLabel(userData.role)}
                                sx={{
                                    mt: 1,
                                    bgcolor: getRoleColor(userData.role),
                                    color: "#fff",
                                    fontWeight: "bold",
                                }}
                            />
                        </Box>
                    </Box>

                    {}
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: "#FF6A00" }}>
                            Twoje dane:
                        </Typography>
                        
                        <Paper
                            elevation={2}
                            sx={{
                                p: 3,
                                mt: 2,
                                bgcolor: "rgba(255,255,255,0.1)",
                                borderRadius: 2,
                            }}
                        >
                            <Box display="flex" flexDirection="column" gap={2}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ color: "#ccc" }}>
                                        Imię i nazwisko
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                        {userData.firstName} {userData.lastName}
                                    </Typography>
                                </Box>
                                
                                <Box>
                                    <Typography variant="subtitle2" sx={{ color: "#ccc" }}>
                                        Adres email
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                        {userData.email}
                                    </Typography>
                                </Box>
                                
                                <Box>
                                    <Typography variant="subtitle2" sx={{ color: "#ccc" }}>
                                        Rola w systemie
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                        {userData.role === "admin" ? "Administrator" : "Użytkownik"}
                                    </Typography>
                                    {userData.role === "admin" && (
                                        <Typography variant="caption" sx={{ color: "#FF6A00" }}>
                                            ✅ Masz uprawnienia do zarządzania turniejami i zawodnikami
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Paper>
                    </Box>

                    {}
                    <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
                        <Button
                            variant="outlined"
                            onClick={handleLogout}
                            sx={{
                                color: "#fff",
                                borderColor: "#FF6A00",
                                "&:hover": {
                                    borderColor: "#cc5500",
                                    bgcolor: "rgba(255,106,0,0.1)",
                                },
                            }}
                        >
                            Wyloguj się
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default UserPanel;