import { useRef, useState } from "react";
import { Box, Grid, Popover, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { CalendarMonth as CalendarIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { format } from "date-fns";

import { useDashboardData, type Period, type PresetPeriod } from "./useDashboardData";
import TotalCallsCard from "./components/TotalCallsCard";
import PendingTasksCard from "./components/PendingTasksCard";
import QualityScoreCard from "./components/QualityScoreCard";
import AvgDurationCard from "./components/AvgDurationCard";
import RecentTasksCard from "./components/RecentTasksCard";
import CallOutcomesCard from "./components/CallOutcomesCard";

const Dashboard = () => {
  const theme = useTheme();
  const { user, kpi, tasks, groupedTasks, outcomeData, navigate, period, setPeriod, customDate, setCustomDate } =
    useDashboardData();

  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarAnchor = useRef<HTMLButtonElement>(null);

  const presetLabels: Record<PresetPeriod, string> = {
    today: "today",
    week: "this week",
    month: "this month",
  };

  const isPreset = period === "today" || period === "week" || period === "month";
  const periodLabel = isPreset
    ? presetLabels[period]
    : customDate
      ? format(customDate, "MMM d, yyyy")
      : period;

  return (
    <Box
      p={3}
      sx={{
        backgroundColor: theme.palette.background.default,
        width: "80%",
        margin: "0 auto",
        minHeight: "100vh",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Hi {user?.firstName || "there"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Here's your sales velocity for {periodLabel}
          </Typography>
        </Box>

        <>
          <ToggleButtonGroup
            value={isPreset ? period : null}
            exclusive
            onChange={(_e, val: PresetPeriod | null) => {
              if (val) {
                setPeriod(val);
                setCustomDate(null);
              }
            }}
            size="small"
            sx={{
              backgroundColor: "#fff",
              border: "1px solid #9facbf",
              borderRadius: 2,
              "& .MuiToggleButton-root": {
                border: "none",
                borderRadius: "8px !important",
                px: 2,
                py: 0.5,
                textTransform: "capitalize",
                fontSize: 13,
                fontWeight: 500,
                color: "text.secondary",
                "&.Mui-selected": {
                  backgroundColor: "#f1f5f9",
                  color: "text.primary",
                  "&:hover": { backgroundColor: "#f1f5f9" },
                },
              },
            }}
          >
            <ToggleButton value="today">Today</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton
              value="__calendar__"
              ref={calendarAnchor}
              selected={!isPreset}
              onClick={(e) => {
                e.preventDefault();
                setCalendarOpen(true);
              }}
              sx={{ px: "10px !important", minWidth: 0, borderLeft: "none !important", borderRadius: "0 8px 8px 0 !important" }}
            >
              <CalendarIcon sx={{ fontSize: 18, color: "#9facbf" }} />
            </ToggleButton>
          </ToggleButtonGroup>

          <Popover
            open={calendarOpen}
            anchorEl={calendarAnchor.current}
            onClose={() => setCalendarOpen(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <DateCalendar
              value={customDate}
              onChange={(date: Date | null) => {
                if (date) {
                  setCustomDate(date);
                  setPeriod(format(date, "yyyy-MM-dd"));
                }
                setCalendarOpen(false);
              }}
            />
          </Popover>
        </>
      </Stack>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3} sx={{ display: "flex" }}>
          <TotalCallsCard calls={kpi.calls} periodLabel={periodLabel} />
        </Grid>
        <Grid item xs={12} md={3} sx={{ display: "flex" }}>
          <PendingTasksCard groupedTasks={groupedTasks} tasks={tasks} />
        </Grid>
        <Grid item xs={12} md={3} sx={{ display: "flex" }}>
          <QualityScoreCard satisfaction={kpi.satisfaction} />
        </Grid>
        <Grid item xs={12} md={3} sx={{ display: "flex" }}>
          <AvgDurationCard duration={kpi.duration} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7} sx={{ display: "flex" }}>
          <RecentTasksCard tasks={tasks} onViewAll={() => navigate("/tasks")} />
        </Grid>
        <Grid item xs={12} md={5} sx={{ display: "flex" }}>
          <CallOutcomesCard outcomeData={outcomeData} totalCalls={kpi.calls} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
