import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { Box } from "@mui/material";

const MainLayout = () => {
    return (
        <Box>
            <Navbar />

            <Box component="main" sx={{ pt: "64px" }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default MainLayout;