import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link } from "react-router-dom";
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
                    <Button color="inherit" component={Link} to="/">Start</Button>
                    <Button color="inherit" component={Link} to="/tournaments">Turnieje</Button>
                    <Button color="inherit" component={Link} to="/teams">Drużyny</Button>
                    <Button color="inherit" component={Link} to="/archive">Archiwum</Button>
                    <Button color="inherit" component={Link} to="/calendar">Kalendarz</Button>
                    <Button
                        component={Link}
                        to="/login"
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
