import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Stack,
  CircularProgress,
} from "@mui/material";
import api from "../../../../utils/axiosInstance";
import { useSnackbar } from "../../../../hooks/useSnackbar";
import { Account } from "../../../../types/account";
import { Contact } from "../../../../types/contact";

interface ContactAccountModalProps {
  open: boolean;
  onClose: () => void;
  contact: Contact;
  onSaved: () => void;
}

export default function ContactAccountModal({
  open,
  onClose,
  contact,
  onSaved,
}: ContactAccountModalProps) {
  const { enqueue } = useSnackbar();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingDescription, setLoadingDescription] = useState(false);

  const loadAccounts = useCallback(async () => {
    if (!open) return;
    setLoadingAccounts(true);
    try {
      const res = await api.get("/accounts/all", {
        params: { limit: 10000 },
      });
      setAccounts(res.data.accounts ?? []);
    } catch {
      enqueue("Failed to load accounts", { variant: "error" });
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  }, [open, enqueue]);

  const loadAccountDescription = useCallback(
    async (accountId: string) => {
      setLoadingDescription(true);
      try {
        const res = await api.get(`/accounts/tenant/single/${accountId}`);
        setDescription(res.data?.description ?? "");
      } catch {
        setDescription("");
      } finally {
        setLoadingDescription(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    loadAccounts();
    setDescription(contact.account?.description ?? "");
  }, [open, contact.account?.description, loadAccounts]);

  useEffect(() => {
    if (!open) return;
    if (contact.account?.id) {
      const match = accounts.find((a) => a.id === contact.account!.id);
      setSelectedAccount(match ?? {
        id: contact.account.id,
        createdByUserId: "",
        companyName: contact.account.companyName ?? "",
        website: contact.account.website ?? "",
        description: contact.account.description,
      } as Account);
      if (!match) {
        setDescription(contact.account?.description ?? "");
      }
    } else {
      setSelectedAccount(null);
      setDescription("");
    }
  }, [open, accounts, contact.account?.id, contact.account?.companyName, contact.account?.website, contact.account?.description]);

  useEffect(() => {
    if (!open || !selectedAccount?.id) return;
    if (selectedAccount.id === contact.account?.id) {
      setDescription(contact.account?.description ?? "");
    } else {
      loadAccountDescription(selectedAccount.id);
    }
  }, [open, selectedAccount?.id, contact.account?.id, contact.account?.description, loadAccountDescription]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const accountIdChanged = (selectedAccount?.id ?? "") !== (contact.accountId ?? contact.account?.id ?? "");
      const descriptionChanged = selectedAccount?.id && description !== (selectedAccount.description ?? "");

      if (accountIdChanged) {
        await api.patch(`/contacts/basic/${contact.id}`, {
          accountId: selectedAccount?.id ?? null,
        });
      }

      if (descriptionChanged && selectedAccount?.id) {
        await api.patch(`/accounts/tenant/update/${selectedAccount.id}`, {
          description: description.trim(),
        });
      }

      if (accountIdChanged || descriptionChanged) {
        enqueue("Account updated", { variant: "success" });
        onSaved();
        onClose();
      } else {
        onClose();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? "Failed to update account";
      enqueue(msg, { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleAccountChange = (_: unknown, value: Account | null) => {
    setSelectedAccount(value);
    if (value?.id) {
      loadAccountDescription(value.id);
    } else {
      setDescription("");
    }
  };

  const accountOptions = useMemo(() => {
    if (!contact.account?.id) return accounts;
    const exists = accounts.some((a) => a.id === contact.account!.id);
    if (exists) return accounts;
    const current: Account = {
      id: contact.account.id,
      createdByUserId: "",
      companyName: contact.account.companyName ?? "",
      website: contact.account.website ?? "",
      description: contact.account.description,
    };
    return [current, ...accounts];
  }, [accounts, contact.account?.id, contact.account?.companyName, contact.account?.website, contact.account?.description]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Account</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Autocomplete<Account>
            options={accountOptions}
            getOptionLabel={(opt) => opt.companyName ?? opt.website ?? ""}
            value={selectedAccount}
            onChange={handleAccountChange}
            loading={loadingAccounts}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Account"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingAccounts ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!selectedAccount}
            placeholder={!selectedAccount ? "Select an account first" : undefined}
            InputProps={{
              readOnly: loadingDescription,
            }}
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
