// ImproveSection.tsx
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Stack,
  Divider,
  Button,
  LinearProgress,
} from "@mui/material";

import { campaignV2 } from "../Campaign/components/campaignV2Tokens";
import { AccessTime, Lock } from "@mui/icons-material";

export default function ImproveSection() {
  return (
    <>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Coaching
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Improve your skills with personalized coaching and training resources
      </Typography>

      {/* Progress Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight="bold">
              Completed Modules
            </Typography>
            <Typography color="primary" fontSize={28} fontWeight="bold">
              2/5
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(2 / 5) * 100}
              sx={{ mt: 1 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight="bold">
              Performance Score
            </Typography>
            <Typography color="success.main" fontSize={28} fontWeight="bold">
              86%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={86}
              sx={{ mt: 1, bgcolor: "#e0f2f1" }}
              color="success"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight="bold">
              Training Hours
            </Typography>
            <Typography color="secondary" fontSize={28} fontWeight="bold">
              12.5 hrs
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(12.5 / 20) * 100}
              sx={{ mt: 1, bgcolor: "#fef3e2" }}
              color="secondary"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Learning Modules */}
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Learning Modules
      </Typography>
      <Grid container spacing={2} mb={4}>
        {[
          {
            title: "Effective Communication Skills",
            time: "45 min",
            status: "Start",
            description:
              "Learn techniques to communicate clearly and effectively with clients over the phone.",
          },
          {
            title: "Handling Difficult Conversations",
            time: "60 min",
            status: "Start",
            description:
              "Strategies for navigating challenging client interactions with confidence and professionalism.",
          },
          {
            title: "Product Knowledge Fundamentals",
            time: "90 min",
            status: "Continue",
            description:
              "Comprehensive overview of product features, benefits, and value propositions.",
            badge: "In Progress",
          },
          {
            title: "Advanced Sales Techniques",
            time: "120 min",
            status: "Locked",
            description:
              "Learn proven methods to increase conversion rates and customer satisfaction.",
            locked: true,
          },
        ].map((mod, idx) => (
          <Grid item xs={12} md={6} key={idx}>
            <Paper sx={{ p: 2, height: "100%" }} variant="outlined">
              <Typography fontWeight="bold">{mod.title}</Typography>
              {mod.badge && (
                <Chip
                  label={mod.badge}
                  size="small"
                  color="warning"
                  sx={{ ml: 1 }}
                />
              )}
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {mod.description}
              </Typography>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccessTime
                    fontSize="small"
                    sx={{ color: "text.secondary" }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {mod.time}
                  </Typography>
                </Stack>
                {mod.locked ? (
                  <Button
                    size="small"
                    variant="outlined"
                    disabled
                    startIcon={<Lock />}
                  >
                    Locked
                  </Button>
                ) : (
                  <Button size="small" variant="contained">
                    {mod.status}
                  </Button>
                )}
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Upcoming Training Sessions & Resources */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" fontWeight="bold" mb={1}>
            Upcoming Training Sessions
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Box>
                <Typography fontWeight="bold">
                  Team Role Play Session
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tomorrow, 2:00 PM • 8 participants
                </Typography>
                <Button variant="contained" size="small" sx={{ mt: 1 }}>
                  Join
                </Button>
              </Box>
              <Divider />
              <Box>
                <Typography fontWeight="bold">
                  New Product Introduction
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  June 15, 10:30 AM • 12 participants
                </Typography>
                <Button variant="contained" size="small" sx={{ mt: 1 }}>
                  Join
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" fontWeight="bold" mb={1}>
            Coaching Resources
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1}>
              {[
                "Call Scripts Library",
                "Training Videos",
                "Request 1-on-1 Coaching",
                "Peer Review Sessions",
              ].map((res, i) => (
                <Button key={i} variant="outlined" fullWidth>
                  {res}
                </Button>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* AI Coach Notice */}
      <Box
        mt={5}
        p={3}
        sx={{
          background: campaignV2.gradient,
          borderRadius: 2,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography color="#fff" fontSize={18} fontWeight="bold">
              Coming Soon: AI Coach
            </Typography>
            <Typography color="#e0e0e0">
              Our new AI coaching assistant will provide personalized feedback
              on your calls and help improve your performance.
            </Typography>
          </Box>
          <Button variant="contained" color="secondary">
            Get Notified
          </Button>
        </Stack>
      </Box>
    </>
  );
}
