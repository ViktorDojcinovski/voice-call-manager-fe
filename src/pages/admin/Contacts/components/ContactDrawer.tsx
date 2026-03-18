import { useState, useEffect, useCallback } from "react";
import {
  Drawer,
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { List } from "voice-javascript-common";
import { z } from "zod";

import api from "../../../../utils/axiosInstance";
import { isValidDomainFormat, normalizeToDomain } from "../../../../utils/formatWebsiteDomain";

import { schema as validationSchema } from "../../../../schemas/contsct-create/validation-schema";
import { useSnackbar } from "../../../../hooks/useSnackbar";
import { Contact } from "../../../../types/contact";
import { Account } from "../../../../types/account";
import SelectField from "../../../../components/UI/SelectField";
import useAppStore from "../../../../store/useAppStore";

type FormData = z.infer<typeof validationSchema>;

interface ContactDrawerProps {
  open: boolean;
  contact: Contact | null;
  lists: List[];
  onClose: () => void;
  onSaved: () => void;
  defaultPhone?: string;
}

export default function ContactDrawer({
  open,
  contact,
  lists,
  onClose,
  onSaved,
  defaultPhone,
}: ContactDrawerProps) {
  const { enqueue } = useSnackbar();
  const { user } = useAppStore();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      accountId: "",
      email: "",
      phone: "",
      linkedIn: "",
      state: "",
      city: "",
    },
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | undefined>(
    undefined,
  );
  const [listIdError, setListIdError] = useState<string>("");
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newWebsite, setNewWebsite] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [websiteError, setWebsiteError] = useState("");

  // Watch form values to enable/disable submit button
  const data = watch();

  const loadAccounts = useCallback(async () => {
    try {
      const res = await api.get("/accounts/all", {
        params: {
          limit: 10000,
        },
      });
      setAccounts(res.data.accounts);
    } catch (error) {
      enqueue("Failed to load accounts", { variant: "error" });
    }
  }, [open]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const validateWebsite = (value: string) => {
    if (!value.trim()) return "";
    const normalized = normalizeToDomain(value.trim());
    if (!isValidDomainFormat(normalized)) {
      return "Enter domain only (e.g. google.com), not a full URL";
    }
    return "";
  };

  const handleCreateAccount = async () => {
    const error = validateWebsite(newWebsite);
    if (error) {
      setWebsiteError(error);
      return;
    }
    try {
      setSavingAccount(true);
      const payload = {
        companyName: newCompanyName,
        website: normalizeToDomain(newWebsite.trim()),
        tenantId: user?.tenantId,
      };
      const res = await api.post("/accounts/tenant/create", payload);
      await loadAccounts();
      setValue("accountId", res.data.id);
      setCreateAccountOpen(false);
      setNewCompanyName("");
      setNewWebsite("");
      setWebsiteError("");
      enqueue("Account created", { variant: "success" });
    } catch (e: any) {
      const msg =
        e.response?.data?.message || e.message || "Failed to create account";
      enqueue(msg, { variant: "error" });
    } finally {
      setSavingAccount(false);
    }
  };

  const defaults = {
    first_name: "",
    last_name: "",
    accountId: "",
    email: "",
    phone: "",
    linkedIn: "",
    state: "",
    city: "",
  };

  useEffect(() => {
    if (contact) {
      const { account } = contact;
      reset({
        ...defaults,
        ...contact,
        accountId: account?.id ?? "",
      });
    } else {
      reset({
        ...defaults,
        phone: defaultPhone ?? "",
      });
      setSelectedListId(undefined);
      setListIdError("");
    }
  }, [contact, defaultPhone, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (contact) {
        await api.patch(`/contacts/basic/${contact.id}`, {
          ...data,
        });
        enqueue("Updated", { variant: "success" });
      } else {
        const contactData: Record<string, any> = Object.fromEntries(
          Object.entries(data).filter(([, v]) => v !== undefined && v !== ""),
        );
        if (selectedListId && selectedListId.trim() !== "") {
          contactData.listId = selectedListId.trim();
        }

        await api.post("/contacts", contactData);
        enqueue("Created", { variant: "success" });
      }
      onSaved();
    } catch (e: any) {
      const msg =
        e.response?.data?.errors?.[0]?.message ||
        e.response?.data?.message ||
        e.message ||
        "Error!";
      enqueue(msg, { variant: "error" });
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 360, p: 3 }}>
        <Typography variant="h6" mb={2}>
          {contact ? "Edit Contact" : "New Contact"}
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="First Name"
                  error={!!errors.first_name}
                  helperText={errors.first_name?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Last Name"
                  error={!!errors.last_name}
                  helperText={errors.last_name?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="accountId"
              control={control}
              render={({ field }) => (
                <Box>
                  <Autocomplete
                    options={accounts}
                    getOptionLabel={(option) => option.companyName}
                    value={accounts.find((a) => a.id === field.value) ?? null}
                    onChange={(_, newValue) => {
                      field.onChange(newValue?.id ?? "");
                    }}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Account"
                        error={!!errors.accountId}
                        helperText={errors.accountId?.message}
                      />
                    )}
                  />
                  {!field.value && (
                    <Typography
                      variant="caption"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      Account not found?.{" "}
                      <Link
                        component="button"
                        type="button"
                        variant="caption"
                        onClick={() => setCreateAccountOpen(true)}
                      >
                        Create one
                      </Link>
                    </Typography>
                  )}
                </Box>
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Number"
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="linkedIn"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="LinkedIn"
                  error={!!errors.linkedIn}
                  helperText={errors.linkedIn?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="State"
                  error={!!errors.state}
                  helperText={errors.state?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="City"
                  error={!!errors.city}
                  helperText={errors.city?.message}
                  fullWidth
                />
              )}
            />
            {!contact && (
              <Box>
                <SelectField
                  items={lists}
                  label="Select List"
                  value={selectedListId}
                  onChange={(val) => {
                    setSelectedListId(val);
                    setListIdError(""); // Clear error on selection
                  }}
                  getValue={(l) => l.id}
                  getLabel={(l) => l.listName}
                  placeholder=""
                />
                {listIdError && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, ml: 1.75, display: "block" }}
                  >
                    {listIdError}
                  </Typography>
                )}
              </Box>
            )}
            <Box sx={{ textAlign: "right" }}>
              <Button onClick={onClose} sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={
                  isSubmitting ||
                  (!contact &&
                    (!data.first_name?.trim() ||
                      !data.last_name?.trim() ||
                      !data.phone?.trim()))
                }
              >
                {contact ? "Save" : "Create"}
              </Button>
            </Box>
          </Stack>
        </form>
      </Box>

      <Dialog
        open={createAccountOpen}
        onClose={() => setCreateAccountOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Create Account</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Company Name"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Website"
              placeholder="e.g. google.com"
              value={newWebsite}
              onChange={(e) => {
                setNewWebsite(e.target.value);
                setWebsiteError("");
              }}
              error={!!websiteError}
              helperText={websiteError}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateAccountOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateAccount}
            disabled={savingAccount || !newCompanyName.trim()}
          >
            {savingAccount ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}
