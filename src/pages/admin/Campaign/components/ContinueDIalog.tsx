import { useRef, useState, useCallback, useEffect } from "react";
import Mic from "@mui/icons-material/Mic";
import MicOff from "@mui/icons-material/MicOff";
import {
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  IconButton,
  Tooltip,
  type PaperProps,
} from "@mui/material";
import { TelephonyConnection } from "voice-javascript-common";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

import { CustomTextField } from "../../../../components/UI";
import { CallSession } from "../../../../types/contact";
import { getContactPhoneDisplayString } from "../../../../utils/getContactPrimaryPhone";
import { transformToSnakeCase } from "../../../../utils/transformCase";
import {
  campaignV2,
  campaignV2CardSx,
} from "./campaignV2Tokens";

interface ContinueDialogInterface {
  callResults: { label: string }[];
  contactNotes: { [key: string]: string };
  currentBatch: CallSession[];
  pendingResultContacts: CallSession[];
  showContinueDialog: boolean;
  selectedResults: { [key: string]: string };
  handleDialogClose: () => void;
  setSelectedResults: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
  setPendingResultContacts: React.Dispatch<React.SetStateAction<CallSession[]>>;
  setShowContinueDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCampaignFinished: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCampaignRunning?: React.Dispatch<React.SetStateAction<boolean>>;
  setContactNotes: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
  maybeProceedWithNextBatch: () => void;
  handleStopAndSkip: () => void;
  handleResult: (
    c: CallSession,
    selectedResult: string,
    notesOverride?: string
  ) => Promise<void> | void;
  isCampaign: boolean;
  answeredSessionId: string | null;
  mode: string;
  defaultDisposition: string;
  setIsStartingNextCall: React.Dispatch<React.SetStateAction<boolean>>;
}

const DRAGGABLE_HANDLE_ID = "draggable-dialog-title";

function mergeDictationBaseAndTranscript(
  base: string,
  transcriptPart: string
): string {
  const t = transcriptPart.trim();
  if (!t) return base;
  const b = base.trimEnd();
  if (!b) return transcriptPart;
  return `${b} ${t}`;
}

function DraggablePaper(props: PaperProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(`#${DRAGGABLE_HANDLE_ID}`)) {
      isDragging.current = true;
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      };
    }
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newX = dragStart.current.posX + e.clientX - dragStart.current.x;
      const newY = dragStart.current.posY + e.clientY - dragStart.current.y;
      setPosition({ x: newX, y: newY });
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        posX: newX,
        posY: newY,
      };
    };
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <Paper
      {...props}
      onMouseDown={handleMouseDown}
      style={{
        ...props.style,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    />
  );
}

const ContinueDialog = ({
  callResults,
  contactNotes,
  currentBatch,
  pendingResultContacts,
  selectedResults,
  showContinueDialog,
  answeredSessionId,
  handleDialogClose,
  setSelectedResults,
  setPendingResultContacts,
  setIsCampaignFinished,
  setShowContinueDialog,
  setIsCampaignRunning,
  setContactNotes,
  maybeProceedWithNextBatch,
  handleResult,
  isCampaign,
  mode,
  defaultDisposition,
  setIsStartingNextCall,
}: ContinueDialogInterface) => {
  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
    browserSupportsContinuousListening,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  const [dictationContactId, setDictationContactId] = useState<string | null>(
    null
  );
  const dictationBaseRef = useRef("");
  const contactNotesRef = useRef(contactNotes);
  contactNotesRef.current = contactNotes;
  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;
  const dictationContactIdRef = useRef<string | null>(null);
  dictationContactIdRef.current = dictationContactId;

  const handleMicToggle = useCallback(
    async (contactId: string) => {
      if (!browserSupportsSpeechRecognition) return;

      const active = dictationContactIdRef.current;
      const stoppingCurrentRow = active === contactId;

      if (active !== null) {
        await SpeechRecognition.stopListening();
        const next = {
          ...contactNotesRef.current,
          [active]: mergeDictationBaseAndTranscript(
            dictationBaseRef.current,
            transcriptRef.current
          ),
        };
        contactNotesRef.current = next;
        setContactNotes(next);
        resetTranscript();
        setDictationContactId(null);
      }

      if (stoppingCurrentRow) {
        return;
      }

      dictationBaseRef.current = contactNotesRef.current[contactId] ?? "";
      resetTranscript();
      setDictationContactId(contactId);
      try {
        await SpeechRecognition.startListening({
          continuous: browserSupportsContinuousListening,
        });
      } catch {
        setDictationContactId(null);
      }
    },
    [
      browserSupportsSpeechRecognition,
      browserSupportsContinuousListening,
      resetTranscript,
      setContactNotes,
    ]
  );

  const prevShowContinueDialogRef = useRef(showContinueDialog);
  useEffect(() => {
    const wasOpen = prevShowContinueDialogRef.current;
    prevShowContinueDialogRef.current = showContinueDialog;
    if (!wasOpen || showContinueDialog) {
      return;
    }
    void SpeechRecognition.abortListening();
    const active = dictationContactIdRef.current;
    if (active !== null) {
      setContactNotes((prev) => ({
        ...prev,
        [active]: mergeDictationBaseAndTranscript(
          dictationBaseRef.current,
          transcriptRef.current
        ),
      }));
    }
    setDictationContactId(null);
    resetTranscript();
  }, [showContinueDialog, setContactNotes, resetTranscript]);

  useEffect(() => {
    return () => {
      void SpeechRecognition.abortListening();
    };
  }, []);

  const saveHandler = async (stopAfter = false) => {
    const resolveNotes = (id: string) =>
      dictationContactId === id
        ? mergeDictationBaseAndTranscript(
            dictationBaseRef.current,
            transcript
          )
        : contactNotes[id] || "";

    await Promise.all(
      currentBatch.map((c) => {
        const rawResult =
          selectedResults[c.id] ||
          (c.id !== answeredSessionId ? defaultDisposition : "");
        const result = transformToSnakeCase(rawResult);
        return handleResult(c, result, resolveNotes(c.id));
      })
    );
    // Fire-and-forget: awaiting abortListening() can hang when the mic was never active.
    void SpeechRecognition.abortListening();
    setDictationContactId(null);
    resetTranscript();
    setContactNotes((prev) => {
      const next = { ...prev };
      for (const c of currentBatch) {
        next[c.id] = resolveNotes(c.id);
      }
      return next;
    });
    setPendingResultContacts([]);
    setSelectedResults({});
    setShowContinueDialog(false);

    if (stopAfter) {
      setIsCampaignFinished(true);
      setIsCampaignRunning?.(false);
    }
  };

  return (
    <Dialog
      open={showContinueDialog}
      onClose={(event, reason) => {
        if (reason === "backdropClick") {
          return; // Ignore backdrop clicks
        }
        handleDialogClose();
      }}
      PaperComponent={DraggablePaper}
      aria-labelledby={DRAGGABLE_HANDLE_ID}
      hideBackdrop
      disableScrollLock
      disableEnforceFocus
      slotProps={{
        root: { sx: { pointerEvents: "none" } },
      }}
      PaperProps={{
        sx: {
          pointerEvents: "auto",
          ...campaignV2CardSx,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 2,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        id={DRAGGABLE_HANDLE_ID}
        sx={{
          cursor: "move",
          fontWeight: 700,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "grey.50",
        }}
      >
        Save dispositions
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          borderColor: "divider",
          bgcolor: "#fff",
        }}
      >
        <Stack spacing={2}>
          {currentBatch.map((contact) => {
            const isAnswered = contact.id === answeredSessionId;
            const isPower = mode === TelephonyConnection.SOFT_CALL;

            const defaultDispositionFormatted = callResults.find(
              (cr) => transformToSnakeCase(cr.label) === defaultDisposition
            );
            const valueForSelect =
              selectedResults[contact.id] ??
              (isAnswered ? "" : defaultDispositionFormatted?.label ?? "");

            return (
              <Card
                key={contact.id}
                variant="outlined"
                sx={{ ...campaignV2CardSx, my: 1, p: 0 }}
              >
                <CardContent>
                  <Typography variant="h6">
                    {contact.first_name} {contact.last_name}
                  </Typography>
                  <Typography variant="body2">
                  {getContactPhoneDisplayString(contact) || "—"}
                </Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    Select result
                  </Typography>
                  <Box
                    sx={{
                      mt: 0.5,
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 1,
                    }}
                  >
                    {callResults.map((callResult) => {
                      const isSelected = valueForSelect === callResult.label;
                      return (
                        <Box
                          key={callResult.label}
                          onClick={() =>
                            setSelectedResults((prev) => ({
                              ...prev,
                              [contact.id]: callResult.label,
                            }))
                          }
                          sx={{
                            cursor: "pointer",
                            px: 2,
                            py: 1.25,
                            borderRadius: 1,
                            border: "2px solid",
                            borderColor: isSelected
                              ? campaignV2.accent
                              : "divider",
                            bgcolor: isSelected
                              ? campaignV2.accent
                              : "action.hover",
                            color: isSelected ? "#fff" : "text.primary",
                            fontWeight: isSelected ? 600 : 400,
                            "&:hover": {
                              borderColor: campaignV2.accent,
                              bgcolor: isSelected
                                ? campaignV2.accentDark
                                : campaignV2.rowSelectedFill,
                            },
                          }}
                        >
                          <Typography variant="body2">
                            {callResult.label}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                  {/* "Auto-dropped" only for parallel dial losers; single-contact failed/no-connect is not a drop. */}
                  {!isAnswered && !isPower && currentBatch.length > 1 && (
                    <Chip
                      label="auto-dropped"
                      size="small"
                      sx={{
                        mt: 1,
                        px: 1.25,
                        borderRadius: "16px",
                        bgcolor: "rgba(244, 67, 54, 0.12)",
                        color: "error.main",
                        fontWeight: 600,
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mt: 1,
                      gap: 1,
                    }}
                  >
                    <Typography component="span">Short description</Typography>
                    {browserSupportsSpeechRecognition ? (
                      <Tooltip
                        title={
                          !isMicrophoneAvailable
                            ? "Microphone unavailable"
                            : dictationContactId === contact.id
                              ? "Stop dictation"
                              : "Dictate notes"
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            aria-pressed={dictationContactId === contact.id}
                            disabled={!isMicrophoneAvailable}
                            onClick={() => void handleMicToggle(contact.id)}
                            sx={
                              dictationContactId === contact.id
                                ? { color: campaignV2.accent }
                                : undefined
                            }
                          >
                            {dictationContactId === contact.id ? (
                              <MicOff fontSize="small" />
                            ) : (
                              <Mic fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Speech recognition is not supported in this browser">
                        <span>
                          <IconButton size="small" disabled aria-label="Dictate notes unavailable">
                            <Mic fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                  <CustomTextField
                    value={
                      dictationContactId === contact.id
                        ? mergeDictationBaseAndTranscript(
                            dictationBaseRef.current,
                            transcript
                          )
                        : contactNotes[contact.id] || ""
                    }
                    fullWidth
                    multiline
                    minRows={3}
                    onChange={(e) => {
                      if (dictationContactId === contact.id) {
                        void SpeechRecognition.stopListening();
                        setDictationContactId(null);
                        resetTranscript();
                      }
                      setContactNotes((prev) => ({
                        ...prev,
                        [contact.id]: e.target.value,
                      }));
                    }}
                  />
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: "space-between",
          px: 3,
          py: 2,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "grey.50",
        }}
      >
        <Button
          variant="contained"
          onClick={() => {
            // Set transition state immediately (before any async operations)
            // Only for batch dialer campaigns, not one-off calls
            if (isCampaign) {
              setIsStartingNextCall(true);
            }
            saveHandler(false);
            maybeProceedWithNextBatch();
          }}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            px: 2.5,
            color: "#fff",
            backgroundColor: campaignV2.accent,
            boxShadow: campaignV2.ctaShadow,
            "&:hover": {
              background: campaignV2.accentDark,
              color: "#fff",
            },
          }}
        >
          {isCampaign ? "Save and continue" : "Save"}
        </Button>
        {isCampaign && (
          <Button
            variant="outlined"
            onClick={() => saveHandler(true)}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              px: 2.5,
              borderColor: campaignV2.accent,
              color: campaignV2.accent,
              "&:hover": {
                borderColor: campaignV2.accentDark,
                bgcolor: campaignV2.subtleFill,
              },
            }}
          >
            Save and stop
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ContinueDialog;
