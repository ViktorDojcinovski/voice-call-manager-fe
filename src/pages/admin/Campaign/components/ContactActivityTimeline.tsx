import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { CallLog } from "voice-javascript-common";
import { differenceInCalendarMonths, isValid } from "date-fns";

import useAppStore from "../../../../store/useAppStore";
import { CallResult } from "../../../../types/call-results";
import api from "../../../../utils/axiosInstance";
import ActivityRow from "./molecules/ActivityRow";
import { EmailActivityRow } from "./molecules/EmailActivityRow";
import type { EmailReply } from "./ContactEmailRepliesSection";
import {
  campaignV2,
  campaignV2CardSx,
  campaignV2SectionTitleSx,
} from "./campaignV2Tokens";

export type TimelineDensity = "compact" | "comfortable";

type ActivityFilter = "ALL" | "CALLS" | "EMAILS";

interface GmailStatus {
  connected: boolean;
  emailAddress?: string;
}

function parseLogTime(log: CallLog): number | null {
  const raw = log.action?.timestamp;
  if (raw == null) return null;
  const n = Number(raw);
  if (!Number.isNaN(n) && n > 0) return n;
  return null;
}

function parseEmailTime(reply: EmailReply): number | null {
  if (!reply.date) return null;
  const ms = new Date(reply.date).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function formatGapLabel(prevMs: number, nextMs: number): string | null {
  const months = differenceInCalendarMonths(
    new Date(prevMs),
    new Date(nextMs),
  );
  if (months >= 2) {
    return `${months} months without contact`;
  }
  if (months === 1) {
    return "1 month without contact";
  }
  const days = Math.floor((prevMs - nextMs) / (86400 * 1000));
  if (days >= 60) {
    return `${Math.floor(days / 30)} months without contact`;
  }
  if (days >= 14) {
    return `${Math.floor(days / 7)} weeks without contact`;
  }
  return null;
}

type MergedEntry =
  | { kind: "call"; log: CallLog; time: number }
  | { kind: "email"; reply: EmailReply; time: number };

export interface ContactActivityTimelineProps {
  contactId: string;
  density?: TimelineDensity;
  /** Max height when density is compact (scroll inside). */
  compactMaxHeight?: number | string;
  showFilterChips?: boolean;
  showToolbar?: boolean;
  /** Parent bumps this after disposition save to refetch call logs */
  refreshKey?: number;
}

export function ContactActivityTimeline({
  contactId,
  density = "comfortable",
  compactMaxHeight = 320,
  showFilterChips = true,
  showToolbar = true,
  refreshKey = 0,
}: ContactActivityTimelineProps) {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const [emailReplies, setEmailReplies] = useState<EmailReply[]>([]);
  const [filter, setFilter] = useState<ActivityFilter>("ALL");
  const { settings } = useAppStore((s) => s);
  const callResults: CallResult[] =
    (settings?.["Phone Settings"]?.callResults as CallResult[]) ?? [];

  const loadLogs = useCallback(async () => {
    if (!contactId) return;
    try {
      const res = await api.get("/call-logs", {
        params: { contactId },
      });
      setCallLogs(res.data.recordings ?? []);
    } catch (e) {
      console.error("[ContactActivityTimeline] fetch failed", e);
      setCallLogs([]);
    }
  }, [contactId]);

  const loadGmailAndReplies = useCallback(async () => {
    if (!contactId) return;
    try {
      const statusRes = await api.get<GmailStatus>("/email/gmail/status");
      const connected = !!statusRes.data?.connected;
      setGmailConnected(connected);
      if (!connected) {
        setEmailReplies([]);
        return;
      }
    } catch {
      setGmailConnected(false);
      setEmailReplies([]);
      return;
    }

    try {
      const repliesRes = await api.get<EmailReply[]>("/email/gmail/replies", {
        params: { contactId, limit: 50 },
      });
      setEmailReplies(repliesRes.data ?? []);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      const status = err.response?.status;
      if (status === 409 || status === 400) {
        setEmailReplies([]);
      } else {
        console.error("[ContactActivityTimeline] email replies fetch failed", error);
        setEmailReplies([]);
      }
    }
  }, [contactId]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs, refreshKey]);

  useEffect(() => {
    void loadGmailAndReplies();
  }, [loadGmailAndReplies, refreshKey]);

  const sortedCalls = useMemo(() => {
    const withResult = callLogs.filter((l) => !!l.action?.result?.trim());
    return [...withResult].sort((a, b) => {
      const ta = parseLogTime(a) ?? 0;
      const tb = parseLogTime(b) ?? 0;
      return tb - ta;
    });
  }, [callLogs]);

  const mergedAll = useMemo(() => {
    const entries: MergedEntry[] = [];
    for (const log of sortedCalls) {
      const t = parseLogTime(log) ?? 0;
      entries.push({ kind: "call", log, time: t });
    }
    for (const reply of emailReplies) {
      const t = parseEmailTime(reply) ?? 0;
      entries.push({ kind: "email", reply, time: t });
    }
    entries.sort((a, b) => b.time - a.time);
    return entries;
  }, [sortedCalls, emailReplies]);

  const visibleEntries = useMemo(() => {
    if (filter === "CALLS") {
      return mergedAll.filter((e) => e.kind === "call");
    }
    if (filter === "EMAILS") {
      return mergedAll.filter((e) => e.kind === "email");
    }
    return mergedAll;
  }, [mergedAll, filter]);

  const entriesWithGaps = useMemo(() => {
    type Item =
      | { type: "gap"; label: string }
      | { type: "call"; log: CallLog }
      | { type: "email"; reply: EmailReply };
    const out: Item[] = [];
    let prevTime: number | null = null;
    for (const entry of visibleEntries) {
      const t = entry.time;
      if (t > 0 && prevTime != null && isValid(new Date(t))) {
        const label = formatGapLabel(prevTime, t);
        if (label) out.push({ type: "gap", label });
      }
      if (entry.kind === "call") {
        out.push({ type: "call", log: entry.log });
      } else {
        out.push({ type: "email", reply: entry.reply });
      }
      if (t > 0) prevTime = t;
    }
    return out;
  }, [visibleEntries]);

  const handleResultChange = (sid: string, result: string) => {
    setCallLogs((prev) =>
      prev.map((cl) =>
        cl.sid === sid
          ? {
              ...cl,
              action: {
                ...(cl.action ?? { result: "", notes: "", timestamp: "" }),
                result,
              },
            }
          : cl,
      ),
    );
  };

  const handleNotesChange = (sid: string, notes: string) => {
    setCallLogs((prev) =>
      prev.map((cl) =>
        cl.sid === sid
          ? {
              ...cl,
              action: {
                ...(cl.action ?? { result: "", notes: "", timestamp: "" }),
                notes,
              },
            }
          : cl,
      ),
    );
  };

  const listSx =
    density === "compact"
      ? {
          maxHeight: compactMaxHeight,
          overflowY: "auto" as const,
          pr: 0.5,
        }
      : {};

  const showEmailsConnectHint =
    filter === "EMAILS" && gmailConnected === false;

  const showEmptyEmailsHint =
    filter === "EMAILS" &&
    gmailConnected === true &&
    visibleEntries.length === 0;

  const showEmailsLoading =
    filter === "EMAILS" && gmailConnected === null;

  return (
    <Paper variant="outlined" sx={{ ...campaignV2CardSx, p: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        sx={{ mb: 1.5 }}
      >
        <Typography sx={campaignV2SectionTitleSx}>
          Contact history
        </Typography>
        {showToolbar && (
          <Typography
            variant="caption"
            sx={{ color: campaignV2.link, fontWeight: 600, cursor: "default" }}
          >
            {visibleEntries.length}{" "}
            {visibleEntries.length === 1 ? "activity" : "activities"}
          </Typography>
        )}
      </Stack>
      {showFilterChips && (
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filter}
            onChange={(_, v) => v && setFilter(v)}
            sx={{
              "& .MuiToggleButton-root": {
                textTransform: "none",
                fontWeight: 600,
                px: 1.5,
                borderRadius: "20px !important",
                border: "1px solid",
                borderColor: "divider",
                mr: 0.5,
              },
              "& .Mui-selected": {
                bgcolor: `${campaignV2.accent} !important`,
                color: "#fff !important",
                borderColor: `${campaignV2.accent} !important`,
              },
            }}
          >
            <ToggleButton value="ALL">All</ToggleButton>
            <ToggleButton value="CALLS">Calls</ToggleButton>
            <ToggleButton value="EMAILS">Emails</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      )}
      <Box sx={listSx}>
        {showEmailsLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        ) : showEmailsConnectHint ? (
          <Typography variant="body2" color="text.secondary">
            Connect Gmail in Settings → Email Settings.
          </Typography>
        ) : showEmptyEmailsHint ? (
          <Typography variant="body2" color="text.secondary">
            No email activity for this contact yet.
          </Typography>
        ) : entriesWithGaps.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No activity history yet.
          </Typography>
        ) : (
          <Stack spacing={0}>
            {entriesWithGaps.map((item, idx) =>
              item.type === "gap" ? (
                <Typography
                  key={`gap-${idx}`}
                  variant="caption"
                  sx={{
                    py: 1.5,
                    color: "text.secondary",
                    fontStyle: "italic",
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </Typography>
              ) : item.type === "call" ? (
                <ActivityRow
                  key={item.log.sid}
                  entry={item.log}
                  callResults={callResults}
                  onResultChange={handleResultChange}
                  onNotesChange={handleNotesChange}
                  variant="timeline"
                />
              ) : (
                <EmailActivityRow key={item.reply.id} reply={item.reply} />
              ),
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
