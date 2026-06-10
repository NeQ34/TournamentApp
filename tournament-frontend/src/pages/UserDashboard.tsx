import { Box, Typography, Paper, Grid, Card, CardContent } from "@mui/material";
import { EmojiEvents, Groups, CalendarMonth, Archive } from "@mui/icons-material";

const UserDashboard = ({ userData }: { userData: any }) => {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ color: "#fff", mb: 3 }}>
        Witaj, {userData.firstName} {userData.lastName}!
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "rgba(0,0,0,0.7)", color: "#fff" }}>
            <CardContent>
              <EmojiEvents sx={{ color: "#FF6A00", fontSize: 40 }} />
              <Typography variant="h4">0</Typography>
              <Typography>Aktywne turnieje</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "rgba(0,0,0,0.7)", color: "#fff" }}>
            <CardContent>
              <Groups sx={{ color: "#FF6A00", fontSize: 40 }} />
              <Typography variant="h4">0</Typography>
              <Typography>Moje drużyny</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDashboard;