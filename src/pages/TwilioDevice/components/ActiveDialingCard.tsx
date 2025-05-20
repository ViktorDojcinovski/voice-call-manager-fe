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
  // Define buttons with icons
  const actionButtons = [
    { label: "Hang up", icon: <CallEnd />, disabled: false, callback: hangUp },
    { label: "Mute", icon: <VolumeOff />, disabled: false },
    { label: "Hold", icon: <Pause />, disabled: false },
    { label: "00:04:25", icon: <Timer />, disabled: true },
    { label: "VM", icon: <Voicemail />, disabled: true },
    { label: "Numpad", icon: <Dialpad />, disabled: true },
  ];

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
                        backgroundColor: "#000",
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
              <Typography>
                <strong>LinkedIn:</strong> {session.linkedin}
              </Typography>
            </Grid>

            {/* Contact History */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Contact History
              </Typography>
              {emails && emails.length > 0 ? (
                emails.map((email, index) => {
                  const dateObj = simulateDate(index);
                  const formattedDate = dateObj.toLocaleDateString();
                  const formattedTime = dateObj.toLocaleTimeString();
                  const isAnswered = index % 2 === 0;

                  return (
                    <Box
                      key={email.id || index}
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
                            {email.subject || "Call"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formattedDate} • {formattedTime}
                          </Typography>
                          <Typography
                            variant="body2"
                            color={isAnswered ? "success.main" : "error.main"}
                          >
                            {isAnswered ? "Answered" : "No Answer"}
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

          {/* Company Information */}
          <Typography variant="h6" gutterBottom>
            Company Information
          </Typography>
          <Typography>Company Name: {companyInfo.name}</Typography>
          <Typography>SEO: {companyInfo.seo}</Typography>
          <Typography>Website: {companyInfo.website}</Typography>
          <Typography>General phone: {companyInfo.generalPhone}</Typography>
          <Typography>Linkedin: {companyInfo.linkedin}</Typography>
          <Typography>Revenue: {companyInfo.revenue}</Typography>
          <Typography>Employees: {companyInfo.employees}</Typography>
        </CardContent>
      </Card>
    </>
  );
};

export default ActiveDialingCard;
