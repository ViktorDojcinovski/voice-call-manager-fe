import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Stack,
} from "@mui/material";

type DeleteListDialogProps = {
  open: boolean;
  onClose: () => void;
  /** `true` = delete contacts; `false` = unlink only */
  onConfirm: (deleteContacts: boolean) => void;
  deleting?: boolean;
};

const DeleteListDialog = ({
  open,
  onClose,
  onConfirm,
  deleting = false,
}: DeleteListDialogProps) => {
  const [deleteContacts, setDeleteContacts] = useState(false);

  useEffect(() => {
    if (open) setDeleteContacts(false);
  }, [open]);

  return (
    <Dialog open={open} onClose={deleting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete list?</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Choose what happens to contacts that belong to this list.
          </Typography>
          <FormLabel component="legend">Contacts</FormLabel>
          <RadioGroup
            value={deleteContacts ? "delete" : "unlink"}
            onChange={(_, v) => setDeleteContacts(v === "delete")}
          >
            <FormControlLabel
              value="unlink"
              control={<Radio />}
              label={
                <Typography>
                  Remove list only — contacts stay in your account as{" "}
                  <strong>unassigned</strong>
                </Typography>
              }
            />
            <FormControlLabel
              value="delete"
              control={<Radio color="error" />}
              label={
                <Typography color="error">
                  Delete this list and permanently delete all contacts in it
                </Typography>
              }
            />
          </RadioGroup>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm(deleteContacts)}
          disabled={deleting}
          color={deleteContacts ? "error" : "primary"}
          variant="contained"
          autoFocus
        >
          {deleting ? "Deleting…" : "Delete list"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteListDialog;
