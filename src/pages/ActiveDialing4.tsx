import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Call as CallIcon,
  CallEnd as CallEndIcon,
  MicOff as MicOffIcon,
  Pause as PauseIcon,
  Schedule as ScheduleIcon,
  Voicemail as VoicemailIcon,
  Dialpad as DialpadIcon,
  Info as InfoIcon,
  LinkedIn as LinkedInIcon,
  Language as LanguageIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  History as HistoryIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

import rawDashboardData from '../data/dashboardData.json';

// Professional color palette
const colors = {
  background: "#f8f9fa",
  paper: "#ffffff",
  primary: "#3f51b5",
  primaryLight: "#757de8",
  primaryDark: "#002984",
  secondary: "#f50057",
  textPrimary: "#212121",
  textSecondary: "#757575",
  success: "#4caf50",
  error: "#f44336",
  divider: "#e0e0e0",
  highlight: "#e3f2fd",
};

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

  // Action buttons for call controls
  const actionButtons = [
    { label: 'End', icon: <CallEndIcon />, color: 'error' },
    { label: 'Mute', icon: <MicOffIcon />, color: 'default' },
    { label: 'Hold', icon: <PauseIcon />, color: 'default' },
    { label: data.duration, icon: <ScheduleIcon />, color: 'primary' },
    { label: 'Voicemail', icon: <VoicemailIcon />, color: 'default' },
    { label: 'Keypad', icon: <DialpadIcon />, color: 'default' },
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: colors.background,
      py: 4,
      px: { xs: 2, md: 4 },
    }}>
      <Box sx={{
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={600} sx={{ color: colors.textPrimary }}>
            Active Call
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            Manage your current call session
          </Typography>
        </Box>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Left Column - Call Info and Controls */}
          <Grid item xs={12} md={8}>
            <Card sx={{
              borderRadius: 2,
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              mb: 3,
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Chip
                    label="Active"
                    color="success"
                    size="small"
                    sx={{
                      backgroundColor: colors.success,
                      color: '#fff',
                      fontWeight: 500,
                      mr: 2,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                    In progress • {data.duration}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                  <Avatar sx={{
                    width: 64,
                    height: 64,
                    bgcolor: colors.primaryLight,
                    color: '#fff',
                    fontSize: '1.5rem',
                    fontWeight: 500,
                    mr: 3,
                  }}>
                    {data.caller.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
                      {data.caller.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                      {data.caller.title} • {data.caller.company}
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: colors.primary,
                      fontWeight: 500,
                      mt: 1,
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                      <CallIcon fontSize="small" sx={{ mr: 1 }} />
                      {data.caller.phone}
                    </Typography>
                  </Box>
                </Box>

                {/* Call Controls */}
                <Grid container spacing={1} sx={{ mt: 2 }}>
                  {actionButtons.map((btn, idx) => (
                    <Grid item xs={4} sm={4} md={4} key={idx}>
                      <Button
                        fullWidth
                        variant={btn.color === 'primary' ? 'contained' : 'outlined'}
                        startIcon={btn.icon}
                        color={btn.color === 'error' ? 'error' : btn.color === 'primary' ? 'primary' : 'inherit'}
                        sx={{
                          py: 1.5,
                          borderRadius: 1,
                          textTransform: 'none',
                          fontWeight: 500,
                          ...(btn.color === 'default' && {
                            color: colors.textPrimary,
                            borderColor: colors.divider,
                            '&:hover': {
                              borderColor: colors.textPrimary,
                            }
                          }),
                        }}
                      >
                        {btn.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Contact History */}
            <Card sx={{
              borderRadius: 2,
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            }}>
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3,
                }}>
                  <HistoryIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
                    Interaction History
                  </Typography>
                </Box>

                {emails && emails.length > 0 ? (
                  <Box>
                    {emails.map((email, index) => {
                      const dateObj = simulateDate(index);
                      const formattedDate = dateObj.toLocaleDateString();
                      const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const isAnswered = index % 2 === 0;

                      return (
                        <Box key={email.id || index} sx={{ mb: 2 }}>
                          <Box sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2,
                            borderRadius: 1,
                            backgroundColor: index === 0 ? colors.highlight : 'transparent',
                            '&:hover': {
                              backgroundColor: colors.highlight,
                            }
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CallIcon 
                                sx={{ 
                                  color: isAnswered ? colors.success : colors.error,
                                  mr: 2 
                                }} 
                              />
                              <Box>
                                <Typography variant="subtitle1" sx={{ color: colors.textPrimary }}>
                                  {email.subject || 'Phone Call'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                                  {formattedDate} at {formattedTime}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip
                              size="small"
                              label={isAnswered ? 'Answered' : 'Missed'}
                              sx={{
                                backgroundColor: isAnswered ? `${colors.success}20` : `${colors.error}20`,
                                color: isAnswered ? colors.success : colors.error,
                              }}
                            />
                          </Box>
                          {index < emails.length - 1 && <Divider />}
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                    No interaction history available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Contact and Company Info */}
          <Grid item xs={12} md={4}>
            {/* Contact Information */}
            <Card sx={{
              borderRadius: 2,
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              mb: 3,
            }}>
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3,
                }}>
                  <PersonIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
                    Contact Details
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: colors.textSecondary, mb: 1 }}>
                    PERSONAL INFORMATION
                  </Typography>
                  <Box sx={{ 
                    p: 2,
                    backgroundColor: colors.highlight,
                    borderRadius: 1,
                  }}>
                    <Typography variant="body1" sx={{ mb: 1.5 }}>
                      <strong style={{ color: colors.textPrimary }}>Name:</strong>{' '}
                      <span style={{ color: colors.textSecondary }}>{contactInfo.fullName}</span>
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1.5 }}>
                      <strong style={{ color: colors.textPrimary }}>Title:</strong>{' '}
                      <span style={{ color: colors.textSecondary }}>{contactInfo.title}</span>
                    </Typography>
                    <Typography variant="body1">
                      <strong style={{ color: colors.textPrimary }}>Direct:</strong>{' '}
                      <span style={{ color: colors.primary }}>{contactInfo.directPhone}</span>
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<EmailIcon />}
                    sx={{
                      py: 1,
                      borderRadius: 1,
                      textTransform: 'none',
                      color: colors.textPrimary,
                      borderColor: colors.divider,
                      '&:hover': {
                        borderColor: colors.textPrimary,
                      }
                    }}
                  >
                    Email
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<LinkedInIcon />}
                    sx={{
                      py: 1,
                      borderRadius: 1,
                      textTransform: 'none',
                      color: colors.textPrimary,
                      borderColor: colors.divider,
                      '&:hover': {
                        borderColor: colors.textPrimary,
                      }
                    }}
                  >
                    LinkedIn
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card sx={{
              borderRadius: 2,
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            }}>
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3,
                }}>
                  <BusinessIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
                    Company Information
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: colors.textSecondary, mb: 1 }}>
                    COMPANY DETAILS
                  </Typography>
                  <Box sx={{ 
                    p: 2,
                    backgroundColor: colors.highlight,
                    borderRadius: 1,
                    mb: 2,
                  }}>
                    <Typography variant="body1" sx={{ mb: 1.5 }}>
                      <strong style={{ color: colors.textPrimary }}>Name:</strong>{' '}
                      <span style={{ color: colors.textSecondary }}>{companyInfo.name}</span>
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1.5 }}>
                      <strong style={{ color: colors.textPrimary }}>Industry:</strong>{' '}
                      <span style={{ color: colors.textSecondary }}>{companyInfo.seo}</span>
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1.5 }}>
                      <strong style={{ color: colors.textPrimary }}>Employees:</strong>{' '}
                      <span style={{ color: colors.textSecondary }}>{companyInfo.employees}</span>
                    </Typography>
                    <Typography variant="body1">
                      <strong style={{ color: colors.textPrimary }}>Revenue:</strong>{' '}
                      <span style={{ color: colors.textSecondary }}>{companyInfo.revenue}</span>
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ color: colors.textSecondary, mb: 1 }}>
                    CONTACT METHODS
                  </Typography>
                  <Box sx={{ 
                    p: 2,
                    backgroundColor: colors.highlight,
                    borderRadius: 1,
                  }}>
                    <Button
                      fullWidth
                      startIcon={<LanguageIcon />}
                      sx={{
                        justifyContent: 'flex-start',
                        py: 1,
                        mb: 1.5,
                        textTransform: 'none',
                        color: colors.primary,
                      }}
                    >
                      {companyInfo.website}
                    </Button>
                    <Button
                      fullWidth
                      startIcon={<CallIcon />}
                      sx={{
                        justifyContent: 'flex-start',
                        py: 1,
                        mb: 1.5,
                        textTransform: 'none',
                        color: colors.primary,
                      }}
                    >
                      {companyInfo.generalPhone}
                    </Button>
                    <Button
                      fullWidth
                      startIcon={<LinkedInIcon />}
                      sx={{
                        justifyContent: 'flex-start',
                        py: 1,
                        textTransform: 'none',
                        color: colors.primary,
                      }}
                    >
                      {companyInfo.linkedin}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ActiveDialing4;