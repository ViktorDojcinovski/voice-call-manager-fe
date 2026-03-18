import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Stack,
} from "@mui/material";
import { getAllTimezones } from "../../../../utils/timezones";

interface ContactTimezoneModalProps {
  open: boolean;
  onClose: () => void;
  value: string;
  onSave: (timezone: string) => Promise<void>;
}

export default function ContactTimezoneModal({
  open,
  onClose,
  value,
  onSave,
}: ContactTimezoneModalProps) {
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(value || null);
  const [saving, setSaving] = useState(false);

  const timezones = getAllTimezones();

  useEffect(() => {
    if (open) {
      setSelectedTimezone(value || null);
    }
  }, [open, value]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedTimezone ?? "");
      onClose();
    } catch (err) {
      console.error("Failed to save timezone:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Timezone</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Autocomplete<string>
            options={timezones}
            getOptionLabel={(opt) => opt}
            value={selectedTimezone}
            onChange={(_, newValue) => setSelectedTimezone(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Timezone"
                size="small"
                placeholder="None"
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
