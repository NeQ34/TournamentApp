import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Checkbox,
    FormControlLabel,
    Paper,
    Alert,
    CircularProgress,
} from "@mui/material";
import backgroundImage from "../photos/img2.jpg";


const registerSchema = z.object({
    firstName: z.string()
        .min(2, "Imię musi mieć co najmniej 2 znaki")
        .max(50, "Imię może mieć maksymalnie 50 znaków")
        .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+$/, "Imię może zawierać tylko litery"),
    
    lastName: z.string()
        .min(2, "Nazwisko musi mieć co najmniej 2 znaki")
        .max(50, "Nazwisko może mieć maksymalnie 50 znaków")
        .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+$/, "Nazwisko może zawierać tylko litery"),
    
    birthDate: z.string()
        .min(1, "Data urodzenia jest wymagana")
        .refine((date) => {
            const today = new Date();
            const birthDate = new Date(date);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age >= 18;
        }, "Musisz mieć co najmniej 18 lat"),
    
    email: z.string()
        .min(1, "Email jest wymagany")
        .email("Podaj poprawny adres email"),
    
    password: z.string()
        .min(8, "Hasło musi mieć co najmniej 8 znaków")
        .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
        .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
        .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
        .regex(/[!@#$%^&*]/, "Hasło musi zawierać co najmniej jeden znak specjalny (!@#$%^&*)"),
    
    confirmPassword: z.string()
        .min(1, "Potwierdzenie hasła jest wymagane"),
    
    isCaptain: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są takie same",
    path: ["confirmPassword"],
});


type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage = () => {
    const navigate = useNavigate();
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        reset,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            birthDate: "",
            email: "",
            password: "",
            confirmPassword: "",
            isCaptain: false,
        },
        mode: "onChange",
    });


    const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    setSuccessMessage(null);

    if (data.password !== data.confirmPassword) {
        setError("confirmPassword", {
            type: "manual",
            message: "Hasła nie są takie same"
        });
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                firstName: data.firstName,
                lastName: data.lastName,
                birthDate: data.birthDate,
                email: data.email,
                password: data.password,
                isCaptain: data.isCaptain,
            }),
        });

        if (response.ok) {
            const userData = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                role: data.isCaptain ? "admin" : "user"
            };
            
            localStorage.setItem("user", JSON.stringify(userData));
            console.log("Zapisano dane użytkownika:", userData);
            
            const saved = localStorage.getItem("user");
            console.log("Sprawdzenie zapisu:", saved);
            
            setSuccessMessage("Rejestracja zakończona pomyślnie!");
            
            setTimeout(() => {
                navigate("/panel");
            }, 1500);
            
            reset();
        } else {
            let errorMessage = "Błąd rejestracji";
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                console.log("Nie można odczytać błędu");
            }
            
            if (errorMessage === "Email already exists") {
                setError("email", {
                    type: "manual",
                    message: "Ten adres email jest już zajęty"
                });
            } else {
                setServerError(errorMessage);
            }
        }
    } catch (error) {
        console.error("Błąd połączenia:", error);
        setServerError("Nie udało się połączyć z serwerem.");
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

                    {serverError && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                            {serverError}
                        </Alert>
                    )}

                    {successMessage && (
                        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                            {successMessage}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Box display="flex" flexDirection="column" gap={2}>
                            <TextField
                                label="Imię"
                                {...register("firstName")}
                                error={!!errors.firstName}
                                helperText={errors.firstName?.message}
                                fullWidth
                                disabled={isSubmitting}
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                sx={{
                                    input: { color: "#fff" },
                                    "& .MuiFormHelperText-root": { color: "#fab1a0", fontSize: "20px" }
                                }}
                            />

                            <TextField
                                label="Nazwisko"
                                {...register("lastName")}
                                error={!!errors.lastName}
                                helperText={errors.lastName?.message}
                                fullWidth
                                disabled={isSubmitting}
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                sx={{
                                    input: { color: "#fff" },
                                    "& .MuiFormHelperText-root": { color: "#ff6b6b", fontSize: "20px" }
                                }}
                            />

                            <TextField
                                label="Data urodzenia"
                                type="date"
                                {...register("birthDate")}
                                error={!!errors.birthDate}
                                helperText={errors.birthDate?.message}
                                fullWidth
                                disabled={isSubmitting}
                                InputLabelProps={{ shrink: true, style: { color: "#ccc" } }}
                                sx={{
                                    input: { color: "#fff" },
                                    "& .MuiFormHelperText-root": { color: "#ff6b6b", fontSize: "20px" }
                                }}
                            />

                            <TextField
                                label="Email"
                                type="email"
                                {...register("email")}
                                error={!!errors.email}
                                helperText={errors.email?.message}
                                fullWidth
                                disabled={isSubmitting}
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                sx={{
                                    input: { color: "#fff" },
                                    "& .MuiFormHelperText-root": { color: "#ff6b6b", fontSize: "20px" }
                                }}
                            />

                            <TextField
                                label="Hasło"
                                type="password"
                                {...register("password")}
                                error={!!errors.password}
                                helperText={errors.password?.message}
                                fullWidth
                                disabled={isSubmitting}
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                sx={{
                                    input: { color: "#fff" },
                                    "& .MuiFormHelperText-root": { color: "#ff6b6b", fontSize: "20px" }
                                }}
                            />

                            <TextField
                                label="Powtórz hasło"
                                type="password"
                                {...register("confirmPassword")}
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword?.message}
                                fullWidth
                                disabled={isSubmitting}
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                sx={{
                                    input: { color: "#fff" },
                                    "& .MuiFormHelperText-root": { color: "#ff6b6b", fontSize: "20px" }
                                }}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        {...register("isCaptain")}
                                        sx={{
                                            color: "#FF6A00",
                                            "&.Mui-checked": { color: "#FF6A00" },
                                        }}
                                        disabled={isSubmitting}
                                    />
                                }
                                label="Jestem kapitanem drużyny. Chcę ubiegać się o uprawnienia administratora, aby móc rejestrować zawodników i turnieje."
                                sx={{ color: "#fff" }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={isSubmitting}
                                sx={{
                                    bgcolor: "#FF6A00",
                                    "&:hover": { bgcolor: "#cc5500" },
                                    "&.Mui-disabled": { bgcolor: "#cc5500", opacity: 0.7 }
                                }}
                            >
                                {isSubmitting ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    "Zarejestruj się"
                                )}
                            </Button>
                        </Box>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
};

export default RegisterPage;