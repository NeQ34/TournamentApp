import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import TournamentsPage from "./pages/TournamentsPage";
import TeamsPage from "./pages/TeamsPage";
import ArchivePage from "./pages/ArchivePage";
import CalendarPage from "./pages/CalendarPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import Navbar from "./components/Navbar";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import UserPanel from "./pages/UserPanel";
import AdminPanel from "./pages/AdminPanel";

function App() {
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/tournaments" element={<TournamentsPage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/archive" element={<ArchivePage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin" element={<AdminPanelPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/userpanel" element={<UserPanel />} />
                <Route path="/adminpanel" element={<AdminPanel />} />
            </Routes>
        </>
    );
}


export default App;
