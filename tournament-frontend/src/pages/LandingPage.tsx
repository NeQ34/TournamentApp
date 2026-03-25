import { Box, Button, Container, Typography } from "@mui/material";
import backgroundImage from "../photos/dss.png";

const LandingPage = () => {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,

                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            <Container
                maxWidth="sm"
                sx={{
                    textAlign: "center",
                    color: "#fff",
                    backdropFilter: "blur(6px)",
                    backgroundColor: "rgba(0,0,0,0.55)",
                    padding: "40px",
                    borderRadius: "20px",
                }}
            >
                <Typography variant="h3" fontWeight={700} gutterBottom>
                    Tournament Manager PRO
                </Typography>

                <Typography variant="h6" color="rgba(255,255,255,0.7)" mb={4}>
                    Profesjonalny system do zarządzania turniejami sportowymi i e‑sportowymi
                </Typography>

                <Box display="flex" flexDirection="column" gap={2}>
                    <Button
                        variant="contained"
                        size="large"
                        href="/login"
                        sx={{ bgcolor: "#FF6A00", "&:hover": { bgcolor: "#cc5500" } }}
                    >
                        Zaloguj się
                    </Button>

                    <Button
                        variant="outlined"
                        size="large"
                        href="/register"
                        sx={{
                            color: "#FF6A00",
                            borderColor: "#FF6A00",
                            "&:hover": { borderColor: "#cc5500", color: "#cc5500" },
                        }}
                    >
                        Załóż konto
                    </Button>

                    <Button variant="text" size="large" href="/tournaments" sx={{ color: "#fff" }}>
                        Przeglądaj turnieje
                    </Button>

                    <Button variant="text" size="large" href="/teams" sx={{ color: "#fff" }}>
                        Spis drużyn
                    </Button>

                    <Button variant="text" size="large" href="/archive" sx={{ color: "#fff" }}>
                        Archiwum
                    </Button>

                    <Button variant="text" size="large" href="/calendar" sx={{ color: "#fff" }}>
                        Kalendarz
                    </Button>
                </Box>
            </Container>
        </Box>
    );
};

export default LandingPage;
