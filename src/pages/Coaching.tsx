import React, { useEffect, useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography,
  Card,
  CardContent,
  Grid,
  Container,
  Paper,
  ListItemButton,
  ListItemIcon

} from '@mui/material';
import CallIcon from '@mui/icons-material/Call';
import FolderIcon from '@mui/icons-material/Folder';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import dashboardData from '../data/dashboardData.json';

interface DialingSession {
  id: number;
  name: string;
  title: string;
  company: string;
  phone: string;
  status: string;
  active: boolean;
}

interface ContactInfo {
  fullName: string;
  title: string;
  directPhone: string;
  email: string;
  linkedin: string;
}

interface CompanyInfo {
  name: string;
  seo: string;
  website: string;
  generalPhone: string;
  linkedin: string;
  revenue: string;
  employees: string;
}

export default function Coaching() {
  const [sessions, setSessions] = useState<DialingSession[]>([]);
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    setSessions(dashboardData.activeDialingSessions);
    setContact(dashboardData.contactInformation);
    setCompany(dashboardData.companyInformation);
  }, []);

  const NAVBAR_HEIGHT = 64;

  const items = [
  { text: 'My Lists', icon: <CallIcon /> },
  { text: 'Shared', icon: <FolderIcon /> },
  { text: 'Callbacks', icon: <CalendarTodayIcon /> },
];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 200,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
        width: 200,
        boxSizing: 'border-box',
        padding: 2,
        backgroundColor: '#f5f5f5',
        position: 'sticky', // Make the sidebar sticky
        },
      }}
      >
      
      <List>
      {items.map(({ text, icon }) => (
        <ListItem disablePadding key={text}>
          <ListItemButton
            sx={{
              borderRadius: 1,
              marginBottom: 0.,
            }}
          >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
        Active Dialing Session
        </Typography>

        {/* Dialing Cards Section */}
        <Grid container spacing={3} justifyContent="center">
        {sessions.map((session) => (
          <Grid item xs={12} sm={6} md={4} key={session.id}>
          <Card
            sx={{
            backgroundColor: session.active ? '#fff' : '#f0f0f0',
            opacity: session.active ? 1 : 0.6,
            ":hover": {
              backgroundColor: session.active ? '#d0cdd4' : '#e0e0e0',
              cursor: 'pointer',
            },
            }}
          >

            <CardContent>
            <Box display="flex" alignItems="center" mb={1}>
              <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: session.active ? 'grey.800' : 'grey.400',
                mr: 1,
              }}
              />

              <Typography variant="body2">{session.status}</Typography>
            </Box>
            <Typography variant="h6">{session.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {session.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {session.company}
            </Typography>
            <Typography variant="subtitle2" mt={1}>
              {session.phone}
            </Typography>
            </CardContent>
          </Card>
          </Grid>
        ))}
        </Grid>

        {/* Combined Contact + Company Info Box */}
        <Paper sx={{ p: 3, mt: 5 }}>
        <Grid container spacing={3}>

          {/* Contact Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Contact
            </Typography>
            {contact && (
              <>
                <Typography variant="body2"><strong>Full name:</strong> {contact.fullName}</Typography>
                <Typography variant="body2"><strong>Title:</strong> {contact.title}</Typography>
                <Typography variant="body2"><strong>Direct phone:</strong> {contact.directPhone}</Typography>
                <Typography variant="body2"><strong>Email:</strong> {contact.email}</Typography>
                <Typography variant="body2"><strong>LinkedIn:</strong> {contact.linkedin}</Typography>
              </>
            )}
          </Grid>

            {/* Company Section */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Company
              </Typography>
              {company && (
                <>
                  <Typography variant="body2"><strong>Name:</strong> {company.name}</Typography>
                  <Typography variant="body2"><strong>SEO:</strong> {company.seo}</Typography>
                  <Typography variant="body2"><strong>Website:</strong> {company.website}</Typography>
                  <Typography variant="body2"><strong>General phone:</strong> {company.generalPhone}</Typography>
                  <Typography variant="body2"><strong>LinkedIn:</strong> {company.linkedin}</Typography>
                  <Typography variant="body2"><strong>Revenue:</strong> {company.revenue}</Typography>
                  <Typography variant="body2"><strong>Employees:</strong> {company.employees}</Typography>
                </>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Container>
      </Box>
    </Box>
  );
}
