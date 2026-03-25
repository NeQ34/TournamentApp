import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#FF6A00",
        },
        secondary: {
            main: "#7A00FF",
        },
        background: {
            default: "#0D0D0D",
            paper: "rgba(20,20,20,0.8)",
        },
        text: {
            primary: "#F2F2F2",
        },
    },
    typography: {
        fontFamily: "Inter, Roboto, sans-serif",
    },
});

export default theme;
