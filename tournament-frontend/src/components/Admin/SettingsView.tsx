import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import {
    Save as SaveIcon,
    RestartAlt as ResetIcon,
    Settings as SettingsIcon,
    InfoOutlined as InfoIcon,
} from "@mui/icons-material";

type AppSettings = {
    organizationName: string;
    defaultLocation: string;
    defaultCourts: number;
    defaultStartHour: number;
    defaultMatchDuration: number;
    defaultBreakBetweenMatches: number;

    compactTables: boolean;
    autoRefreshData: boolean;
    dateFormat: "pl" | "iso";
    rowsPerPage: 5 | 10 | 25 | 50;

    sessionTimeoutMinutes: number;
    requireStrongPassword: boolean;
    confirmDangerousActions: boolean;

    lastSavedAt?: string;
};

const DEFAULT_SETTINGS: AppSettings = {
    organizationName: "SPORTTURNIEJE",
    defaultLocation: "",
    defaultCourts: 1,
    defaultStartHour: 10,
    defaultMatchDuration: 60,
    defaultBreakBetweenMatches: 15,

    compactTables: false,
    autoRefreshData: true,
    dateFormat: "pl",
    rowsPerPage: 10,

    sessionTimeoutMinutes: 60,
    requireStrongPassword: true,
    confirmDangerousActions: true,

    lastSavedAt: undefined,
};

const STORAGE_KEY = "app_settings";

const SettingsView = () => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSettings({ ...DEFAULT_SETTINGS, ...parsed });
            } catch {
                localStorage.removeItem(STORAGE_KEY);
                setSettings(DEFAULT_SETTINGS);
            }
        }
    }, []);

    const validateSettings = () => {
        if (!settings.organizationName.trim()) {
            return "Nazwa organizacji jest wymagana.";
        }

        if (settings.defaultCourts < 1 || settings.defaultCourts > 50) {
            return "Liczba boisk musi być w zakresie od 1 do 50.";
        }

        if (settings.defaultStartHour < 0 || settings.defaultStartHour > 23) {
            return "Godzina startu musi być w zakresie od 0 do 23.";
        }

        if (settings.defaultMatchDuration < 5 || settings.defaultMatchDuration > 300) {
            return "Czas meczu musi być w zakresie od 5 do 300 minut.";
        }

        if (settings.defaultBreakBetweenMatches < 0 || settings.defaultBreakBetweenMatches > 120) {
            return "Przerwa między meczami musi być w zakresie od 0 do 120 minut.";
        }

        return "";
    };

    const handleSave = () => {
        setError("");
        setSuccess("");

        const validationError = validateSettings();

        if (validationError) {
            setError(validationError);
            return;
        }

        const settingsToSave = {
            ...settings,
            lastSavedAt: new Date().toISOString(),
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
        setSettings(settingsToSave);
        setSuccess("Ustawienia zostały zapisane.");

        setTimeout(() => setSuccess(""), 3000);
    };

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        setError("");
        setSuccess("Przywrócono ustawienia domyślne.");

        setTimeout(() => setSuccess(""), 3000);
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: "#fff", mb: 3 }}>
                Ustawienia aplikacji
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Paper sx={{ p: 4, bgcolor: "rgba(0,0,0,0.75)", color: "#fff", borderRadius: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                    <SettingsIcon sx={{ color: "#FF6A00" }} />
                    <Typography variant="h6" sx={{ color: "#FF6A00", fontWeight: 800 }}>
                        Ustawienia ogólne
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Nazwa organizacji / aplikacji"
                            value={settings.organizationName}
                            onChange={(e) =>
                                setSettings({ ...settings, organizationName: e.target.value })
                            }
                            InputLabelProps={{ style: { color: "#ccc" } }}
                            sx={{ input: { color: "#fff" } }}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Domyślna lokalizacja turniejów"
                            value={settings.defaultLocation}
                            onChange={(e) =>
                                setSettings({ ...settings, defaultLocation: e.target.value })
                            }
                            InputLabelProps={{ style: { color: "#ccc" } }}
                            sx={{ input: { color: "#fff" } }}
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4, bgcolor: "rgba(255,255,255,0.1)" }} />

                <Typography variant="h6" sx={{ color: "#FF6A00", fontWeight: 800, mb: 3 }}>
                    Domyślne ustawienia turniejów
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Liczba boisk"
                            value={settings.defaultCourts}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    defaultCourts: Number(e.target.value),
                                })
                            }
                            InputLabelProps={{ style: { color: "#ccc" } }}
                            sx={{ input: { color: "#fff" } }}
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Godzina startu"
                            value={settings.defaultStartHour}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    defaultStartHour: Number(e.target.value),
                                })
                            }
                            InputLabelProps={{ style: { color: "#ccc" } }}
                            sx={{ input: { color: "#fff" } }}
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Czas meczu / min"
                            value={settings.defaultMatchDuration}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    defaultMatchDuration: Number(e.target.value),
                                })
                            }
                            InputLabelProps={{ style: { color: "#ccc" } }}
                            sx={{ input: { color: "#fff" } }}
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Przerwa / min"
                            value={settings.defaultBreakBetweenMatches}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    defaultBreakBetweenMatches: Number(e.target.value),
                                })
                            }
                            InputLabelProps={{ style: { color: "#ccc" } }}
                            sx={{ input: { color: "#fff" } }}
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4, bgcolor: "rgba(255,255,255,0.1)" }} />

                <Typography variant="h6" sx={{ color: "#FF6A00", fontWeight: 800, mb: 3 }}>
                    Preferencje panelu
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel sx={{ color: "#ccc" }}>Format daty</InputLabel>
                            <Select
                                value={settings.dateFormat}
                                label="Format daty"
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        dateFormat: e.target.value as "pl" | "iso",
                                    })
                                }
                                sx={{ color: "#fff" }}
                            >
                                <MenuItem value="pl">Polski — DD.MM.RRRR</MenuItem>
                                <MenuItem value="iso">ISO — RRRR-MM-DD</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.compactTables}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            compactTables: e.target.checked,
                                        })
                                    }
                                />
                            }
                            label="Kompaktowy widok tabel"
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.autoRefreshData}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            autoRefreshData: e.target.checked,
                                        })
                                    }
                                />
                            }
                            label="Automatyczne odświeżanie danych"
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth sx={{ minWidth: 220 }}>
                            <InputLabel sx={{ color: "#ccc" }}>
                                Liczba wierszy w tabelach
                            </InputLabel>
                            <Select
                                value={settings.rowsPerPage}
                                label="Liczba wierszy w tabelach"
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        rowsPerPage: Number(e.target.value) as 5 | 10 | 25 | 50,
                                    })
                                }
                                sx={{
                                    color: "#fff",
                                    "& .MuiSelect-select": {
                                        whiteSpace: "normal",
                                    },
                                }}
                            >
                                <MenuItem value={5}>5 wierszy</MenuItem>
                                <MenuItem value={10}>10 wierszy</MenuItem>
                                <MenuItem value={25}>25 wierszy</MenuItem>
                                <MenuItem value={50}>50 wierszy</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4, bgcolor: "rgba(255,255,255,0.1)" }} />

                <Typography variant="h6" sx={{ color: "#FF6A00", fontWeight: 800, mb: 3 }}>
                    Bezpieczeństwo
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Czas sesji administratora / min"
                            value={settings.sessionTimeoutMinutes}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    sessionTimeoutMinutes: Number(e.target.value),
                                })
                            }
                            InputLabelProps={{ style: { color: "#ccc" } }}
                            sx={{ input: { color: "#fff" } }}
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.requireStrongPassword}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            requireStrongPassword: e.target.checked,
                                        })
                                    }
                                />
                            }
                            label="Wymagaj silnego hasła"
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.confirmDangerousActions}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            confirmDangerousActions: e.target.checked,
                                        })
                                    }
                                />
                            }
                            label="Potwierdzaj usuwanie danych"
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4, bgcolor: "rgba(255,255,255,0.1)" }} />

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                    <InfoIcon sx={{ color: "#FF6A00" }} />
                    <Typography variant="h6" sx={{ color: "#FF6A00", fontWeight: 800 }}>
                        Informacje o systemie
                    </Typography>
                </Box>

                <Paper
                    sx={{
                        p: 3,
                        bgcolor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 3,
                    }}
                >
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="caption" sx={{ color: "#aaa" }}>
                                Wersja aplikacji
                            </Typography>
                            <Typography sx={{ color: "#fff" }}>1.0.0</Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="caption" sx={{ color: "#aaa" }}>
                                Frontend
                            </Typography>
                            <Typography sx={{ color: "#fff" }}>
                                React + TypeScript + Material UI
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="caption" sx={{ color: "#aaa" }}>
                                Backend
                            </Typography>
                            <Typography sx={{ color: "#fff" }}>Spring Boot</Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="caption" sx={{ color: "#aaa" }}>
                                Baza danych
                            </Typography>
                            <Typography sx={{ color: "#fff" }}>MySQL</Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="caption" sx={{ color: "#aaa" }}>
                                Tryb działania
                            </Typography>
                            <Typography sx={{ color: "#4caf50", fontWeight: 600 }}>
                                Online
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="caption" sx={{ color: "#aaa" }}>
                                Ostatnia aktualizacja ustawień
                            </Typography>
                            <Typography sx={{ color: "#fff" }}>
                                {new Date().toLocaleDateString("pl-PL")}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>

                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 4 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ResetIcon />}
                        onClick={handleReset}
                        sx={{ color: "#ccc", borderColor: "#666" }}
                    >
                        Przywróć domyślne
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        sx={{ bgcolor: "#FF6A00", fontWeight: 800 }}
                    >
                        Zapisz ustawienia
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default SettingsView;