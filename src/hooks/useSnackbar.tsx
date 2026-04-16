// src/hooks/useSnackbar.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  Snackbar,
  Alert,
  AlertColor,
  SnackbarCloseReason,
} from "@mui/material";

interface SnackbarOptions {
  /** MUI Alert severities: "error" | "warning" | "info" | "success" */
  variant?: AlertColor;
  /** how long before auto‐hide (ms) */
  duration?: number;
}

interface SnackbarContextType {
  enqueue: (message: string, options?: SnackbarOptions) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined
);

export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<AlertColor>("info");
  const [autoHideDuration, setAutoHideDuration] = useState(3000);

  const enqueue = useCallback((msg: string, options: SnackbarOptions = {}) => {
    setMessage(msg);
    setSeverity(options.variant ?? "info");
    setAutoHideDuration(options.duration ?? 3000);
    setOpen(true);
  }, []);

  const snackbarContextValue = useMemo(() => ({ enqueue }), [enqueue]);

  const handleClose = (
    event: React.SyntheticEvent<any, Event> | Event,
    reason: SnackbarCloseReason
  ) => {
    // by convention we ignore “clickaway”
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <SnackbarContext.Provider value={snackbarContextValue}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={severity} variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

/** Hook to get `enqueue` function */
export function useSnackbar(): SnackbarContextType {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a <SnackbarProvider>");
  }
  return context;
}
