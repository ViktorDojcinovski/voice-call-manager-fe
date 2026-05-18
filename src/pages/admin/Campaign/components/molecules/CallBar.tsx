import {
  Box,
  Grid,
  Typography,
  IconButton,
  AppBar,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
} from "@mui/material";
import {
  OpenInNew,
  UnfoldMore,
  CallEnd,
  VolumeOff,
  Pause,
  Dialpad,
} from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";

import { Contact } from "../../../../../types/contact";
import {
  SplitDialCallButton,
  type DialChoicePreview,
} from "../../../../../components/atoms/SplitDialCallButton";
import type { DialCallPayload } from "../../../../../utils/getContactPrimaryPhone";

export type CallBarMode = "idle" | "active";

function safeCallBarLabel(label: unknown): string {
  if (label == null || label === "") return "No number";
  if (typeof label === "string" || typeof label === "number") return String(label);
  return "No number";
}

export type CallBarVariant = "page" | "header";

interface CallBarProps {
  /** Tighter spacing when CallBar sits in campaign header next to contact */
  embedded?: boolean;
  /** `header` = sticky admin app bar row; `page` = in-page campaign layout */
  variant?: CallBarVariant;
  onExpand?: () => void;
  onOpenInCampaign?: () => void;
  /** Display mode: idle (ready to call) or active (dialing/in-call) */
  mode: CallBarMode;
  /** Primary label: phone number or "Name – phone" */
  displayLabel: string;
  /** Contact session (for active mode, optional) */
  session?: Contact;
  /** Raw phone (for active mode, when no session) */
  phone?: string;
  /** Primary sends `{ number }`; menu sends `{ number, slot }`. */
  onStartCall?: (payload: DialCallPayload) => void;
  /** End/hang up call - shown when active */
  onEndCall: () => void;
  /** Call start time (active mode) */
  callStartTime?: Date | null;
  /** Elapsed time string (active mode) */
  elapsedTime?: string;
  /** Whether call was answered (active mode) */
  hasAnsweredSession?: boolean;
  /** Numpad digit handler (active mode) */
  handleNumpadClick?: (char: string) => void;
  /** Whether start call is disabled (e.g. socket not ready) */
  isStartCallDisabled?: boolean;
  /** Batch queue: contact before current (top-left of bar) */
  queuePreviousLabel?: string | null;
  /** Batch queue: contact after current (top-right of bar) */
  queueNextLabel?: string | null;
}

export const CallBar = ({
  embedded = false,
  variant = "page",
  onExpand,
  onOpenInCampaign,
  mode,
  displayLabel,
  session,
  phone,
  onStartCall,
  onEndCall,
  callStartTime = null,
  elapsedTime = "00:00",
  hasAnsweredSession = false,
  handleNumpadClick = () => {},
  isStartCallDisabled = false,
  queuePreviousLabel = null,
  queueNextLabel = null,
}: CallBarProps) => {
  const callBubbleGradient =
    "linear-gradient(90deg,#2563eb 0%,#3b82f6 50%,#60a5fa 100%)";
  const [showNumpad, setShowNumpad] = useState(false);
  /** When user picks a number from the split menu, show that line until call ends or session changes. */
  const [dialChoiceLabel, setDialChoiceLabel] = useState<string | null>(null);
  const prevModeRef = useRef<CallBarMode>(mode);

  useEffect(() => {
    setDialChoiceLabel(null);
  }, [session?.id]);

  useEffect(() => {
    if (prevModeRef.current === "active" && mode === "idle") {
      setDialChoiceLabel(null);
    }
    prevModeRef.current = mode;
  }, [mode]);

  const handleDialChoiceChange = (choice: DialChoicePreview | null) => {
    if (!choice) {
      setDialChoiceLabel(null);
      return;
    }
    const name = `${session?.first_name ?? ""} ${session?.last_name ?? ""}`.trim();
    const line = name
      ? `${name} – ${choice.label}: ${choice.number}`
      : `${choice.label}: ${choice.number}`;
    setDialChoiceLabel(line);
  };

  const isActive = mode === "active";
  const barTitle = dialChoiceLabel ?? displayLabel;
  const showQueueNeighbors = Boolean(queuePreviousLabel || queueNextLabel);
  const isHeader = variant === "header";

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          borderRadius: isHeader ? 0 : 2,
          mb: embedded ? 1 : isHeader ? 0 : 3,
          px: { xs: 1.5, sm: 2, md: isHeader ? 2 : 4 },
          py: isHeader ? 1 : { xs: 2, md: 2.5 },
          background: callBubbleGradient,
        }}
      >
        <Box sx={{ fontSize: "1rem", width: "100%", position: "relative" }}>
          {showQueueNeighbors && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 1,
                mb: 1,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {queuePreviousLabel ? (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255,255,255,0.85)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "block",
                    }}
                    title={queuePreviousLabel}
                  >
                    ← {queuePreviousLabel}
                  </Typography>
                ) : null}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                {queueNextLabel ? (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255,255,255,0.85)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "block",
                    }}
                    title={queueNextLabel}
                  >
                    {queueNextLabel} →
                  </Typography>
                ) : null}
              </Box>
            </Box>
          )}
          <Grid container alignItems="center" color="#fff">
            <Grid
              item
              xs={12}
              md={6}
              display="flex"
              alignItems="center"
              gap={0.5}
              sx={{ minWidth: 0 }}
            >
              {onExpand && (
                <IconButton
                  sx={{ color: "#fff" }}
                  onClick={onExpand}
                  aria-label="Expand contact preview"
                  size="small"
                >
                  <UnfoldMore />
                </IconButton>
              )}
              <Typography
                fontWeight={600}
                sx={{
                  ml: onExpand ? 0.5 : 0,
                  fontSize: isHeader ? "14px" : "16px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  minWidth: 0,
                }}
                title={safeCallBarLabel(barTitle)}
              >
                {safeCallBarLabel(barTitle)}
              </Typography>
              {isActive && callStartTime && !isHeader && (
                <Typography
                  variant="body2"
                  sx={{ ml: 1, fontSize: "14px", flexShrink: 0 }}
                >
                  Call started at{" "}
                  {callStartTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              )}
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
              display="flex"
              justifyContent={{ xs: "flex-start", md: "flex-end" }}
              alignItems="center"
              gap={1}
              flexWrap="wrap"
            >
              {onOpenInCampaign && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<OpenInNew sx={{ fontSize: 16 }} />}
                  onClick={onOpenInCampaign}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor: "rgba(255,255,255,0.95)",
                    color: "#2563eb",
                    "&:hover": { bgcolor: "#fff" },
                    flexShrink: 0,
                  }}
                >
                  {isHeader ? "Campaign" : "Open in Campaign"}
                </Button>
              )}
              {isActive ? (
                <>
                  {hasAnsweredSession && (
                    <Box
                      sx={{
                        bgcolor: "rgba(255,255,255,.15)",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 4,
                        fontWeight: 600,
                      }}
                    >
                      {elapsedTime}
                    </Box>
                  )}
                  <IconButton
                    sx={{ color: "#fff" }}
                    onClick={() => setShowNumpad(true)}
                  >
                    <Dialpad />
                  </IconButton>
                  <IconButton sx={{ color: "#fff" }}>
                    <VolumeOff />
                  </IconButton>
                  <IconButton sx={{ color: "#fff" }}>
                    <Pause />
                  </IconButton>
                  <IconButton sx={{ color: "#fff" }} onClick={onEndCall}>
                    <CallEnd color="error" />
                  </IconButton>
                </>
              ) : (
                <>
                  {onStartCall && (
                    <SplitDialCallButton
                      session={session}
                      phone={phone}
                      onDial={onStartCall}
                      onDialChoiceChange={handleDialChoiceChange}
                      disabled={isStartCallDisabled}
                      lightOnGradient
                    />
                  )}
                  {!onStartCall && (
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Ready to call
                    </Typography>
                  )}
                </>
              )}
            </Grid>
          </Grid>
        </Box>
      </AppBar>

      <Dialog open={showNumpad} onClose={() => setShowNumpad(false)}>
        <DialogTitle>Numpad</DialogTitle>
        <DialogContent>
          <Box
            display="grid"
            gridTemplateColumns="repeat(3, 1fr)"
            gap={2}
            p={2}
          >
            {[..."123456789*0#"].map((char) => (
              <Button
                key={char}
                variant="outlined"
                onClick={() => {
                  handleNumpadClick(char);
                }}
              >
                {char}
              </Button>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};
