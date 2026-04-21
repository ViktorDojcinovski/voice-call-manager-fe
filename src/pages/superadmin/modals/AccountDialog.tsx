import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Grid,
  Alert,
} from "@mui/material";
import { useEffect, useState } from "react";
import { AccountFormData } from "../../../types/account";
import { isValidDomainFormat, normalizeToDomain } from "../../../utils/formatWebsiteDomain";

interface AccountDialogProps {
  open: boolean;
  onClose: () => void;
  account: AccountFormData | null;
  users: any[];
  onSave: (accountData: AccountFormData) => Promise<void>;
}

export default function AccountDialog({
  open,
  onClose,
  account,
  users,
  onSave,
}: AccountDialogProps) {
  const [formData, setFormData] = useState<AccountFormData>({
    companyName: "",
    website: "",
    description: "",
    location: "",
    zipCode: "",
    address: "",
    city: "",
    state: "",
    country: "",
    phone: "",
    industry: "",
    userId: "",
  });
  const [userEmail, setUserEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (account) {
      setFormData({
        companyName: account.companyName || "",
        website: account.website || "",
        description: account.description || "",
        location: account.location || "",
        zipCode: account.zipCode || "",
        address: account.address || "",
        city: account.city || "",
        state: account.state || "",
        country: account.country || "",
        phone: account.phone || "",
        industry: account.industry || "",
        userId: account.userId || "",
      });
      const user = users.find((u) => u.id === account.userId);
      setUserEmail(user?.email || "");
    } else {
      setFormData({
        companyName: "",
        website: "",
        description: "",
        location: "",
        zipCode: "",
        address: "",
        city: "",
        state: "",
        country: "",
        phone: "",
        industry: "",
        userId: "",
      });
      setUserEmail("");
    }
    setError(null);
  }, [account, users, open]);

  const handleSave = async () => {
    if (!formData.website || formData.website.trim() === "") {
      setError("Website is required");
      return;
    }

    const normalized = normalizeToDomain(formData.website.trim());
    if (!isValidDomainFormat(normalized)) {
      setError("Please enter a domain only (e.g. google.com), not a full URL");
      return;
    }

    if (!formData.companyName || formData.companyName.trim() === "") {
      setError("Company name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Exclude userId from the data sent to API
      const { userId, ...accountDataWithoutUserId } = formData;
      const accountData: AccountFormData = {
        ...accountDataWithoutUserId,
        website: normalizeToDomain(formData.website.trim()),
        companyName: formData.companyName.trim(),
      };

      await onSave(accountData);
      onClose();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to save account. Please try again.";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{account ? "Edit Account" : "Create Account"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Company Name *"
                fullWidth
                value={formData.companyName}
                onChange={(e) => {
                  setFormData({ ...formData, companyName: e.target.value });
                  setError(null);
                }}
                required
                error={error !== null && !formData.companyName}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Website *"
                placeholder="e.g. google.com"
                fullWidth
                value={formData.website}
                onChange={(e) => {
                  setFormData({ ...formData, website: e.target.value });
                  setError(null);
                }}
                required
                error={error !== null && (!formData.website || error.includes("domain"))}
                helperText={
                  error !== null && !formData.website
                    ? "Website is required"
                    : error !== null && error.includes("domain")
                    ? error
                    : ""
                }
              />
            </Grid>
            {account && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="User"
                  fullWidth
                  value={userEmail}
                  InputProps={{
                    readOnly: true,
                  }}
                  disabled
                />
              </Grid>
            )}
            <Grid item xs={12} sm={account ? 6 : 12}>
              <TextField
                label="Industry"
                fullWidth
                value={formData.industry}
                onChange={(e) => {
                  setFormData({ ...formData, industry: e.target.value });
                  setError(null);
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={2}
                value={formData.description || ""}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  setError(null);
                }}
                sx={{
                  "& .MuiInputBase-inputMultiline": {
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                fullWidth
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  setError(null);
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Location"
                fullWidth
                value={formData.location}
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value });
                  setError(null);
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  setError(null);
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="City"
                fullWidth
                value={formData.city}
                onChange={(e) => {
                  setFormData({ ...formData, city: e.target.value });
                  setError(null);
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="State"
                fullWidth
                value={formData.state}
                onChange={(e) => {
                  setFormData({ ...formData, state: e.target.value });
                  setError(null);
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Zip Code"
                fullWidth
                value={formData.zipCode}
                onChange={(e) => {
                  setFormData({ ...formData, zipCode: e.target.value });
                  setError(null);
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Country"
                fullWidth
                value={formData.country}
                onChange={(e) => {
                  setFormData({ ...formData, country: e.target.value });
                  setError(null);
                }}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !formData.website || !formData.companyName}
        >
          {saving ? "Saving..." : account ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
