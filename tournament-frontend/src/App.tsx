import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/MainLayout"; // Zaimportuj nowy layout
import LandingPage from "./pages/LandingPage";
import TournamentsPage from "./pages/TournamentsPage";
import TeamsPage from "./pages/TeamsPage";
import ArchivePage from "./pages/ArchivePage";
import CalendarPage from "./pages/CalendarPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import UserPanel from "./pages/UserPanel";
import AdminPanel from "./pages/AdminPanel";

function App() {
    return (
        <Routes>
            {/* TRASY PUBLICZNE Z NAVBARem */}
            <Route element={<MainLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/tournaments" element={<TournamentsPage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/archive" element={<ArchivePage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* TRASY PANELI (BEZ GŁÓWNEGO NAVBARA) */}
            <Route path="/userpanel" element={<UserPanel />} />
            <Route path="/adminpanel" element={<AdminPanel />} />
        </Routes>
    );
}

export default App;