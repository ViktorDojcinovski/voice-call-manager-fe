import { useRef, useState, useCallback, useEffect } from "react";
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
  type PaperProps,
} from "@mui/material";
import { TelephonyConnection } from "voice-javascript-common";

import { CustomTextField } from "../../../../components/UI";
import { CallSession } from "../../../../types/contact";
import { getContactPhoneDisplayString } from "../../../../utils/getContactPrimaryPhone";
import { transformToSnakeCase } from "../../../../utils/transformCase";

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
    selectedResult: string
  ) => Promise<void> | void;
  isCampaign: boolean;
  answeredSessionId: string | null;
  mode: string;
  defaultDisposition: string;
  setIsStartingNextCall: React.Dispatch<React.SetStateAction<boolean>>;
}

const DRAGGABLE_HANDLE_ID = "draggable-dialog-title";

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
  const saveHandler = async (stopAfter = false) => {
    await Promise.all(
      currentBatch.map((c) => {
        const rawResult =
          selectedResults[c.id] ||
          (c.id !== answeredSessionId ? defaultDisposition : "");
        const result = transformToSnakeCase(rawResult);
        return handleResult(c, result);
      })
    );
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
        sx: { pointerEvents: "auto" },
      }}
    >
      <DialogTitle
        id={DRAGGABLE_HANDLE_ID}
        sx={{ cursor: "move" }}
      >
        Save Dispositions
      </DialogTitle>
      <DialogContent dividers>
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
              <Card key={contact.id} variant="outlined" sx={{ my: 1 }}>
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
                              ? "primary.main"
                              : "divider",
                            bgcolor: isSelected
                              ? "primary.main"
                              : "action.hover",
                            color: isSelected
                              ? "primary.contrastText"
                              : "text.primary",
                            fontWeight: isSelected ? 600 : 400,
                            "&:hover": {
                              borderColor: "primary.main",
                              bgcolor: isSelected
                                ? "primary.dark"
                                : "action.selected",
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
                  <Typography>Short description</Typography>
                  <CustomTextField
                    value={contactNotes[contact.id] || ""}
                    onChange={(e) =>
                      setContactNotes((prev) => ({
                        ...prev,
                        [contact.id]: e.target.value,
                      }))
                    }
                  />
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
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
        >
          {isCampaign ? "Save and continue" : "Save"}
        </Button>
        {isCampaign && (
          <Button variant="contained" onClick={() => saveHandler(true)}>
            Save and stop
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ContinueDialog;
