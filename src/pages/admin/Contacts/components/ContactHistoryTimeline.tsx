import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Checkbox,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from "@mui/material";
import {
  PlaylistAdd,
  AddTask,
  UnfoldMore,
  Email as EmailIcon,
  Sms as SmsIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { CallLog } from "voice-javascript-common";
import { differenceInMonths } from "date-fns";

import api from "../../../../utils/axiosInstance";
import useAppStore from "../../../../store/useAppStore";
import { CallResult } from "../../../../types/call-results";
import {
  TimelineActivityItem,
  TimelineEntry,
} from "./TimelineActivityItem";

interface GmailStatus {
  connected: boolean;
  emailAddress?: string;
}

interface EmailReply {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
}

type ActivityFilter = "CALLS" | "EMAILS" | "SMS" | "DEMOS" | "MEETING" | "OTHER" | "ALL";

interface ContactHistoryTimelineProps {
  contactId: string;
  contactListId?: string;
  listName?: string;
  onAddToList?: (e: React.MouseEvent) => void;
  onAddTask?: () => void;
  onNewEmail?: () => void;
  onNewSms?: () => void;
  onResultChange?: (sid: string, result: string) => void;
}

export function ContactHistoryTimeline({
  contactId,
  contactListId,
  listName,
  onAddToList,
  onAddTask,
  onNewEmail,
  onNewSms,
  onResultChange,
}: ContactHistoryTimelineProps) {
  const { user, settings } = useAppStore();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [emailReplies, setEmailReplies] = useState<EmailReply[]>([]);
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnlyMyActivity, setShowOnlyMyActivity] = useState(false);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("ALL");
  const [listsExpanded, setListsExpanded] = useState(true);
  const [listsTasksExpanded, setListsTasksExpanded] = useState(false);

  const callResults: CallResult[] =
    (settings?.["Phone Settings"]?.callResults as CallResult[]) ?? [];

  useEffect(() => {
    const fetch = async () => {
      if (!contactId) return;
      setLoading(true);
      try {
        const params: Record<string, string> = { contactId };
        if (showOnlyMyActivity && user?.id) {
          params.userId = user.id;
        }
        const [callRes, gmailRes] = await Promise.all([
          api.get("/call-logs", { params }),
          api.get<GmailStatus>("/email/gmail/status").catch(() => ({ data: { connected: false } })),
        ]);
        setCallLogs(callRes.data.recordings || []);
        setGmailStatus(gmailRes.data);

        if (gmailRes.data?.connected) {
          const emailRes = await api.get<EmailReply[]>("/email/gmail/replies", {
            params: { contactId },
          });
          setEmailReplies(emailRes.data || []);
        } else {
          setEmailReplies([]);
        }
      } catch (err) {
        console.error("Failed to load activity:", err);
        setCallLogs([]);
        setEmailReplies([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [contactId, showOnlyMyActivity, user?.id]);

  const mergedTimeline = useMemo(() => {
    const entries: TimelineEntry[] = [];
    const filteredCalls =
      activityFilter === "CALLS" || activityFilter === "ALL"
        ? callLogs.filter((l) => {
            const hasResult = !!(l.action?.result ?? (l as any).resultLabel)?.trim();
            return hasResult;
          })
        : [];
    filteredCalls.forEach((c) => {
      entries.push({ type: "call", data: c });
    });
    if (activityFilter === "EMAILS" || activityFilter === "ALL") {
      emailReplies.forEach((e) => {
        entries.push({
          type: "email",
          data: {
            id: e.id,
            subject: e.subject,
            from: e.from,
            to: e.to,
            date: e.date,
            snippet: e.snippet,
          },
        });
      });
    }
    entries.sort((a, b) => {
      const getTs = (e: TimelineEntry) => {
        if (e.type === "call") {
          const c = e.data as CallLog;
          if (c.action?.timestamp) return Number(c.action.timestamp);
          return new Date((c as any).startedAt).getTime();
        }
        return new Date((e.data as { date: string }).date).getTime();
      };
      return getTs(b) - getTs(a);
    });
    return entries;
  }, [callLogs, emailReplies, activityFilter]);

  const getElapsedLabel = (entry: TimelineEntry, prevEntry: TimelineEntry | null) => {
    if (!prevEntry) return undefined;
    const getDate = (e: TimelineEntry) => {
      if (e.type === "call") {
        const c = e.data as CallLog;
        if (c.action?.timestamp) return new Date(Number(c.action.timestamp));
        return new Date((c as any).startedAt);
      }
      return new Date((e.data as EmailReply).date);
    };
    const months = differenceInMonths(getDate(prevEntry), getDate(entry));
    if (months >= 1) return `${months} month${months > 1 ? "s" : ""} without contact`;
    return undefined;
  };

  const listsCount = contactListId ? 1 : 0;
  const tasksCount = 0;

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="overline" fontWeight={700} color="text.secondary">
          CONTACT HISTORY
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            size="small"
            startIcon={<PlaylistAdd />}
            onClick={onAddToList}
            sx={{ textTransform: "none" }}
          >
            + Add to list
          </Button>
          <Button
            size="small"
            startIcon={<AddTask />}
            onClick={onAddTask}
            sx={{ textTransform: "none" }}
          >
            + Add task
          </Button>
          <Button
            size="small"
            onClick={() => {
              setListsTasksExpanded(true);
            }}
            sx={{ textTransform: "none" }}
          >
            Expand all
          </Button>
        </Stack>
      </Box>

      {/* Filter bar */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={2}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={showOnlyMyActivity}
                onChange={(_, v) => setShowOnlyMyActivity(v)}
              />
            }
            label={
              <Typography variant="body2">Show only my activity</Typography>
            }
          />
          <ToggleButtonGroup
            value={activityFilter}
            exclusive
            onChange={(_, v) => v != null && setActivityFilter(v)}
            size="small"
            sx={{ flexWrap: "wrap" }}
          >
            {(["CALLS", "EMAILS", "SMS", "DEMOS", "MEETING", "OTHER", "ALL"] as const).map(
              (f) => (
                <ToggleButton key={f} value={f}>
                  {f}
                </ToggleButton>
              )
            )}
          </ToggleButtonGroup>
        </Stack>
      </Box>

      {/* Lists/Playbooks and Tasks */}
      <Accordion
        expanded={listsTasksExpanded}
        onChange={(_, v) => setListsTasksExpanded(v)}
        sx={{
          borderRadius: 0,
          "&:before": { display: "none" },
          boxShadow: "none",
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2" fontWeight={500}>
            LISTS/PLAYBOOKS ({listsCount}) AND TASKS ({tasksCount})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {contactListId && listName ? (
            <Typography variant="body2" color="text.secondary">
              In list: {listName}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No lists or tasks
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Action buttons */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}
      >
        <Button
          size="small"
          variant="outlined"
          startIcon={<EmailIcon />}
          onClick={onNewEmail}
        >
          New email
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<SmsIcon />}
          onClick={onNewSms}
        >
          New SMS
        </Button>
      </Stack>

      {/* Timeline */}
      <Box sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : mergedTimeline.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No activity yet.
          </Typography>
        ) : (
          <Stack spacing={3}>
            {mergedTimeline.map((entry, idx) => (
              <Box
                key={
                  entry.type === "call"
                    ? (entry.data as CallLog).sid
                    : (entry.data as EmailReply).id
                }
                sx={{
                  position: "relative",
                  pl: 0,
                  "&:not(:last-child)::after": {
                    content: '""',
                    position: "absolute",
                    left: 10,
                    top: 36,
                    bottom: -24,
                    width: 2,
                    bgcolor: "divider",
                  },
                }}
              >
                <TimelineActivityItem
                  entry={entry}
                  callResults={callResults}
                  onResultChange={onResultChange}
                  elapsedLabel={getElapsedLabel(entry, mergedTimeline[idx - 1] ?? null)}
                />
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
