import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Select,
  MenuItem,
  Button,
  Tabs,
  Tab,
  InputLabel,
  FormControl,
  Container,
} from "@mui/material";
import { useEffect, useState } from "react";
import { DatePicker } from "@mui/x-date-pickers";
import { format } from "date-fns";
import api from "../../../utils/axiosInstance";
import { useSnackbar } from "../../../hooks/useSnackbar";
import {
  campaignV2,
  campaignV2CardSx,
  campaignV2SectionTitleSx,
} from "../Campaign/components/campaignV2Tokens";

const primaryButtonSx = {
  textTransform: "none" as const,
  fontWeight: 700,
  color: "#fff",
  background: campaignV2.gradient,
  boxShadow: "0 2px 8px rgba(91, 33, 182, 0.35)",
  "&:hover": {
    background: campaignV2.accentDark,
    color: "#fff",
  },
};

const tableHeadRowSx = {
  bgcolor: "rgba(107, 70, 193, 0.08)",
  borderBottom: "1px solid rgba(107, 70, 193, 0.12)",
};

const outlinedControlSx = {
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(107, 70, 193, 0.35)",
  },
};

const dateSlotProps = {
  textField: {
    size: "small" as const,
    sx: outlinedControlSx,
  },
};

const ReportsPage = () => {
  const { enqueue } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("list");
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  const [listPerformance, setListPerformance] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);

  const [users, setUsers] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedListId, setSelectedListId] = useState("");

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [usersRes, listsRes] = await Promise.all([
          api.get("/users/mine"),
          api.get("/lists/all"),
        ]);

        setUsers(usersRes.data);
        setLists(listsRes.data);
      } catch (err) {
        enqueue("Failed to load filters", { variant: "error" });
      }
    };
    loadFilters();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const start = format(startDate!, "yyyy-MM-dd");
      const end = format(endDate!, "yyyy-MM-dd");

      const userIds = selectedUserId ? [selectedUserId] : undefined;
      const listIds = selectedListId ? [selectedListId] : undefined;

      const [listRes, activityRes] = await Promise.all([
        api.get("/reports/list-performance", {
          params: { start, end, userIds, listIds },
        }),
        api.get("/reports/activity", {
          params: { start, end, userIds },
        }),
      ]);

      setListPerformance(listRes.data);
      setActivityData(activityRes.data);
    } catch (err) {
      enqueue("Failed to fetch reports", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <Container
      maxWidth={false} 
      sx={{
        py: 3,
        px: { xs: 2, sm: 3 },
        bgcolor: campaignV2.pageBg,
        minHeight: "100%",
      }}
    >
      <Box mb={3}>
        <Typography sx={campaignV2SectionTitleSx}>Analytics</Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
          Reports
        </Typography>
        <Typography color="text.secondary" mb={2} sx={{ mt: 0.5 }}>
          Analyze your team's performance by list and user activity
        </Typography>
        <Paper variant="outlined" sx={{ ...campaignV2CardSx, p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(val) => setStartDate(val)}
              slotProps={dateSlotProps}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(val) => setEndDate(val)}
              slotProps={dateSlotProps}
            />
            <FormControl size="small" sx={{ minWidth: 200, ...outlinedControlSx }}>
              <InputLabel>User</InputLabel>
              <Select
                value={selectedUserId}
                label="User"
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200, ...outlinedControlSx }}>
              <InputLabel>List</InputLabel>
              <Select
                value={selectedListId}
                label="List"
                onChange={(e) => setSelectedListId(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {lists.map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.listName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button onClick={fetchReports} variant="contained" color="inherit" sx={primaryButtonSx}>
              Run Report
            </Button>
          </Stack>
        </Paper>

        <Tabs
          value={tab}
          onChange={(e, val) => setTab(val)}
          sx={{
            mb: 2,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
            "& .Mui-selected": { color: `${campaignV2.accent} !important` },
            "& .MuiTabs-indicator": { bgcolor: campaignV2.tabIndicator },
          }}
        >
          <Tab value="list" label="List Performance" />
          <Tab value="activity" label="Activity Report" />
        </Tabs>
      </Box>

      {loading ? (
        <Paper
          variant="outlined"
          sx={{
            ...campaignV2CardSx,
            display: "flex",
            justifyContent: "center",
            py: 6,
          }}
        >
          <CircularProgress sx={{ color: campaignV2.accent }} />
        </Paper>
      ) : tab === "list" ? (
        <>
          <Typography variant="h6" mb={1} fontWeight={700}>
            List Performance
          </Typography>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ ...campaignV2CardSx, width: "100%" }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={tableHeadRowSx}>
                  <TableCell sx={{ fontWeight: 600 }}>List Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Calls Out</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Connects</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Connect Rate</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Avg Talk Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listPerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  listPerformance.map((row) => (
                    <TableRow key={row.listId}>
                      <TableCell>{row.listName}</TableCell>
                      <TableCell>{row.callsOut}</TableCell>
                      <TableCell>{row.connects}</TableCell>
                      <TableCell>{row.connectRate ?? "-"}%</TableCell>
                      <TableCell>{row.avgTalkTime}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <>
          <Typography variant="h6" mb={1} fontWeight={700}>
            Activity Report
          </Typography>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ ...campaignV2CardSx, width: "100%" }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={tableHeadRowSx}>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Total Dials</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Outbound</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Inbound</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Connects</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Connect Rate</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Total Talk</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Avg Talk</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activityData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  activityData.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.totalDials}</TableCell>
                      <TableCell>{user.outboundCalls}</TableCell>
                      <TableCell>{user.inboundCalls}</TableCell>
                      <TableCell>{user.connects}</TableCell>
                      <TableCell>{user.connectRate ?? "-"}%</TableCell>
                      <TableCell>{user.totalTalkTime}</TableCell>
                      <TableCell>{user.avgTalkTime}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Container>
  );
};

export default ReportsPage;
