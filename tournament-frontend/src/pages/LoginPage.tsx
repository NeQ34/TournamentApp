import { useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import backgroundImage from "../photos/img2.jpg";

const LoginPage = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log("Logowanie:", form);
    alert("Logowanie zakończone!");
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

          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="column" gap={2}>
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

              <Button
                type="submit"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: "#FF6A00",
                  "&:hover": { bgcolor: "#cc5500" },
                }}
              >
                Zaloguj się
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
