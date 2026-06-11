export type AppSettings = {
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

export const DEFAULT_SETTINGS: AppSettings = {
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
};

export const STORAGE_KEY = "app_settings";

export const getAppSettings = (): AppSettings => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
};

export const saveAppSettings = (settings: AppSettings) => {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            ...settings,
            lastSavedAt: new Date().toISOString(),
        })
    );
};

export const formatAppDate = (date?: string | null) => {
    if (!date) return "—";

    const settings = getAppSettings();

    if (settings.dateFormat === "iso") {
        return date.slice(0, 10);
    }

    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;

    return d.toLocaleDateString("pl-PL");
};

export const validatePasswordBySettings = (password: string): string => {
    const settings = getAppSettings();

    if (!settings.requireStrongPassword) {
        if (!password.trim()) {
            return "Hasło jest wymagane.";
        }
        return "";
    }

    if (password.length < 8) {
        return "Hasło musi mieć co najmniej 8 znaków.";
    }

    if (!/[A-Z]/.test(password)) {
        return "Hasło musi zawierać co najmniej jedną wielką literę.";
    }

    if (!/[a-z]/.test(password)) {
        return "Hasło musi zawierać co najmniej jedną małą literę.";
    }

    if (!/[0-9]/.test(password)) {
        return "Hasło musi zawierać co najmniej jedną cyfrę.";
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        return "Hasło musi zawierać co najmniej jeden znak specjalny.";
    }

    return "";
};