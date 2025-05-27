import {
  Box,
  Grid,
  Card as MuiCard,
  CardContent,
  Typography,
  Avatar,
  styled,
} from "@mui/material";
import { Phone } from "@mui/icons-material";
import { CallSession } from "../../../types/contact";

interface DialingCardsProps {
  sessions: CallSession[];
}

const DialingLabel = styled(Box)(({ theme }) => ({
  backgroundColor: "#4CAF50",
  color: "#fff",
  padding: "2px 10px",
  borderRadius: "12px",
  fontSize: "0.75rem",
  fontWeight: "bold",
  display: "inline-block",
  marginBottom: theme.spacing(1),
}));

const Card = styled(MuiCard)(() => ({
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 1px 5px rgba(0,0,0,0.1)",
}));

const DialingCards = ({ sessions }: DialingCardsProps) => {
  return (
    <Grid container spacing={2}>
      {sessions.map((session) => (
        <Grid item key={session._id} xs={6}>
          <Card>
            <CardContent>
              <DialingLabel>{session.status}</DialingLabel>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Avatar>
                  {session.first_name[0]}
                  {session.last_name[0]}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {session.first_name} {session.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {session.capacity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {session.company}
                  </Typography>
                </Box>
              </Box>
              <Box
                display="flex"
                alignItems="center"
                color="primary.main"
                mt={1}
              >
                <Phone fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2" fontWeight="bold">
                  {session.mobile_phone}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default DialingCards;
