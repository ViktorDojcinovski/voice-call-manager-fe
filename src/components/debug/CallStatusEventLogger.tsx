import { useCallback, useEffect, useRef, useState } from "react";
import type { Device } from "@twilio/voice-sdk";
import type { Socket } from "socket.io-client";
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  BugReport as BugReportIcon,
  ContentCopy as CopyIcon,
  DeleteOutline as ClearIcon,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";

import useAppStore from "../../store/useAppStore";

const LS_EXPANDED = "vcm_call_status_log_expanded";

export type CallStatusLogEntry = {
  id: number;
  at: number;
  source: "socket" | "twilio-device";
  label: string;
  payload: Record<string, unknown>;
};

/** Only when Settings → Phone Settings → Twilio status log → enabled (default false). */
function useCallStatusLogEnabled(): boolean {
  return useAppStore(
    (s) => s.settings?.["Phone Settings"]?.callStatusLog?.enabled === true,
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

type CallStatusEventLoggerProps = {
  userId: string | undefined;
  socket: Socket | null;
  twilioDevice: Device | null;
};

/**
 * Logs backend Twilio status socket events (`call-status-user-*`) and basic Twilio Voice
 * device events. Shown only when **Settings → Phone Settings → Twilio status log** is enabled
 * (defaults to false; admins save the toggle, agents inherit from admin).
 */
export default function CallStatusEventLogger({
  userId,
  socket,
  twilioDevice,
}: CallStatusEventLoggerProps) {
  const loggerEnabled = useCallStatusLogEnabled();

  const [expanded, setExpanded] = useState(() => {
    try {
      return localStorage.getItem(LS_EXPANDED) !== "0";
    } catch {
      return true;
    }
  });
  const [entries, setEntries] = useState<CallStatusLogEntry[]>([]);
  const idRef = useRef(0);

  const pushEntry = useCallback(
    (source: CallStatusLogEntry["source"], label: string, payload: Record<string, unknown>) => {
      const id = ++idRef.current;
      const at = Date.now();
      setEntries((prev) => {
        const next = [{ id, at, source, label, payload }, ...prev];
        return next.slice(0, 250);
      });
    },
    [],
  );

  useEffect(() => {
    if (!loggerEnabled || !userId || !socket) return;

    const roomEvent = `call-status-user-${userId}`;
    const handler = (payload: Record<string, unknown>) => {
      const status = payload?.status ?? "?";
      pushEntry("socket", `call-status (${String(status)})`, payload);
    };

    socket.on(roomEvent, handler);
    return () => {
      socket.off(roomEvent, handler);
    };
  }, [loggerEnabled, userId, socket, pushEntry]);

  useEffect(() => {
    if (!loggerEnabled || !twilioDevice) return;

    const dev = twilioDevice;
    const onRegistered = () =>
      pushEntry("twilio-device", "device.registered", {});
    const onUnregistered = () =>
      pushEntry("twilio-device", "device.unregistered", {});
    const onError = (err: unknown) =>
      pushEntry("twilio-device", "device.error", {
        message: err instanceof Error ? err.message : String(err),
      });
    const onIncoming = (call: { parameters?: Record<string, string> }) =>
      pushEntry("twilio-device", "device.incoming", {
        parameters: call?.parameters ?? {},
      });

    dev.on("registered", onRegistered);
    dev.on("unregistered", onUnregistered);
    dev.on("error", onError);
    dev.on("incoming", onIncoming);

    return () => {
      dev.off("registered", onRegistered);
      dev.off("unregistered", onUnregistered);
      dev.off("error", onError);
      dev.off("incoming", onIncoming);
    };
  }, [loggerEnabled, twilioDevice, pushEntry]);

  if (!loggerEnabled) {
    return null;
  }

  const copyAll = () => {
    const text = JSON.stringify(
      entries.map((e) => ({
        time: new Date(e.at).toISOString(),
        source: e.source,
        label: e.label,
        payload: e.payload,
      })),
      null,
      2,
    );
    void navigator.clipboard.writeText(text);
  };

  const clear = () => setEntries([]);

  const toggleExpanded = () => {
    setExpanded((e) => {
      const next = !e;
      try {
        localStorage.setItem(LS_EXPANDED, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: (t) => t.zIndex.modal - 1,
        width: expanded ? 380 : "auto",
        maxWidth: "calc(100vw - 32px)",
        maxHeight: expanded ? "min(420px, 50vh)" : "auto",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: (t) => `1px solid ${t.palette.divider}`,
        bgcolor: "background.paper",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{
          px: 1,
          py: 0.5,
          borderBottom: expanded ? 1 : 0,
          borderColor: "divider",
          bgcolor: "action.hover",
        }}
      >
        <BugReportIcon sx={{ fontSize: 18, color: "warning.main", ml: 0.5 }} />
        <Typography variant="caption" fontWeight={700} sx={{ flex: 1 }}>
          Twilio status log
        </Typography>
        <Tooltip title="Copy JSON">
          <span>
            <IconButton size="small" onClick={copyAll} disabled={entries.length === 0}>
              <CopyIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Clear">
          <span>
            <IconButton size="small" onClick={clear} disabled={entries.length === 0}>
              <ClearIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <IconButton size="small" onClick={toggleExpanded}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Stack>

      <Collapse in={expanded}>
        <Box
          sx={{
            px: 1,
            py: 0.5,
            overflow: "auto",
            maxHeight: 360,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 11,
          }}
        >
          {entries.length === 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", py: 1 }}>
              Waiting for <code>call-status-user-*</code> socket events…
            </Typography>
          ) : (
            entries.map((e) => (
              <Box
                key={e.id}
                sx={{
                  py: 0.75,
                  borderBottom: 1,
                  borderColor: "divider",
                  "&:last-child": { borderBottom: 0 },
                }}
              >
                <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                  <Typography component="span" color="text.secondary">
                    {formatTime(e.at)}
                  </Typography>
                  <Chip
                    size="small"
                    label={e.source}
                    sx={{ height: 18, fontSize: 10 }}
                    color={e.source === "socket" ? "primary" : "secondary"}
                  />
                  <Typography component="span" fontWeight={600}>
                    {String(e.payload.status ?? e.label)}
                  </Typography>
                </Stack>
                <Typography
                  component="pre"
                  sx={{
                    m: 0,
                    mt: 0.25,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    color: "text.secondary",
                  }}
                >
                  {JSON.stringify(e.payload)}
                </Typography>
              </Box>
            ))
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1, pb: 0.5, display: "block" }}>
          Turn off in Settings → Phone Settings → Twilio status log.
        </Typography>
      </Collapse>

      {!expanded && entries.length > 0 && (
        <Typography variant="caption" sx={{ px: 1, py: 0.5 }}>
          {entries.length} event{entries.length === 1 ? "" : "s"}
        </Typography>
      )}
    </Paper>
  );
}
