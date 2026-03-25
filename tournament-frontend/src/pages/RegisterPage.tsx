import { useState } from "react";
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Checkbox,
    FormControlLabel,
    Paper,
} from "@mui/material";
import backgroundImage from "../photos/img2.jpg";

const RegisterPage = () => {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        birthDate: "",
        email: "",
        password: "",
        confirmPassword: "",
        isCaptain: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (form.password !== form.confirmPassword) {
            alert("Hasła nie są takie same!");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstName: form.firstName,
                    lastName: form.lastName,
                    birthDate: form.birthDate,
                    email: form.email,
                    password: form.password,
                    isCaptain: form.isCaptain,
                }),
            });

            if (response.ok) {
                alert("Rejestracja zakończona!");
            } else {
                alert("Błąd rejestracji!");
            }
        } catch (error) {
            console.error("Błąd połączenia:", error);
            alert("Nie udało się połączyć z serwerem.");
        }
    };


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
            <Container maxWidth="sm">
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
                    <Typography variant="h4" fontWeight={700} textAlign="center" mb={3}>
                        Załóż konto
                    </Typography>

                    <form onSubmit={handleSubmit}>
                        <Box display="flex" flexDirection="column" gap={2}>
                            <TextField
                                label="Imię"
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                fullWidth
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                sx={{ input: { color: "#fff" } }}
                            />

                            <TextField
                                label="Nazwisko"
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                fullWidth
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                sx={{ input: { color: "#fff" } }}
                            />

                            <TextField
                                label="Data urodzenia"
                                type="date"
                                name="birthDate"
                                value={form.birthDate}
                                onChange={handleChange}
                                fullWidth
                                InputLabelProps={{ shrink: true, style: { color: "#ccc" } }}
                                sx={{ input: { color: "#fff" } }}
                            />

                            <TextField
                                label="Email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                fullWidth
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                sx={{ input: { color: "#fff" } }}
                            />

                            <TextField
                                label="Hasło"
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                fullWidth
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                sx={{ input: { color: "#fff" } }}
                            />

                            <TextField
                                label="Powtórz hasło"
                                type="password"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                fullWidth
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                sx={{ input: { color: "#fff" } }}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="isCaptain"
                                        checked={form.isCaptain}
                                        onChange={handleChange}
                                        sx={{
                                            color: "#FF6A00",
                                            "&.Mui-checked": { color: "#FF6A00" },
                                        }}
                                    />
                                }
                                label="Jestem kapitanem drużyny. Chcę ubiegać się o uprawnienia administratora, aby móc rejestrować zawodników i turnieje."
                                sx={{ color: "#fff" }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                sx={{
                                    bgcolor: "#FF6A00",
                                    "&:hover": { bgcolor: "#cc5500" },
                                }}
                            >
                                Zarejestruj się
                            </Button>
                        </Box>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
};

export default RegisterPage;
