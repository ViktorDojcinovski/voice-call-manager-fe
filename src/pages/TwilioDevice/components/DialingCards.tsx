import {
  Box,
  Grid,
  Card as MuiCard,
  CardContent,
  Typography,
  useTheme,
  styled,
} from "@mui/material";

import { CallSession } from "../../../types/contact";
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
          <Grid item xs={6} key={session._id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1} gap={2}>
                  <StatusDot color={theme.palette.grey[500]} />
                  <Typography variant="body2">{session.status}</Typography>
                </Box>
                <Typography variant="h6">
                  {session.first_name} {session.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {session.capacity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {session.company}
                </Typography>
                <Typography variant="subtitle2" mt={1}>
                  {`+${session.mobile_phone}`}
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
