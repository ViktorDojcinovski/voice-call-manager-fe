import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Tabs,
  Tab,
  Select,
  MenuItem,
  Tooltip,
  Container,
} from "@mui/material";
import {
  MenuBook,
  CheckCircleOutline,
  Download,
  OpenInNew,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { CallLog } from "voice-javascript-common";
import { useNavigate } from "react-router-dom";

import api from "../../../utils/axiosInstance";
import cfg from "../../../config";
import useAppStore from "../../../store/useAppStore";
import AudioWaveform from "../../../components/AudioWaveform";
import { CallResult } from "../../../types/call-results";
import { useSnackbar } from "../../../hooks/useSnackbar";
import { Contact } from "../../../types/contact";
import {
  campaignV2,
  campaignV2CardSx,
  campaignV2SectionTitleSx,
} from "../Campaign/components/campaignV2Tokens";

const outlinedFilterButtonSx = {
  textTransform: "none" as const,
  fontWeight: 600,
  borderColor: campaignV2.accent,
  color: campaignV2.accent,
  "&:hover": {
    borderColor: campaignV2.accentDark,
    bgcolor: "rgba(107, 70, 193, 0.06)",
  },
};

const selectOutlineSx = {
  minWidth: 220,
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(107, 70, 193, 0.35)",
  },
};

const dateFieldSlotProps = {
  textField: {
    size: "small" as const,
    sx: {
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(107, 70, 193, 0.35)",
      },
    },
  },
};

const prettyDisposition = (raw?: string) => {
  if (!raw) return "";
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
};

type CallAction = NonNullable<CallLog["action"]>;

type ActivityRowProps = {
  entry: CallLog;
  callResults: CallResult[];
  onUpdateDisposition: (sid: string, result: string) => Promise<void>;
};

const ActivityRow = ({
  entry,
  callResults,
  onUpdateDisposition,
}: ActivityRowProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [contact, setContact] = useState<Contact | null | undefined>(undefined);

  const contactId = (entry as CallLog & { contactId?: string }).contactId;

  const handleDownload = async () => {
    if (!entry.recordingUrl) return;
    setDownloading(true);
    try {
      const url = `${cfg.backendUrl}${entry.recordingUrl}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `recording-${entry.sid || "call"}.mp3`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      // Fallback: open in new tab
      window.open(`${cfg.backendUrl}${entry.recordingUrl}`, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!contactId) {
      setContact(null);
      return;
    }
    setContact(undefined);
    let cancelled = false;
    api
      .get<Contact>(`/contacts/${contactId}`)
      .then((res) => {
        if (!cancelled) setContact(res.data);
      })
      .catch(() => {
        if (!cancelled) setContact(null);
      });
    return () => {
      cancelled = true;
    };
  }, [contactId]);

  let formattedTime = "";
  if (entry.action?.timestamp) {
    formattedTime = format(new Date(parseInt(entry.action.timestamp)), "PPpp");
  }

  const currentValue = entry.action?.result ?? "";

  const handleChange = async (newVal: string) => {
    if (!entry.sid || newVal === currentValue) return;
    setSaving(true);
    try {
      await onUpdateDisposition(entry.sid, newVal);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        py={1}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <CheckCircleOutline color="primary" />

          <Select
            size="small"
            value={currentValue}
            onChange={(e) => handleChange(e.target.value as string)}
            displayEmpty
            sx={{ minWidth: 220 }}
          >
            {currentValue &&
              !callResults.some((cr) => cr.label === currentValue) && (
                <MenuItem value={currentValue}>
                  {prettyDisposition(currentValue)}
                </MenuItem>
              )}
            {callResults.map((cr) => (
              <MenuItem key={cr.label} value={cr.label}>
                {prettyDisposition(cr.label)}
              </MenuItem>
            ))}
          </Select>

          {contactId && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ ml: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {contact === undefined
                  ? "Loading…"
                  : contact
                    ? [contact.first_name, contact.last_name]
                        .filter(Boolean)
                        .join(" ") || "—"
                    : "—"}
              </Typography>
              {contact?.id && (
                <Tooltip title="View contact" arrow placement="top">
                  <OpenInNew
                    fontSize="small"
                    sx={{
                      cursor: "pointer",
                      color: "primary.main",
                      "&:hover": { opacity: 0.8 },
                    }}
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                  />
                </Tooltip>
              )}
            </Stack>
          )}

          {entry.action?.notes && (
            <Tooltip title={entry.action.notes} arrow placement="top">
              <MenuBook
                fontSize="small"
                sx={{ cursor: "pointer", color: "primary.main" }}
              />
            </Tooltip>
          )}
          {saving && (
            <Typography variant="caption" color="text.secondary" ml={1}>
              Saving…
            </Typography>
          )}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography color="text.secondary" fontSize={13}>
            {formattedTime}
          </Typography>
          <Button size="small" onClick={() => setIsOpen((prev) => !prev)}>
            {isOpen ? "Hide" : "Show"} Voice Recording
          </Button>
        </Stack>
      </Box>

      {isOpen && (
        <Box pl={4} pb={2}>
          {entry.recordingUrl ? (
            <>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Tooltip title="Download recording" arrow placement="top">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleDownload}
                    disabled={downloading}
                    startIcon={<Download fontSize="small" />}
                  >
                    {downloading ? "Downloading…" : "Download"}
                  </Button>
                </Tooltip>
              </Stack>
              <AudioWaveform url={entry.recordingUrl} />
            </>
          ) : (
            <Typography fontSize={12} color="text.secondary">
              No call recording available for this call.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

const Coaching = () => {
  const navigate = useNavigate();
  const { enqueue } = useSnackbar();

  const [tabIndex, setTabIndex] = useState(0);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [startDate, setStartDate] = useState<null | Date>(() => new Date());
  const [endDate, setEndDate] = useState<null | Date>(() => new Date());
  const [selectedDisposition, setSelectedDisposition] = useState<string>("");

  const { settings } = useAppStore((state) => state);
  if (!settings) {
    navigate("/dashboard");
    return null;
  }

  const callResults =
    (settings["Phone Settings"].callResults as CallResult[]) || [];

  const fetchCallLogs = useCallback(
    async (userId = "") => {
      const params: any = { userId };
      if (startDate)
        params.startDate = dayjs(startDate).startOf("day").toISOString();
      if (endDate) params.endDate = dayjs(endDate).endOf("day").toISOString();
      if (selectedDisposition) params.disposition = selectedDisposition;

      const res = await api.get("/call-logs", { params });

      const cleaned: CallLog[] = (res.data.recordings ?? []).filter(
        (r: CallLog) =>
          !!r?.action?.result && String(r.action.result).trim().length > 0
      );

      setCallLogs(cleaned);
    },
    [startDate, endDate, selectedDisposition]
  );

  useEffect(() => {
    if (tabIndex === 1) {
      api.get("/users/mine").then((res) => setUsers(res.data));
      fetchCallLogs();
    }
  }, [tabIndex, fetchCallLogs]);

  useEffect(() => {
    fetchCallLogs(selectedUser);
  }, [selectedUser, startDate, endDate, selectedDisposition, fetchCallLogs]);

  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    fetchCallLogs(userId);
  };

  const setRangeToday = () => {
    const d = dayjs();
    setStartDate(d.startOf("day").toDate());
    setEndDate(d.endOf("day").toDate());
  };

  const setRangeThisWeek = () => {
    const d = dayjs();
    setStartDate(d.startOf("week").toDate());
    setEndDate(d.endOf("week").toDate());
  };

  const setRangeThisMonth = () => {
    const d = dayjs();
    setStartDate(d.startOf("month").toDate());
    setEndDate(d.endOf("month").toDate());
  };

  const onUpdateDisposition = async (sid: string, result: string) => {
    const ensureAction = (a?: CallLog["action"]): CallAction => ({
      result: a?.result ?? "",
      notes: a?.notes ?? "",
      timestamp: a?.timestamp ?? String(Date.now()),
    });

    try {
      await api.patch(`/call-logs/${sid}`, { result });
      setCallLogs((prev) => {
        const next: CallLog[] = prev.map((cl): CallLog => {
          if (cl.sid !== sid) return cl;

          const action = ensureAction(cl.action);
          return {
            ...cl,
            action: { ...action, result },
          };
        });
        return next;
      });
      enqueue("Disposition updated.", { variant: "success" });
    } catch (e: any) {
      enqueue(e?.response?.data?.message || "Failed to update disposition.", {
        variant: "error",
      });
    }
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 3,
        px: { xs: 2, sm: 3 },
        bgcolor: campaignV2.pageBg,
        minHeight: "100%",
      }}
    >
      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        sx={{
          mb: 3,
          "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
          "& .Mui-selected": { color: `${campaignV2.accent} !important` },
          "& .MuiTabs-indicator": { bgcolor: campaignV2.tabIndicator },
        }}
      >
        {/* <Tab label="Improve" sx={{ fontWeight: 600 }} /> */}
        <Tab label="Coach" sx={{ fontWeight: 600 }} />
      </Tabs>

      {/* {tabIndex === 0 ? (
        <ImproveSection />
      ) : ( */}
        <>
          <Typography sx={campaignV2SectionTitleSx}>Quality</Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }} gutterBottom>
            Coach Panel
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Review all call logs from your users and give feedback.
          </Typography>

          <Box mb={3} display="flex" gap={2} flexWrap="wrap">
            <Select
              size="small"
              value={selectedUser}
              onChange={(e) => handleUserChange(e.target.value)}
              displayEmpty
              sx={{ ...selectOutlineSx, minWidth: 250 }}
            >
              <MenuItem value="">All Users</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.email}
                </MenuItem>
              ))}
            </Select>

            <Select
              size="small"
              value={selectedDisposition}
              onChange={(e) => setSelectedDisposition(e.target.value)}
              displayEmpty
              sx={selectOutlineSx}
            >
              <MenuItem value="">All Dispositions</MenuItem>
              {callResults.map((cr) => (
                <MenuItem key={cr.label} value={cr.label}>
                  {prettyDisposition(cr.label)}
                </MenuItem>
              ))}
            </Select>

            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => setStartDate(date)}
              slotProps={dateFieldSlotProps}
            />

            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => setEndDate(date)}
              slotProps={dateFieldSlotProps}
            />
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={setRangeToday}
                sx={outlinedFilterButtonSx}
              >
                Today
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={setRangeThisWeek}
                sx={outlinedFilterButtonSx}
              >
                This week
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={setRangeThisMonth}
                sx={outlinedFilterButtonSx}
              >
                This month
              </Button>
            </Stack>
          </Box>

          <Paper variant="outlined" sx={{ ...campaignV2CardSx, p: 2 }}>
            {callLogs.length > 0 ? (
              <Stack spacing={2}>
                {callLogs.map((log) => (
                  <ActivityRow
                    key={log.sid}
                    entry={log}
                    callResults={callResults}
                    onUpdateDisposition={onUpdateDisposition}
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No call logs available.
              </Typography>
            )}
          </Paper>
        </>
      {/* )} */}
    </Container>
  );
};

export default Coaching;
