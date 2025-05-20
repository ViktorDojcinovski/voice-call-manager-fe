import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  TextField,
  Typography,
} from "@mui/material";
import { Search, FilterAlt } from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import api from "../utils/axiosInstance";
import Header from "../components/Header";
import useAppStore from "../store/useAppStore";
// Import trivial JSON data
import dashboardData from "../data/dashboardData.json";

const Dashboard: React.FC = () => {
  const user = useAppStore((state) => state.user);
  const setSettings = useAppStore((state) => state.setSettings);

  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    inbox: true,
    sent: false,
    important: false,
    unread: false,
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;

      try {
        const { data } = await api.get(`/settings/${user.id}`);
        setSettings(data);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };

    fetchSettings();
  }, [user, setSettings]);

  const applyFilters = () => {
    // Filter logic would go here
    setShowFilters(false);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilters({
      inbox: true,
      sent: false,
      important: false,
      unread: false,
      dateFrom: "",
      dateTo: "",
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box sx={{ width: "100%", position: "sticky", top: 0, zIndex: 1000 }}>
        <Header />
      </Box>
      {/* Main Content - Centered with Container */}
      <Container
        maxWidth="xl"
        sx={{
          flex: 1,
          py: 3,
          px: { xs: 2, sm: 3, md: 4 },
          borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
          borderRight: "1px solid rgba(0, 0, 0, 0.12)",
          backgroundColor: "background.paper",
        }}
      >
        {/* Recent Emails Section */}
        <Grid item xs={12} mb={2}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 1,
              border: "1px solid rgba(0, 0, 0, 0.12)",
              backgroundColor: "background.paper",
            }}
          >
            <CardContent sx={{ p: 0 }}>
              {/* Header with Toggle Buttons */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 2,
                  borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
                }}
              >
                <Typography variant="h6">Recent Emails</Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant={showSearch ? "contained" : "outlined"}
                    size="small"
                    startIcon={<Search fontSize="small" />}
                    onClick={() => setShowSearch(!showSearch)}
                  >
                    Search
                  </Button>
                  <Button
                    variant={showFilters ? "contained" : "outlined"}
                    size="small"
                    startIcon={<FilterAlt fontSize="small" />}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    Filters
                  </Button>
                </Box>
              </Box>

              {/* Filter Panel */}
              {showFilters && (
                <Box
                  sx={{
                    p: 2,
                    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
                    bgcolor: "background.default",
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" gutterBottom>
                        Status
                      </Typography>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={filters.inbox}
                              onChange={() =>
                                setFilters({
                                  ...filters,
                                  inbox: !filters.inbox,
                                })
                              }
                            />
                          }
                          label="Inbox"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={filters.sent}
                              onChange={() =>
                                setFilters({
                                  ...filters,
                                  sent: !filters.sent,
                                })
                              }
                            />
                          }
                          label="Sent"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={filters.unread}
                              onChange={() =>
                                setFilters({
                                  ...filters,
                                  unread: !filters.unread,
                                })
                              }
                            />
                          }
                          label="Unread"
                        />
                      </FormGroup>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" gutterBottom>
                        Date Range
                      </Typography>
                      <TextField
                        size="small"
                        type="date"
                        label="From"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={filters.dateFrom}
                        onChange={(e) =>
                          setFilters({ ...filters, dateFrom: e.target.value })
                        }
                        sx={{ mb: 1 }}
                      />
                      <TextField
                        size="small"
                        type="date"
                        label="To"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={filters.dateTo}
                        onChange={(e) =>
                          setFilters({ ...filters, dateTo: e.target.value })
                        }
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{ mb: 1 }}
                        onClick={applyFilters}
                      >
                        Apply Filters
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={resetFilters}
                      >
                        Reset
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Emails List */}
              <List sx={{ maxHeight: 400, overflow: "auto" }}>
                {dashboardData.emails.map((email) => (
                  <Box key={email.id}>
                    <ListItem>
                      <ListItemText
                        primary={email.subject}
                        secondary={`From: ${email.from}`}
                      />
                      {filters.unread && (
                        <Box
                          sx={{
                            ml: 1,
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "primary.main",
                          }}
                        />
                      )}
                    </ListItem>
                    <Divider component="li" />
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Combined Metrics Row */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            {/* Call Performance */}
            <Grid item xs={12} md={4}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 1,
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  height: "100%",
                  backgroundColor: "background.paper",
                }}
              >
                <CardContent>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h6" gutterBottom>
                      Call Performance
                    </Typography>
                    <Divider sx={{ mb: 2, mx: "auto", width: "80%" }} />
                    <Grid container spacing={2}>
                      {[
                        {
                          value: dashboardData.callPerformance.callsToday,
                          label: "Calls Today",
                        },
                        {
                          value: `${dashboardData.callPerformance.successRate}%`,
                          label: "Success Rate",
                        },
                        {
                          value: `${dashboardData.callPerformance.connectionRate}%`,
                          label: "Connection Rate",
                        },
                        {
                          value: dashboardData.callPerformance.followUps,
                          label: "Follow-ups",
                        },
                      ].map((item, index) => (
                        <Grid item xs={6} key={index}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "100%",
                            }}
                          >
                            <Typography variant="h4">{item.value}</Typography>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              {item.label}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Call Activity */}
            <Grid item xs={12} md={4}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 1,
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  height: "100%",
                  backgroundColor: "background.paper",
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom textAlign={"center"}>
                    Call Activity
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ height: 250, textAlign: "center" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.callActivity.chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(0, 0, 0, 0.12)"
                        />
                        <XAxis dataKey="name" stroke="rgba(0, 0, 0, 0.6)" />
                        <YAxis stroke="rgba(0, 0, 0, 0.6)" />
                        <Tooltip />
                        <Bar dataKey="calls" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Insights */}
            <Grid item xs={12} md={4}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 1,
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  height: "100%",
                  backgroundColor: "background.paper",
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom textAlign={"center"}>
                    Quick Insights
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: "100%" }}>
                        <LinearProgress
                          variant="determinate"
                          value={
                            dashboardData.callActivity.insights.enterpriseLeads
                          }
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Typography variant="body2">
                        {dashboardData.callActivity.insights.enterpriseLeads}%
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Enterprise Leads
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: "100%" }}>
                        <LinearProgress
                          variant="determinate"
                          value={
                            dashboardData.callActivity.insights.smbProspects
                          }
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Typography variant="body2">
                        {dashboardData.callActivity.insights.smbProspects}%
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      SMB Prospects
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h6">
                      {dashboardData.callActivity.insights.timeOnCalls}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Time on Calls
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;
