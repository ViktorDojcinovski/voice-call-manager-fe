import {
  Box,
  Grid,
  Card as MuiCard,
  CardContent,
  Tooltip,
  Typography,
  Avatar,
  styled,
} from "@mui/material";
import { Phone } from "@mui/icons-material";
import { CallSession } from "../../../types/contact";

interface DialingCardsProps {
  sessions: CallSession[];
}

const DialingLabel = styled(Box, {
  shouldForwardProp: (prop) => prop !== "skipped",
})<{ skipped?: boolean }>(({ theme, skipped }) => ({
  backgroundColor: skipped ? theme.palette.error.main : "#4CAF50",
  color: "#fff",
  padding: "2px 10px",
  borderRadius: "12px",
  fontSize: "0.75rem",
  fontWeight: "bold",
  display: "inline-block",
  marginBottom: theme.spacing(1),
}));

const Card = styled(MuiCard, {
  shouldForwardProp: (prop) => prop !== "skipped",
})<{ skipped?: boolean }>(({ theme, skipped }) => ({
  borderRadius: 12,
  padding: 16,
  backgroundColor: skipped ? "#f5f5f5" : "#fff",
  opacity: skipped ? 0.8 : 1,
  boxShadow: "0 1px 5px rgba(0,0,0,0.1)",
}));

const DialingCards = ({ sessions }: DialingCardsProps) => {
  return (
    <Grid container spacing={2}>
      {sessions.map((session) => {
        const isSkipped = session.status === "Skipped";

        return (
          <Grid item key={session._id} xs={6}>
            <Card skipped={isSkipped}>
              <CardContent>
                <Tooltip
                  title={
                    isSkipped && session.skipReason
                      ? `Reason: ${session.skipReason}`
                      : ""
                  }
                  placement="top"
                  arrow
                  disableHoverListener={!isSkipped}
                >
                  <DialingLabel skipped={isSkipped}>
                    {session.status}
                  </DialingLabel>
                </Tooltip>
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
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color={isSkipped ? "text.disabled" : "inherit"}
                  >
                    {session.mobile_phone || "N/A"}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default DialingCards;
