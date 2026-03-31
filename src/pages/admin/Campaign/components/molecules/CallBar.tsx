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
  ArrowBack,
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

interface CallBarProps {
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
}

export const CallBar = ({
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
}: CallBarProps) => {
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

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          borderRadius: 2,
          mb: 3,
          px: 5,
          py: 3,
          background:
            "linear-gradient(90deg,#0a4ddb 0%,#0f59ff 50%,#166bff 100%)",
        }}
      >
        <Box sx={{ fontSize: "1rem", width: "100%" }}>
          <Grid container alignItems="center" color="#fff">
            <Grid
              item
              xs={12}
              md={6}
              display="flex"
              alignItems="center"
              gap={1}
            >
              <IconButton sx={{ color: "#fff" }}>
                <ArrowBack />
              </IconButton>
              <Typography fontWeight={600} sx={{ ml: 2, fontSize: "16px" }}>
                {safeCallBarLabel(barTitle)}
              </Typography>
              {isActive && callStartTime && (
                <Typography variant="body2" sx={{ ml: 2, fontSize: "14px" }}>
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
              gap={1.5}
              flexWrap="wrap"
            >
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
