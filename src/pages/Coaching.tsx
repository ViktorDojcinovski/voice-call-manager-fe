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
} from '@mui/material';
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

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            padding: 2,
            top: `${NAVBAR_HEIGHT}px`, // distance from top (navbar height)
            height: `calc(100% - ${NAVBAR_HEIGHT}px)`, // full height minus navbar
            backgroundColor: '#f5f5f5',},
        }}
      >
      
        <List>
          {['📞 My Lists', '📁 Shared', '📅 Callbacks'].map((text) => (
            <ListItem component="button" key={text} sx={{ padding: 1, borderRadius: 4, marginBottom: 1 }}>
              <ListItemText primary={text} />
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
                      backgroundColor: session.active ? '#f5f5f5' : '#e0e0e0',
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
            <Typography variant="h6" gutterBottom>
              Contact 
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12} md={6}>
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
