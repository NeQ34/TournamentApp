import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";

const Navbar = () => {
    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                background: "linear-gradient(90deg, #0D0D0D 0%, #1A1A1A 100%)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
        >
            <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6" fontWeight={700}>
                    TM PRO
                </Typography>

                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button color="inherit" href="/">Start</Button>
                    <Button color="inherit" href="/tournaments">Turnieje</Button>
                    <Button color="inherit" href="/teams">Drużyny</Button>
                    <Button color="inherit" href="/archive">Archiwum</Button>
                    <Button color="inherit" href="/calendar">Kalendarz</Button>
                    <Button
                        href="/login"
                        sx={{
                            color: "#FF6A00",
                            fontWeight: 600,
                            "&:hover": { color: "#cc5500" },
                        }}
                    >
                        Zaloguj
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
