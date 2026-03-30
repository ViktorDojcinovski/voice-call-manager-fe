import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  Box,
} from "@mui/material";
import { Star, StarBorder, Warning } from "@mui/icons-material";
import type { ContactPhone, PhoneEntry } from "../../types/contact";

const SLOTS = [
  { key: "mobile" as const, label: "Mobile" },
  { key: "company" as const, label: "Company" },
  { key: "other" as const, label: "Other" },
] as const;

const defaultEntry: PhoneEntry = { number: null, isBad: false, isFavourite: false };

export interface ContactPhoneEditModalProps {
  open: boolean;
  onClose: () => void;
  phone?: ContactPhone | null;
  onSave: (phone: ContactPhone) => Promise<void>;
}

export function ContactPhoneEditModal({
  open,
  onClose,
  phone,
  onSave,
}: ContactPhoneEditModalProps) {
  const [draft, setDraft] = useState<ContactPhone>(() => ({
    mobile: { ...defaultEntry, ...phone?.mobile },
    company: { ...defaultEntry, ...phone?.company },
    other: { ...defaultEntry, ...phone?.other },
  }));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft({
      mobile: { ...defaultEntry, ...phone?.mobile },
      company: { ...defaultEntry, ...phone?.company },
      other: { ...defaultEntry, ...phone?.other },
    });
  }, [open, phone]);

  const setNumber = (slot: (typeof SLOTS)[number]["key"], value: string) => {
    const next = value.trim() ? value : null;
    setDraft((prev) => {
      if (!next) {
        return {
          ...prev,
          [slot]: { ...defaultEntry, number: null },
        };
      }
      return {
        ...prev,
        [slot]: {
          ...defaultEntry,
          ...prev[slot],
          number: next,
        },
      };
    });
  };

  /** Only one favourite at a time; click again on the same slot to clear favourite. */
  const toggleFavourite = (slot: (typeof SLOTS)[number]["key"]) => {
    setDraft((prev) => {
      const was = !!prev[slot]?.isFavourite;
      if (was) {
        return {
          ...prev,
          [slot]: { ...defaultEntry, ...prev[slot], isFavourite: false },
        };
      }
      return {
        mobile: { ...defaultEntry, ...prev.mobile, isFavourite: slot === "mobile" },
        company: { ...defaultEntry, ...prev.company, isFavourite: slot === "company" },
        other: { ...defaultEntry, ...prev.other, isFavourite: slot === "other" },
      };
    });
  };

  const toggleBad = (slot: (typeof SLOTS)[number]["key"]) => {
    setDraft((prev) => ({
      ...prev,
      [slot]: {
        ...defaultEntry,
        ...prev[slot],
        isBad: !prev[slot]?.isBad,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        mobile: { ...defaultEntry, ...draft.mobile },
        company: { ...defaultEntry, ...draft.company },
        other: { ...defaultEntry, ...draft.other },
      });
      onClose();
    } catch (err) {
      console.error("Failed to save phone numbers", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit phone numbers</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set up to three numbers. Mark one as favourite (primary for dialing). Mark numbers that
          are wrong or disconnected as bad.
        </Typography>
        <Stack spacing={2}>
          {SLOTS.map(({ key, label }) => {
            const entry = draft[key] ?? defaultEntry;
            const num = entry.number ?? "";
            const isFav = !!entry.isFavourite;
            const isBad = !!entry.isBad;
            return (
              <Box key={key}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  {label}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <TextField
                    type="tel"
                    size="small"
                    fullWidth
                    value={num}
                    onChange={(e) => setNumber(key, e.target.value)}
                    placeholder={`${label} number`}
                  />
                  <Tooltip title={isFav ? "Remove as favourite" : "Set as favourite (primary)"}>
                    <IconButton
                      size="small"
                      onClick={() => toggleFavourite(key)}
                      color={isFav ? "primary" : "default"}
                      aria-label={`Favourite ${label}`}
                    >
                      {isFav ? <Star fontSize="small" /> : <StarBorder fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={isBad ? "Unmark as bad" : "Mark as bad / wrong number"}>
                    <IconButton
                      size="small"
                      onClick={() => toggleBad(key)}
                      color={isBad ? "error" : "default"}
                      aria-label={`Bad ${label}`}
                    >
                      <Warning fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={isSaving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
