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
import {
  campaignV2,
  campaignV2CardSx,
  campaignV2SectionTitleSx,
} from "./campaignV2Tokens";

export type TimelineDensity = "compact" | "comfortable";

type ActivityFilter = "ALL" | "CALLS";

function parseLogTime(log: CallLog): number | null {
  const raw = log.action?.timestamp;
  if (raw == null) return null;
  const n = Number(raw);
  if (!Number.isNaN(n) && n > 0) return n;
  return null;
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

  useEffect(() => {
    void loadLogs();
  }, [loadLogs, refreshKey]);

  const visibleCallLogs = useMemo(() => {
    const withResult = callLogs.filter((l) => !!l.action?.result?.trim());
    const sorted = [...withResult].sort((a, b) => {
      const ta = parseLogTime(a) ?? 0;
      const tb = parseLogTime(b) ?? 0;
      return tb - ta;
    });
    if (filter === "CALLS") {
      return sorted;
    }
    return sorted;
  }, [callLogs, filter]);

  const entriesWithGaps = useMemo(() => {
    type Item = { type: "gap"; label: string } | { type: "log"; log: CallLog };
    const out: Item[] = [];
    let prevTime: number | null = null;
    for (const log of visibleCallLogs) {
      const t = parseLogTime(log);
      if (t != null && prevTime != null && isValid(new Date(t))) {
        const label = formatGapLabel(prevTime, t);
        if (label) out.push({ type: "gap", label });
      }
      out.push({ type: "log", log });
      if (t != null) prevTime = t;
    }
    return out;
  }, [visibleCallLogs]);

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
            {visibleCallLogs.length}{" "}
            {visibleCallLogs.length === 1 ? "activity" : "activities"}
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
          </ToggleButtonGroup>
        </Stack>
      )}
      <Box sx={listSx}>
        {entriesWithGaps.length === 0 ? (
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
              ) : (
                <ActivityRow
                  key={item.log.sid}
                  entry={item.log}
                  callResults={callResults}
                  onResultChange={handleResultChange}
                  onNotesChange={handleNotesChange}
                  variant="timeline"
                />
              ),
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
