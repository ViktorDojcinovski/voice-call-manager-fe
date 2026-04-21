import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  Tooltip,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { CheckCircleOutline, MenuBook, Phone } from "@mui/icons-material";
import { format, isValid } from "date-fns";
import { campaignV2 } from "../campaignV2Tokens";
import { CallLog } from "voice-javascript-common";
import AudioWaveform from "../../../../../components/AudioWaveform";
import { transformToNormalCase } from "../../../../../utils/transformCase";
import { CallResult } from "../../../../../types/call-results";

import api from "../../../../../utils/axiosInstance";

// helpers to match old/new labels
const norm = (s: string) => s.toLowerCase().replace(/[\s_]/g, "").trim();
const findCanonical = (raw: string, options: CallResult[]) =>
  options.find((o) => norm(o.label) === norm(raw));

type ActivityRowProps = {
  entry: CallLog;
  callResults: CallResult[];
  onResultChange: (sid: string, result: string) => void;
  /** Called after notes are saved (timeline layout). */
  onNotesChange?: (sid: string, notes: string) => void;
  /** v2 campaign timeline layout with left date badge */
  variant?: "default" | "timeline";
};

const ActivityRow = ({
  entry,
  callResults,
  onResultChange,
  onNotesChange,
  variant = "default",
}: ActivityRowProps) => {
  // ⏱ time
  let formattedTime = "";
  let shortDateBadge = "";
  if (entry.action?.timestamp) {
    const tsNum = Number(entry.action.timestamp);
    if (!isNaN(tsNum)) {
      const dateObj = new Date(tsNum);
      if (isValid(dateObj)) {
        formattedTime = format(dateObj, "PPpp");
        shortDateBadge = format(dateObj, "MM/dd/yyyy h:mm a");
      }
    }
  }

  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    setIsOpen(false);
  }, [entry.sid]);

  const currentRaw = entry.action?.result ?? "";
  const canonical = findCanonical(currentRaw, callResults);
  const selectValue = canonical?.label ?? currentRaw; // fallback so value is always defined
  const hasMissingOption = !!currentRaw && !canonical;

  const handleChange = async (newLabel: string) => {
    try {
      await api.patch(`/call-logs/${entry.sid}`, { result: newLabel });
      onResultChange(entry.sid, newLabel);
    } catch (e) {
      console.error("Failed to update disposition", e);
    }
  };

  const serverNotes = entry.action?.notes ?? "";
  const [notesDraft, setNotesDraft] = useState(serverNotes);
  useEffect(() => {
    setNotesDraft(serverNotes);
  }, [entry.sid, serverNotes]);

  const saveNotesIfChanged = async () => {
    if (notesDraft === serverNotes) return;
    try {
      await api.patch(`/call-logs/${entry.sid}`, { notes: notesDraft });
      onNotesChange?.(entry.sid, notesDraft);
    } catch (e) {
      console.error("Failed to update notes", e);
      setNotesDraft(serverNotes);
    }
  };

  // If the disposition is empty, don't render this row at all (parent also filters)
  if (!currentRaw.trim()) return null;

  const recordingBlockDefault = isOpen && (
    <Box pl={4} pb={2}>
      {entry?.recordingUrl ? (
        <AudioWaveform url={entry.recordingUrl} />
      ) : (
        <Typography fontSize={12} color="text.secondary">
          No call recording available for this call.
        </Typography>
      )}
    </Box>
  );

  if (variant === "timeline") {
    return (
      <Box
        sx={{
          py: 1,
          px: 1,
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "grey.50",
          mb: 1,
        }}
      >
        <Box
          display="flex"
          alignItems="flex-start"
          gap={1.5}
          flexWrap={{ xs: "wrap", sm: "nowrap" }}
        >
          <Box
            sx={{
              flexShrink: 0,
              px: 1.25,
              py: 0.75,
              borderRadius: 1,
              bgcolor: campaignV2.timelineBadgeBg,
              color: campaignV2.timelineBadgeColor,
              minWidth: 118,
              textAlign: "center",
            }}
          >
            <Typography fontSize={11} fontWeight={700} lineHeight={1.3}>
              {shortDateBadge || "—"}
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
            <Phone sx={{ fontSize: 20, color: campaignV2.accent }} />
          </Stack>
          <Box flex={1} minWidth={0}>
            <Stack
              direction="row"
              alignItems="flex-start"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ width: "100%" }}
            >
              <Select
                size="small"
                value={selectValue}
                onChange={(e) => handleChange(String(e.target.value))}
                sx={{
                  minWidth: 180,
                  flexShrink: 0,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: campaignV2.outlineBorder,
                  },
                }}
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
              <TextField
                size="small"
                multiline
                rows={4}
                placeholder="Notes"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                onBlur={() => void saveNotesIfChanged()}
                slotProps={{
                  htmlInput: {
                    style: { resize: "vertical" },
                  },
                }}
                sx={{
                  flex: "1 1 160px",
                  minWidth: 160,
                  "& .MuiOutlinedInput-root": {
                    alignItems: "flex-start",
                    paddingTop: "8px",
                    paddingBottom: "8px",
                    "& fieldset": {
                      borderColor: campaignV2.outlineBorder,
                    },
                  },
                  "& textarea": {
                    fontFamily: "inherit",
                    lineHeight: 1.45,
                  },
                }}
              />
            </Stack>
            {!entry?.recordingUrl && (
              <Typography color="text.secondary" fontSize={11} sx={{ mt: 0.5 }}>
                No recording
              </Typography>
            )}
            {entry?.recordingUrl ? (
              <Button
                size="small"
                onClick={() => setIsOpen((p) => !p)}
                sx={{
                  mt: 0.75,
                  alignSelf: "flex-start",
                  color: campaignV2.link,
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                {isOpen ? "Hide recording" : "Show recording"}
              </Button>
            ) : null}
          </Box>
        </Box>
        {isOpen && entry?.recordingUrl ? (
          <Box
            sx={{
              mt: 1,
              pl: { xs: 0, sm: 1 },
              pr: 0.5,
              maxHeight: 240,
              overflow: "auto",
            }}
          >
            <AudioWaveform url={entry.recordingUrl} />
          </Box>
        ) : null}
      </Box>
    );
  }

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

          {/* Disposition as a Select */}
          <Select
            size="small"
            value={selectValue}
            onChange={(e) => handleChange(String(e.target.value))}
            sx={{ minWidth: 220 }}
          >
            {/* If current value isn't in options, show it once so it renders */}
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

          {entry.action?.notes && (
            <Tooltip title={entry.action.notes} arrow placement="top">
              <MenuBook
                fontSize="small"
                sx={{ cursor: "pointer", color: "primary.main" }}
              />
            </Tooltip>
          )}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography color="text.secondary" fontSize={13}>
            {formattedTime}
          </Typography>
          {!entry?.recordingUrl && (
            <Typography color="text.secondary" fontSize={11}>
              No recording
            </Typography>
          )}
          {entry?.recordingUrl && (
            <Button size="small" onClick={() => setIsOpen((p) => !p)}>
              {isOpen ? "Hide" : "Show"} Voice Recording
            </Button>
          )}
        </Stack>
      </Box>

      {recordingBlockDefault}
    </Box>
  );
};

export default ActivityRow;
