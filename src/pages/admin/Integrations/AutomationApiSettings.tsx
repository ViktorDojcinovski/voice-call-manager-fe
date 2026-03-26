import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import { ArrowBack, VpnKey, ContentCopy, Add, DeleteOutline } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import api from "../../../utils/axiosInstance";
import cfg from "../../../config";
import { useSnackbar } from "../../../hooks/useSnackbar";
import { useAuth } from "../../../contexts/AuthContext";

interface AutomationKeyRow {
  id: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
  keyPrefix: string;
}

interface AutomationKeysResponse {
  items: AutomationKeyRow[];
}

const AutomationApiSettings = () => {
  const { enqueue } = useSnackbar();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<AutomationKeyRow[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createLabel, setCreateLabel] = useState("");
  const [creating, setCreating] = useState(false);

  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);

  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const baseUrl = `${cfg.backendUrl}/api/automation/v1`;

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<AutomationKeysResponse>("/integrations/automation-keys");
      setKeys(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error(err);
      enqueue("Failed to load automation API keys", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [enqueue]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      setKeys([]);
      return;
    }
    fetchKeys();
  }, [isAdmin, fetchKeys]);

  const handleCreate = async () => {
    if (creating) return;
    try {
      setCreating(true);
      const { data } = await api.post<{
        id: string;
        key: string;
        label: string;
        message?: string;
      }>("/integrations/automation-keys", {
        label: createLabel.trim(),
      });
      setCreateOpen(false);
      setCreateLabel("");
      setNewKeySecret(data.key);
      await fetchKeys();
      enqueue("API key created. Copy it now — it will not be shown again.", {
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      enqueue("Failed to create API key", { variant: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeId || revoking) return;
    try {
      setRevoking(true);
      await api.delete(`/integrations/automation-keys/${revokeId}`);
      setRevokeId(null);
      enqueue("API key revoked", { variant: "success" });
      await fetchKeys();
    } catch (err) {
      console.error(err);
      enqueue("Failed to revoke API key", { variant: "error" });
    } finally {
      setRevoking(false);
    }
  };

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      enqueue(message, { variant: "success" });
    } catch {
      enqueue("Could not copy to clipboard", { variant: "error" });
    }
  };

  return (
    <Box p={3}>
      <Box mb={2}>
        <Button
          variant="text"
          size="small"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/integrations")}
          disabled={creating || revoking}
        >
          Back to Integrations
        </Button>
      </Box>

      {isAdmin && loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={320}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper
            sx={{
              p: 3,
              mb: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "common.white",
                  color: "primary.main",
                }}
              >
                <VpnKey />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Automation API
                </Typography>
                <Typography color="text.secondary">
                  Use API keys with Zapier, scripts, or other tools to create contacts and list data.
                </Typography>
              </Box>
            </Stack>
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateOpen(true)}
              >
                Create key
              </Button>
            )}
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Base URL
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Typography
                variant="body2"
                sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
              >
                {baseUrl}
              </Typography>
              <Tooltip title="Copy base URL">
                <IconButton
                  size="small"
                  onClick={() =>
                    copyText(baseUrl, "Base URL copied")
                  }
                  aria-label="Copy base URL"
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Send requests with header{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                Authorization: Bearer &lt;key&gt;
              </Box>{" "}
              or{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                X-Integration-Key
              </Box>
              .
            </Typography>
          </Paper>

          {!isAdmin ? (
            <Paper sx={{ p: 3 }} variant="outlined">
              <Typography variant="body2" color="text.secondary">
                Only administrators can view and manage automation API keys. Ask a workspace admin to create
                keys or grant access.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Label</TableCell>
                    <TableCell>Key</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last used</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {keys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary">
                          No API keys yet. Create one to connect Zapier or other automation.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    keys.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.label || "—"}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                            {row.keyPrefix}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {row.createdAt
                            ? new Date(row.createdAt).toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {row.lastUsedAt
                            ? new Date(row.lastUsedAt).toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteOutline />}
                            onClick={() => setRevokeId(row.id)}
                          >
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      <Dialog open={createOpen} onClose={() => !creating && setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create API key</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Optional label helps you remember what this key is for (e.g. &quot;Zapier — Close&quot;).
          </Typography>
          <TextField
            label="Label"
            fullWidth
            value={createLabel}
            onChange={(e) => setCreateLabel(e.target.value)}
            placeholder="e.g. Zapier production"
            disabled={creating}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating}>
            {creating ? "Creating…" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!newKeySecret}
        onClose={() => setNewKeySecret(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Copy your API key</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            This is the only time the full key is shown. Store it in a password manager or Zapier
            — you cannot retrieve it later.
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              fontFamily: "monospace",
              fontSize: 12,
              wordBreak: "break-all",
              position: "relative",
              pr: 5,
            }}
          >
            {newKeySecret}
            <IconButton
              size="small"
              sx={{ position: "absolute", top: 8, right: 8 }}
              onClick={() =>
                newKeySecret &&
                copyText(newKeySecret, "API key copied")
              }
              aria-label="Copy API key"
            >
              <ContentCopy fontSize="small" />
            </IconButton>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setNewKeySecret(null)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!revokeId} onClose={() => !revoking && setRevokeId(null)}>
        <DialogTitle>Revoke API key?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Automations using this key will stop working immediately. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeId(null)} disabled={revoking}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleRevoke} disabled={revoking}>
            {revoking ? "Revoking…" : "Revoke"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AutomationApiSettings;
