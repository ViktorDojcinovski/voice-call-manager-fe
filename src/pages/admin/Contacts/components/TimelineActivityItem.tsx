import { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Select,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { format, isValid } from "date-fns";
import {
  Phone,
  Email as EmailIcon,
  Delete as DeleteIcon,
  KeyboardArrowDown,
} from "@mui/icons-material";
import { CallLog } from "voice-javascript-common";
import AudioWaveform from "../../../../components/AudioWaveform";
import { transformToNormalCase } from "../../../../utils/transformCase";
import { CallResult } from "../../../../types/call-results";
import api from "../../../../utils/axiosInstance";

const norm = (s: string) => s.toLowerCase().replace(/[\s_]/g, "").trim();
const findCanonical = (raw: string, options: CallResult[]) =>
  options.find((o) => norm(o.label) === norm(raw));

export type ActivityItemType = "call" | "email";

export interface TimelineCallEntry {
  type: "call";
  data: CallLog;
}

export interface TimelineEmailEntry {
  type: "email";
  data: {
    id: string;
    subject: string;
    from: string;
    to: string;
    date: string;
    snippet: string;
  };
}

export type TimelineEntry = TimelineCallEntry | TimelineEmailEntry;

interface TimelineActivityItemProps {
  entry: TimelineEntry;
  callResults?: CallResult[];
  onResultChange?: (sid: string, result: string) => void;
  elapsedLabel?: string;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TimelineActivityItem({
  entry,
  callResults = [],
  onResultChange,
  elapsedLabel,
}: TimelineActivityItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (entry.type === "email") {
    const d = entry.data;
    const dateObj = new Date(d.date);
    const formattedTime = isValid(dateObj) ? format(dateObj, "MM/dd/yyyy h:mm a") : "";
    return (
      <Box sx={{ display: "flex", gap: 2, position: "relative" }}>
        <Box
          sx={{
            flexShrink: 0,
            alignSelf: "flex-start",
            bgcolor: "grey.800",
            color: "white",
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            fontSize: 12,
          }}
        >
          {formattedTime}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {elapsedLabel && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              {elapsedLabel}
            </Typography>
          )}
          <Box
            sx={{
              p: 2,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" fontWeight={600}>
                {d.subject || "(No subject)"}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              From: {d.from} | To: {d.to}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }} noWrap>
              {d.snippet?.slice(0, 80)}...
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // Call entry
  const cl = entry.data;
  let formattedTime = "";
  if (cl.action?.timestamp) {
    const tsNum = Number(cl.action.timestamp);
    if (!isNaN(tsNum)) {
      const dateObj = new Date(tsNum);
      if (isValid(dateObj)) formattedTime = format(dateObj, "MM/dd/yyyy h:mm a");
    }
  }
  if (!formattedTime && (cl as any).startedAt) {
    const d = new Date((cl as any).startedAt);
    if (isValid(d)) formattedTime = format(d, "MM/dd/yyyy h:mm a");
  }

  const currentRaw = cl.action?.result ?? (cl as any).resultLabel ?? "";
  const canonical = findCanonical(currentRaw, callResults);
  const selectValue = canonical?.label ?? currentRaw;
  const hasMissingOption = !!currentRaw && !canonical;
  const statusLabel = currentRaw ? transformToNormalCase(currentRaw) : "—";

  const handleChange = async (newLabel: string) => {
    try {
      await api.patch(`/call-logs/${cl.sid}`, { result: newLabel });
      onResultChange?.(cl.sid, newLabel);
    } catch (e) {
      console.error("Failed to update disposition", e);
    }
  };

  const durationSec = (cl as any).durationSec ?? 0;

  return (
    <Box sx={{ display: "flex", gap: 2, position: "relative" }}>
      <Box
        sx={{
          flexShrink: 0,
          alignSelf: "flex-start",
          bgcolor: "grey.800",
          color: "white",
          px: 1.5,
          py: 0.5,
          borderRadius: 2,
          fontSize: 12,
        }}
      >
        {formattedTime}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {elapsedLabel && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            {elapsedLabel}
          </Typography>
        )}
        <Box
          sx={{
            p: 2,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Phone fontSize="small" color="action" />
              {durationSec > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {formatDuration(durationSec)}
                </Typography>
              )}
              {cl.action?.notes && (
                <Tooltip title={cl.action.notes} arrow placement="top">
                  <Typography variant="caption" color="primary.main">
                    (has notes)
                  </Typography>
                </Tooltip>
              )}
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              {callResults.length > 0 && currentRaw ? (
                <Select
                  size="small"
                  value={selectValue}
                  onChange={(e) => handleChange(String(e.target.value))}
                  sx={{ minWidth: 140, fontSize: 12 }}
                  IconComponent={KeyboardArrowDown}
                  renderValue={(v) => (
                    <Chip
                      label={transformToNormalCase(String(v))}
                      size="small"
                      sx={{ textTransform: "uppercase", fontSize: 11 }}
                    />
                  )}
                >
                  {hasMissingOption && (
                    <MenuItem value={currentRaw}>
                      {transformToNormalCase(currentRaw)}
                    </MenuItem>
                  )}
                  {callResults.map((cr) => (
                    <MenuItem key={cr.label} value={cr.label}>
                      {transformToNormalCase(cr.label)}
                    </MenuItem>
                  ))}
                </Select>
              ) : (
                statusLabel && (
                  <Chip
                    label={statusLabel}
                    size="small"
                    sx={{ textTransform: "uppercase", fontSize: 11 }}
                  />
                )
              )}
            </Stack>
          </Stack>
          {cl?.recordingUrl && (
            <Box sx={{ mt: 1 }}>
              <Button size="small" onClick={() => setIsOpen((p) => !p)}>
                {isOpen ? "Hide" : "Show"} Voice Recording
              </Button>
              {isOpen && (
                <Box sx={{ mt: 1 }}>
                  <AudioWaveform url={cl.recordingUrl} />
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
