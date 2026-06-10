import { Container } from "@mui/material";
import ArchiveView from "../components/Admin/ArchiveView";

const ArchivePage = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <ArchiveView />
        </Container>
    );
};

export default ArchivePage;