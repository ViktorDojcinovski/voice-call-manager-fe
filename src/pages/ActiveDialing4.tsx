import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import PauseIcon from '@mui/icons-material/Pause';
import TimerIcon from '@mui/icons-material/Timer';
import VoicemailIcon from '@mui/icons-material/Voicemail';
import DialpadIcon from '@mui/icons-material/Dialpad';

import rawDashboardData from '../data/dashboardData.json';

const dashboardData = rawDashboardData;

const ActiveDialing4: React.FC = () => {
  const data = dashboardData.activeCall;
  const contactInfo = dashboardData.contactInformation;
  const companyInfo = dashboardData.companyInformation;
  const emails = dashboardData.emails;

  if (!data) {
    return <div>No active call data found.</div>;
  }

  const simulateDate = (index: number) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return date;
  };

  // Define buttons with icons
  const actionButtons = [
    { label: 'Hang up', icon: <CallEndIcon /> },
    { label: 'Mute', icon: <VolumeOffIcon /> },
    { label: 'Hold', icon: <PauseIcon /> },
    { label: data.duration, icon: <TimerIcon /> },
    { label: 'VM', icon: <VoicemailIcon /> },
    { label: 'Numpad', icon: <DialpadIcon /> },
  ];

  return (
    <Box sx={{ maxWidth: 1000, margin: '20px auto', px: 2 }}>
      {/* HEADER */}
      <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
        Active Dialing Session
      </Typography>

      {/* ACTIVE CALL CARD */}
      <Box sx={{ maxWidth: 650, mb: 4 }}>
        <Card variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={7}>
                <Typography variant="subtitle2" color="success.main" gutterBottom>
                  ● {data.status}
                </Typography>
                <Typography variant="h6">{data.caller.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {data.caller.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {data.caller.company}
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {data.caller.phone}
                </Typography>
              </Grid>

              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 0.6,
                    justifyContent: 'flex-end',
                  }}
                >
                  {actionButtons.map((btn, idx) => (
                    <Button
                      key={idx}
                      variant="contained"
                      startIcon={btn.icon}
                      sx={{
                        backgroundColor: '#000',
                        color: '#fff',
                        fontWeight: 'bold',
                        borderRadius: 2,
                        px: 2,
                        minWidth: 115,
                        height: 40,
                        textTransform: 'none',
                        justifyContent: 'center',
                      }}
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
              <Typography><strong>Full Name:</strong> {contactInfo.fullName}</Typography>
              <Typography><strong>Title:</strong> {contactInfo.title}</Typography>
              <Typography><strong>Direct Phone:</strong> {contactInfo.directPhone}</Typography>
              <Typography><strong>Email:</strong> {contactInfo.email}</Typography>
              <Typography><strong>LinkedIn:</strong> {contactInfo.linkedin}</Typography>
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                        p: 1.5,
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CallIcon color={isAnswered ? 'primary' : 'disabled'} />
                        <Box>
                          <Typography variant="subtitle1">{email.subject || 'Call'}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formattedDate} • {formattedTime}
                          </Typography>
                          <Typography
                            variant="body2"
                            color={isAnswered ? 'success.main' : 'error.main'}
                          >
                            {isAnswered ? 'Answered' : 'No Answer'}
                          </Typography>
                        </Box>
                      </Box>

                      <Button size="small" sx={{ minWidth: 'auto' }}>
                        <InfoIcon />
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
    </Box>
  );
};

export default ActiveDialing4;
