import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Grid,
  Card,
  CardContent as MuiCardContent,
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
  styled,
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
import useAppStore from "../store/useAppStore";
import dashboardData from "../data/dashboardData.json";

// Color palette constants
const colors = {
  background: "#ffffff", // white background
  headline: "#1f1f1f", // dark headline text
  paragraph: "#4a4a4a", // slightly lighter dark text for body
  stroke: "#e0e0e0", // light gray border
  secondary: "#9e9e9e", // muted secondary text/icons
  main: "#1f1f1f", // main text color
  highlight: "#6246ea", // deep complementary violet (saturated)
  highlightHover: "#5039c5", // slightly darker on hover
  tertiary: "#2cb67d", // fresh green for contrast/success
  cardBackground: "#f9f9f9", // very light gray for cards on white
  highlightTransparent: "rgba(98, 70, 234, 0.1)", // soft background hint
  highlightShadow: "rgba(98, 70, 234, 0.2)", // soft shadow tint
};

const CardContent = styled(MuiCardContent)(() => ({
  paddingBottom: "10px",
  "&:last-child": {
    paddingBottom: "10px",
  },
}));

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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: colors.background,
        color: colors.main,
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          flex: 1,
          py: 3,
          px: { xs: 2, sm: 3, md: 4 },
          backgroundColor: colors.background,
        }}
      >
        {/* Recent Emails Section */}
        <Grid item xs={12} mb={2}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `1px solid ${colors.stroke}`,
              backgroundColor: colors.cardBackground,
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: `0px 4px 20px ${colors.highlightShadow}`,
                transform: "translateY(-2px)",
              },
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 2,
                  borderBottom: `1px solid ${colors.stroke}`,
                }}
              >
                <Typography variant="h6" color={colors.headline}>
                  Recent Emails
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant={showSearch ? "contained" : "outlined"}
                    size="small"
                    startIcon={<Search fontSize="small" />}
                    onClick={() => setShowSearch(!showSearch)}
                    sx={{
                      backgroundColor: showSearch
                        ? colors.highlight
                        : "transparent",
                      color: colors.main,
                      borderColor: colors.highlight,
                      "&:hover": {
                        backgroundColor: showSearch
                          ? colors.highlightHover
                          : colors.highlightTransparent,
                      },
                    }}
                  >
                    Search
                  </Button>
                  <Button
                    variant={showFilters ? "contained" : "outlined"}
                    size="small"
                    startIcon={<FilterAlt fontSize="small" />}
                    onClick={() => setShowFilters(!showFilters)}
                    sx={{
                      backgroundColor: showFilters
                        ? colors.highlight
                        : "transparent",
                      color: colors.main,
                      borderColor: colors.highlight,
                      "&:hover": {
                        backgroundColor: showFilters
                          ? colors.highlightHover
                          : colors.highlightTransparent,
                      },
                    }}
                  >
                    Filters
                  </Button>
                </Box>
              </Box>

              {showFilters && (
                <Box
                  sx={{
                    p: 2,
                    borderBottom: `1px solid ${colors.stroke}`,
                    bgcolor: colors.cardBackground,
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        color={colors.headline}
                      >
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
                              sx={{
                                color: colors.highlight,
                                "&.Mui-checked": { color: colors.highlight },
                              }}
                            />
                          }
                          label="Inbox"
                          sx={{ color: colors.paragraph }}
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={filters.sent}
                              onChange={() =>
                                setFilters({ ...filters, sent: !filters.sent })
                              }
                              sx={{
                                color: colors.highlight,
                                "&.Mui-checked": { color: colors.highlight },
                              }}
                            />
                          }
                          label="Sent"
                          sx={{ color: colors.paragraph }}
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
                              sx={{
                                color: colors.highlight,
                                "&.Mui-checked": { color: colors.highlight },
                              }}
                            />
                          }
                          label="Unread"
                          sx={{ color: colors.paragraph }}
                        />
                      </FormGroup>
                    </Grid>

                    <Grid item xs={12} sm={6} md={6}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography
                            variant="subtitle2"
                            gutterBottom
                            color={colors.headline}
                          >
                            Date Range
                          </Typography>
                          <TextField
                            size="small"
                            type="date"
                            label="From"
                            fullWidth
                            InputLabelProps={{
                              shrink: true,
                              style: { color: colors.paragraph },
                            }}
                            inputProps={{ style: { color: colors.main } }}
                            value={filters.dateFrom}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                dateFrom: e.target.value,
                              })
                            }
                            sx={{
                              mb: 1,
                              "& .MuiOutlinedInput-root": {
                                "& fieldset": { borderColor: colors.secondary },
                                "&:hover fieldset": {
                                  borderColor: colors.highlight,
                                },
                              },
                            }}
                          />
                          <TextField
                            size="small"
                            type="date"
                            label="To"
                            fullWidth
                            InputLabelProps={{
                              shrink: true,
                              style: { color: colors.paragraph },
                            }}
                            inputProps={{ style: { color: colors.main } }}
                            value={filters.dateTo}
                            onChange={(e) =>
                              setFilters({ ...filters, dateTo: e.target.value })
                            }
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                "& fieldset": { borderColor: colors.secondary },
                                "&:hover fieldset": {
                                  borderColor: colors.highlight,
                                },
                              },
                            }}
                          />
                        </Grid>
                        <Grid
                          item
                          xs={6}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-end",
                          }}
                        >
                          <Button
                            variant="contained"
                            fullWidth
                            sx={{
                              mb: 1,
                              backgroundColor: colors.highlight,
                              color: colors.main,
                              "&:hover": {
                                backgroundColor: colors.highlightHover,
                              },
                            }}
                            onClick={applyFilters}
                          >
                            Apply Filters
                          </Button>
                          <Button
                            variant="outlined"
                            fullWidth
                            onClick={resetFilters}
                            sx={{
                              color: colors.main,
                              borderColor: colors.secondary,
                              "&:hover": { borderColor: colors.highlight },
                            }}
                          >
                            Reset
                          </Button>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Box>
              )}

              <List sx={{ maxHeight: 400, overflow: "auto" }}>
                {dashboardData.emails.map((email) => (
                  <Box key={email.id}>
                    <ListItem
                      sx={{
                        "&:hover": {
                          backgroundColor: colors.highlightTransparent,
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography color={colors.headline}>
                            {email.subject}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            color={colors.paragraph}
                          >{`From: ${email.from}`}</Typography>
                        }
                      />
                      {filters.unread && (
                        <Box
                          sx={{
                            ml: 1,
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: colors.highlight,
                          }}
                        />
                      )}
                    </ListItem>
                    <Divider
                      component="li"
                      sx={{ borderColor: colors.stroke }}
                    />
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
                  borderRadius: 2,
                  border: `1px solid ${colors.stroke}`,
                  height: "100%",
                  backgroundColor: colors.cardBackground,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: `0px 4px 20px ${colors.highlightShadow}`,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h6"
                      color={colors.headline}
                      gutterBottom
                    >
                      Call Performance
                    </Typography>
                    <Divider
                      sx={{
                        mb: 2,
                        mx: "auto",
                        width: "80%",
                        borderColor: colors.stroke,
                      }}
                    />
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
                            <Typography variant="h4" color={colors.headline}>
                              {item.value}
                            </Typography>
                            <Typography
                              variant="subtitle2"
                              color={colors.paragraph}
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
                  borderRadius: 2,
                  border: `1px solid ${colors.stroke}`,
                  height: "100%",
                  backgroundColor: colors.cardBackground,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: `0px 4px 20px ${colors.highlightShadow}`,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    textAlign={"center"}
                    color={colors.headline}
                  >
                    Call Activity
                  </Typography>
                  <Divider sx={{ mb: 2, borderColor: colors.stroke }} />
                  <Box sx={{ height: 180, textAlign: "center" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.callActivity.chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={colors.secondary}
                        />
                        <XAxis
                          dataKey="name"
                          stroke={colors.paragraph}
                          tick={{ fill: colors.paragraph }}
                        />
                        <YAxis
                          stroke={colors.paragraph}
                          tick={{ fill: colors.paragraph }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: colors.cardBackground,
                            borderColor: colors.highlight,
                            color: colors.main,
                          }}
                        />
                        <Bar
                          dataKey="calls"
                          radius={[4, 4, 0, 0]}
                          fill={colors.highlight}
                          animationDuration={1500}
                        />
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
                  borderRadius: 2,
                  border: `1px solid ${colors.stroke}`,
                  height: "100%",
                  backgroundColor: colors.cardBackground,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: `0px 4px 20px ${colors.highlightShadow}`,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    textAlign={"center"}
                    color={colors.headline}
                  >
                    Quick Insights
                  </Typography>
                  <Divider sx={{ mb: 2, borderColor: colors.stroke }} />
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: "100%" }}>
                        <LinearProgress
                          variant="determinate"
                          value={
                            dashboardData.callActivity.insights.enterpriseLeads
                          }
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: `${colors.highlight}20`,
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: colors.highlight,
                            },
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color={colors.headline}>
                        {dashboardData.callActivity.insights.enterpriseLeads}%
                      </Typography>
                    </Box>
                    <Typography variant="caption" color={colors.paragraph}>
                      Enterprise Leads
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: "100%" }}>
                        <LinearProgress
                          variant="determinate"
                          value={
                            dashboardData.callActivity.insights.smbProspects
                          }
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: `${colors.highlight}20`,
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: colors.highlight,
                            },
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color={colors.headline}>
                        {dashboardData.callActivity.insights.smbProspects}%
                      </Typography>
                    </Box>
                    <Typography variant="caption" color={colors.paragraph}>
                      SMB Prospects
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" color={colors.headline}>
                      {dashboardData.callActivity.insights.timeOnCalls}
                    </Typography>
                    <Typography variant="caption" color={colors.paragraph}>
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
export { colors }; // Export the color palette for use in other components
