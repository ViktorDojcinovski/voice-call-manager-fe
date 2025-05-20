import {
  Box,
  Grid,
  Card as MuiCard,
  CardContent,
  Typography,
  useTheme,
  styled,
} from "@mui/material";

import { CallSession } from "../../../types/session";
import { StatusDot } from "../../../components/atoms/StatusDot";

interface DialingCardsProps {
  sessions: CallSession[];
}

const Card = styled(MuiCard, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(({ theme, active }) => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: theme.shape.borderRadius,
  transition: "transform 0.3s ease",
  transform: active ? "scale(1.01)" : "none",
  backgroundColor: "white",
  opacity: active ? 1 : 0.6,
  color: theme.palette.text.primary,
  "&:hover": {
    transform: "scale(1.02)",
  },
}));

const DialingCards = ({ sessions }: DialingCardsProps) => {
  const theme = useTheme();

  return (
    <>
      {/* Dialing Cards Section */}
      <Grid container display="flex" gap={1} flexWrap="nowrap">
        {sessions.map((session) => (
          <Grid item xs={6} key={session.id}>
            <Card
              sx={{
                backgroundColor: session.active ? "#fff" : "#f0f0f0",
                opacity: session.active ? 1 : 0.6,
                ":hover": {
                  backgroundColor: session.active ? "#f4f5f5" : "#e0e0e0",
                  cursor: "pointer",
                },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1} gap={2}>
                  <StatusDot color={theme.palette.grey[500]} />
                  <Typography variant="body2">{session.status}</Typography>
                </Box>
                <Typography variant="h6">{session.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {session.capacity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {session.company}
                </Typography>
                <Typography variant="subtitle2" mt={1}>
                  {`+${session.phone}`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default DialingCards;
