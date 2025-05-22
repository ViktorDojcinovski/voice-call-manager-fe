import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
} from "@mui/material";
import {
  Info,
  Call,
  CallEnd,
  VolumeOff,
  Pause,
  Timer,
  Voicemail,
  Dialpad,
} from "@mui/icons-material";

import { Contact } from "../../../types/contact";

import rawDashboardData from "../../../data/dashboardData.json";

const simulateDate = (index: number) => {
  const date = new Date();
  date.setDate(date.getDate() - index);
  return date;
};

interface ActiveDialingCardProps {
  session: Contact;
  inputVolume: number;
  outputVolume: number;
  hangUp: () => void;
}

const contactInfo = rawDashboardData.contactInformation;
const companyInfo = rawDashboardData.companyInformation;
const emails = rawDashboardData.emails;

const ActiveDialingCard = ({
  session,
  inputVolume,
  outputVolume,
  hangUp,
}: ActiveDialingCardProps) => {
  const [callStartTime, setCallStartTime] = useState<Date | null>(new Date());
  const [elapsedTime, setElapsedTime] = useState("00:00");
  // Define buttons with icons
  const actionButtons = [
    { label: "Hang up", icon: <CallEnd />, disabled: false, callback: hangUp },
    { label: "Mute", icon: <VolumeOff />, disabled: false },
    { label: "Hold", icon: <Pause />, disabled: false },
    {
      label: elapsedTime,
      icon: <Timer />,
      disabled: false,
      bgColor: "#C1E1C1",
    },
    { label: "VM", icon: <Voicemail />, disabled: true },
    { label: "Numpad", icon: <Dialpad />, disabled: true },
  ];

  useEffect(() => {
    if (!callStartTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const seconds = Math.floor(
        (now.getTime() - callStartTime.getTime()) / 1000
      );
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      const formatted = `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
      ).padStart(2, "0")}`;
      setElapsedTime(formatted);
    }, 1000);

    return () => clearInterval(interval);
  }, [callStartTime]);

  useEffect(() => {
    setCallStartTime(new Date());
  }, [session._id]);

  return (
    <>
      {/* ACTIVE CALL CARD */}
      <Box sx={{ mb: 4 }}>
        <Card variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={7}>
                <Typography
                  variant="subtitle2"
                  color="success.main"
                  gutterBottom
                >
                  ● {"active"}
                </Typography>
                <Typography variant="h6">
                  {session.first_name} {session.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ** Placeholder ** Capacity
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {session.company}
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {session.mobile_phone}
                </Typography>
              </Grid>

              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 0.6,
                    justifyContent: "flex-end",
                  }}
                >
                  {actionButtons.map((btn, idx) => (
                    <Button
                      key={idx}
                      variant="contained"
                      startIcon={btn.icon}
                      disabled={btn.disabled}
                      sx={{
                        backgroundColor: btn.bgColor || "#000",
                        color: "#fff",
                        fontWeight: "bold",
                        borderRadius: 2,
                        px: 2,
                        minWidth: 115,
                        height: 40,
                        textTransform: "none",
                        justifyContent: "center",
                        transition: "background-color 0.3s ease",
                        "&:hover": {
                          backgroundColor: "#333",
                        },
                      }}
                      onClick={btn.callback}
                    >
                      {btn.label}
                    </Button>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* MAIN INFO CARD */}
      <Card variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
        <CardContent>
          <Grid container spacing={4}>
            {/* Contact Information */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Typography>
                <strong>Full Name:</strong> {session.first_name}{" "}
                {session.last_name}
              </Typography>
              <Typography>
                <strong>Title:</strong> {session.capacity}
              </Typography>
              <Typography>
                <strong>Mobile Phone:</strong> {session.mobile_phone}
              </Typography>
              <Typography>
                <strong>Email:</strong> {session.email}
              </Typography>
            </Grid>

            {/* Contact History */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Contact History
              </Typography>
              {session.actions.length > 0 ? (
                session.actions.map((action, index) => {
                  const dateObj = new Date(Number(action.timestamp));
                  const formattedDate = dateObj.toLocaleDateString();
                  const formattedTime = dateObj.toLocaleTimeString();
                  const isAnswered = action.result.toLowerCase() === "answered";

                  return (
                    <Box
                      key={action._id || index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 2,
                        p: 1.5,
                        border: "1px solid #e0e0e0",
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Call color={isAnswered ? "primary" : "disabled"} />
                        <Box>
                          <Typography variant="subtitle1">
                            {action.subject || "Call"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formattedDate} • {formattedTime}
                          </Typography>
                          <Typography
                            variant="body2"
                            color={isAnswered ? "success.main" : "error.main"}
                          >
                            {action.result}
                          </Typography>
                        </Box>
                      </Box>

                      <Button
                        size="small"
                        sx={{
                          minWidth: "auto",
                          color: "text.secondary",
                          transition:
                            "color 0.3s ease, background-color 0.3s ease",
                          "&:hover": {
                            backgroundColor: "#f0f0f0",
                            color: "primary.main",
                          },
                        }}
                      >
                        <Info />
                      </Button>
                    </Box>
                  );
                })
              ) : (
                <Typography>No contact history available.</Typography>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />
        </CardContent>
      </Card>
    </>
  );
};

export default ActiveDialingCard;
