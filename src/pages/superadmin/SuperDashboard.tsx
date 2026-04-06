import { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, CardContent, Button } from "@mui/material";
import { Link } from "react-router-dom";
import api from "../../utils/axiosInstance";

export default function SuperDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    numbers: 0,
    assignedNumbers: 0,
    unassignedNumbers: 0,
  });

  useEffect(() => {
    // Example API calls, adapt endpoints as needed!
    const fetchStats = async () => {
      const [users, numbers] = await Promise.all([
        api.get("/users?role=admin"), // Adjust as needed
        api.get("/numbers"),
      ]);
      setStats({
        users: users.data.length,
        numbers: numbers.data.length,
        assignedNumbers: numbers.data.filter((n: any) => n.assigned).length,
        unassignedNumbers: numbers.data.filter(
          (n: any) => !n.assigned && !n.released
        ).length,
      });
    };
    fetchStats();
  }, []);

  return (
    <Box p={4}>
      <Typography variant="h4" mb={2}>
        Superadmin Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" mb={3}>
        Welcome! Here’s an overview of your system.
      </Typography>
      <Grid container spacing={3} mb={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Users</Typography>
              <Typography variant="h4">{stats.users}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Numbers</Typography>
              <Typography variant="h4">{stats.numbers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Assigned Numbers</Typography>
              <Typography variant="h4">{stats.assignedNumbers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Unassigned Numbers</Typography>
              <Typography variant="h4">{stats.unassignedNumbers}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" mb={1}>
                Manage Tenants
              </Typography>
              <Button
                component={Link}
                to="/superdashboard/tenants"
                variant="contained"
                fullWidth
              >
                Go to Tenant Management
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" mb={1}>
                Manage Number Pool
              </Typography>
              <Button
                component={Link}
                to="/superdashboard/numbers-pool"
                variant="contained"
                fullWidth
              >
                Go to Number Pool
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" mb={1}>
                Manage Users
              </Typography>
              <Button
                component={Link}
                to="/superdashboard/users"
                variant="contained"
                fullWidth
              >
                Go to User Management
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" mb={1}>
                DialRight scans
              </Typography>
              <Button
                component={Link}
                to="/superdashboard/dialright"
                variant="contained"
                fullWidth
              >
                Open DialRight
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Optionally: Add a recent activity section or logs here */}
    </Box>
  );
}
