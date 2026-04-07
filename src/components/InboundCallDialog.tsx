import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import PhoneDisabledIcon from "@mui/icons-material/PhoneDisabled";
import CallEndIcon from "@mui/icons-material/CallEnd";
import PersonIcon from "@mui/icons-material/Person";

import api from "../utils/axiosInstance";

interface ContactInfo {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

interface InboundCallDialogProps {
  open: boolean;
  from: string;
  accepted: boolean;
  onAccept: () => void;
  onReject: () => void;
  onHangUp: () => void;
}

export const InboundCallDialog = ({
  open,
  from,
  accepted,
  onAccept,
  onReject,
  onHangUp,
}: InboundCallDialogProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [contact, setContact] = useState<ContactInfo | null>(null);

  useEffect(() => {
    if (!open || !from?.trim()) {
      setContact(null);
      return;
    }
    let cancelled = false;
    const fetchContact = async () => {
      try {
        const { data } = await api.get(`/contacts/lookup-by-phone`, {
          params: { phone: from },
        });
        if (cancelled) return;
        if (data?.id) {
          const id = String(data.id);
          setContact({
            id
          });
          const target = `/contacts/${id}`;
          if (location.pathname !== target) {
            navigate(target);
          }
        } else {
          setContact(null);
        }
      } catch {
        if (!cancelled) setContact(null);
      }
    };
    fetchContact();
    return () => {
      cancelled = true;
    };
  }, [open, from, navigate, location.pathname]);

  const displayName =
    contact?.first_name || contact?.last_name
      ? [contact.first_name, contact.last_name].filter(Boolean).join(" ")
      : null;

  return (
    <Dialog open={open} onClose={onReject}>
      <DialogTitle>Incoming Call</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1} alignItems="center">
          {displayName ? (
            <>
              <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PersonIcon color="primary" />
                {displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {from}
              </Typography>
              {contact?.email && (
                <Typography variant="body2" color="text.secondary">
                  {contact.email}
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="h5">{from || "Unknown number"}</Typography>
          )}
          {!accepted && <Typography variant="subtitle2">Ringing…</Typography>}
          {accepted && <Typography variant="subtitle2">On the line</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", p: 2 }}>
        {!accepted ? (
          <>
            <Button
              startIcon={<PhoneInTalkIcon />}
              variant="contained"
              color="success"
              onClick={onAccept}
            >
              Accept
            </Button>

            <Button
              startIcon={<PhoneDisabledIcon />}
              variant="outlined"
              color="error"
              onClick={onReject}
            >
              Reject
            </Button>
          </>
        ) : (
          <Button
            startIcon={<CallEndIcon />}
            variant="contained"
            color="error"
            onClick={onHangUp}
          >
            Hang up
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
