import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import backgroundImage from "../photos/img2.jpg";

type LoginFormData = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        if (responseData.user) {
          localStorage.setItem("user", JSON.stringify(responseData.user));

          if (responseData.user.role === "admin") {
            navigate("/adminpanel");
        } else {
            navigate("/userpanel");
        }

          console.log("Zalogowano:", responseData.user);
        }
        
      } else {
        if (responseData.message === "Invalid email or password") {
          setError("email", {
            type: "manual",
            message: "Nieprawidłowy email lub hasło"
          });
          setError("password", {
            type: "manual",
            message: "Nieprawidłowy email lub hasło"
          });
        } else {
          setServerError(responseData.message || "Błąd logowania");
        }
      }
    } catch (error) {
      console.error("Błąd połączenia:", error);
      setServerError("Nie udało się połączyć z serwerem.");
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
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
            Logowanie
          </Typography>

          {serverError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Email"
                type="email"
                {...register("email", {
                  required: "Email jest wymagany",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Podaj poprawny adres email"
                  }
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
                fullWidth
                disabled={isSubmitting}
                InputLabelProps={{ style: { color: "#ccc" } }}
                sx={{
                  input: { color: "#fff" },
                  "& .MuiFormHelperText-root": { color: "#ff6b6b" }
                }}
              />

              <TextField
                label="Hasło"
                type={showPassword ? "text" : "password"}
                {...register("password", {
                  required: "Hasło jest wymagane",
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
                fullWidth
                disabled={isSubmitting}
                InputLabelProps={{ style: { color: "#ccc" } }}
                sx={{
                  input: { color: "#fff" },
                  "& .MuiFormHelperText-root": { color: "#ff6b6b" }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                        sx={{ color: "#ccc" }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
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
                  "Zaloguj się"
                )}
              </Button>

              <Button
                href="/register"
                variant="text"
                sx={{ color: "#FF6A00", fontWeight: 600 }}
              >
                Nie masz konta? Zarejestruj się
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;