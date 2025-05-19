import {
  Grid,
  Card as MuiCard,
  CardContent,
  Typography,
  useTheme,
  styled,
} from "@mui/material";

import { CallSession } from "../../../types/session";

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
    <Grid container spacing={3} justifyContent="center">
      {sessions.length > 0 && (
        <Grid container spacing={3} justifyContent="center">
          {sessions.map((session) => {
            const isActive = session.active || "active";
            return (
              <Grid item xs={12} sm={6} md={4} key={session.id}>
                <Card active={session.active}>
                  <CardContent>
                    <Typography variant="h6">{session.name}</Typography>
                    <Typography>{session.phone}</Typography>
                    <Typography>Status: {session.status}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Grid>
  );
};

export default DialingCards;
