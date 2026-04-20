import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Switch,
  Stack,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Container,
} from "@mui/material";
import { WebhookIcon, ActivityIcon } from "../../../components/integrations/integrationIcons";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../utils/axiosInstance";
import { useSnackbar } from "../../../hooks/useSnackbar";
import { SimpleButton } from "../../../components/UI/SimpleButton";
import { useAuth } from "../../../contexts/AuthContext";
import {
  campaignV2,
  campaignV2CardSx,
  campaignV2SectionTitleSx,
} from "../Campaign/components/campaignV2Tokens";

const primaryButtonSx = {
  mt: 0,
  mr: 0,
  textTransform: "none" as const,
  fontWeight: 700,
  color: "#fff",
  background: campaignV2.gradient,
  boxShadow: "0 2px 8px rgba(91, 33, 182, 0.35)",
  "&:hover": {
    background: campaignV2.accentDark,
    color: "#fff",
  },
};

const outlinedSecondarySx = {
  mt: 0,
  mr: 0,
  textTransform: "none" as const,
  fontWeight: 700,
  borderColor: campaignV2.accent,
  color: campaignV2.accent,
  "&:hover": {
    borderColor: campaignV2.accentDark,
    bgcolor: "rgba(107, 70, 193, 0.06)",
  },
};

const backButtonSx = {
  textTransform: "none" as const,
  fontWeight: 600,
  borderColor: campaignV2.accent,
  color: campaignV2.accent,
  "&:hover": {
    borderColor: campaignV2.accentDark,
    bgcolor: "rgba(107, 70, 193, 0.06)",
  },
};

const textFieldOutlineSx = {
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(107, 70, 193, 0.35)",
  },
};

const ALLOWED_EVENTS = [
  "contact.created",
  "note.created",
  "integration.test",
] as const;

interface IntegrationConfig {
  aiWebhookUrl: string;
  enabled: boolean;
  hasSecret: boolean;
  events?: string[];
}

type WebhookActivityStatus = "success" | "failed";

interface WebhookActivityItem {
  id: string;
  webhookUrl: string;
  event: string;
  status: WebhookActivityStatus;
  statusCode?: number;
  error?: string;
  timestamp: string;
  responseTimeMs?: number;
  payload?: any;
}

interface WebhookActivityResponse {
  total: number;
  success: number;
  failed: number;
  items: WebhookActivityItem[];
}

const WebhookDetailPage = () => {
  const { enqueue } = useSnackbar();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "loading" | "success">("idle");
  const [testState, setTestState] = useState<"idle" | "loading">("idle");

  const [activeTab, setActiveTab] = useState<"webhook" | "activity">("webhook");
  const [activity, setActivity] = useState<WebhookActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityFilter, setActivityFilter] = useState<"all" | "success" | "failed">("all");
  const [selectedEvent, setSelectedEvent] = useState<WebhookActivityItem | null>(null);

  // Form state
  const [webhookUrl, setWebhookUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [events, setEvents] = useState<string[]>([]);

  // Initial values to track dirty state
  const [initialWebhookUrl, setInitialWebhookUrl] = useState("");
  const [initialEnabled, setInitialEnabled] = useState(false);
  const [initialHasSecret, setInitialHasSecret] = useState(false);
  const [initialEvents, setInitialEvents] = useState<string[]>([]);

  // Note: OAuth return handling is now centralized in Email Settings
  // This handler is removed to prevent duplicate toasts

  // Fetch config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<IntegrationConfig>("/integrations/ai");
        setWebhookUrl(data.aiWebhookUrl || "");
        setEnabled(data.enabled || false);
        setSecret(""); // Never display existing secret
        const fetchedEvents = Array.isArray(data.events) ? data.events : [];
        setEvents(fetchedEvents);
        setInitialWebhookUrl(data.aiWebhookUrl || "");
        setInitialEnabled(data.enabled || false);
        setInitialHasSecret(data.hasSecret || false);
        setInitialEvents(fetchedEvents);
      } catch (err: any) {
        console.error("Failed to fetch integration config:", err);
        enqueue("Failed to load integration configuration", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [enqueue]);

  const fetchActivity = async (status: "all" | "success" | "failed") => {
    try {
      setActivityLoading(true);
      const params: any = {};
      if (status === "success" || status === "failed") {
        params.status = status;
      }
      const { data } = await api.get<WebhookActivityResponse>("/integrations/webhooks/activity", {
        params,
      });
      setActivity(Array.isArray(data.items) ? data.items : []);
    } catch (err: any) {
      console.error("Failed to fetch webhook activity:", err);
      enqueue("Failed to load webhook activity", { variant: "error" });
    } finally {
      setActivityLoading(false);
    }
  };

  // Check if form is dirty
  const isDirty =
    webhookUrl !== initialWebhookUrl ||
    enabled !== initialEnabled ||
    secret !== "" || // Any non-empty secret is a change
    JSON.stringify([...events].sort()) !== JSON.stringify([...initialEvents].sort());

  const handleSave = async () => {
    if (saveState === "loading") return;
    if (!isDirty) return;

    try {
      setSaveState("loading");

      const updateData: any = {};

      if (webhookUrl !== initialWebhookUrl) {
        updateData.aiWebhookUrl = webhookUrl;
      }

      if (secret !== "") {
        updateData.aiWebhookSecret = secret;
      }

      if (enabled !== initialEnabled) {
        updateData.enabled = enabled;
      }

      // Send events if changed
      if (JSON.stringify([...events].sort()) !== JSON.stringify([...initialEvents].sort())) {
        updateData.events = events;
      }

      const { data } = await api.put<IntegrationConfig>("/integrations/ai", updateData);

      // Update state from response
      setWebhookUrl(data.aiWebhookUrl || "");
      setEnabled(data.enabled || false);
      setSecret(""); // Clear secret field after save
      const savedEvents = Array.isArray(data.events) ? data.events : [];
      setEvents(savedEvents);
      setInitialWebhookUrl(data.aiWebhookUrl || "");
      setInitialEnabled(data.enabled || false);
      setInitialHasSecret(data.hasSecret || false);
      setInitialEvents(savedEvents);

      setSaveState("success");
      enqueue("Integration configuration saved", { variant: "success" });
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err: any) {
      console.error("Failed to save integration config:", err);
      enqueue("Failed to save integration configuration", { variant: "error" });
      setSaveState("idle");
    }
  };

  const handleTest = async () => {
    if (testState === "loading") return;
    if (!webhookUrl || !enabled) {
      enqueue("Webhook URL must be set and integration must be enabled", { variant: "warning" });
      return;
    }

    try {
      setTestState("loading");
      const { data } = await api.post<{ ok?: boolean; success?: boolean; message?: string }>("/integrations/ai/test");

      if (data.ok || data.success) {
        enqueue("Test webhook sent successfully", { variant: "success" });
        // Refresh activity after a test event
        fetchActivity(activityFilter);
      } else {
        enqueue(data.message || "Integration not enabled", { variant: "warning" });
      }
    } catch (err: any) {
      console.error("Failed to send test webhook:", err);
      enqueue("Failed to send test webhook", { variant: "error" });
    } finally {
      setTestState("idle");
    }
  };

  // Fetch activity when Activity tab is opened or filter changes
  useEffect(() => {
    if (activeTab === "activity") {
      fetchActivity(activityFilter);
    }
  }, [activeTab, activityFilter]);

  const totalEvents = activity.length;
  const successCount = activity.filter((a) => a.status === "success").length;
  const failedCount = activity.filter((a) => a.status === "failed").length;
  const successRate = totalEvents > 0 ? Math.round((successCount / totalEvents) * 1000) / 10 : 0;

  const activityByDay = useMemo(() => {
    const map = new Map<
      string,
      { date: Date; total: number; success: number; failed: number }
    >();
    activity.forEach((item) => {
      const d = new Date(item.timestamp);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const existing = map.get(key) ?? { date: d, total: 0, success: 0, failed: 0 };
      existing.total += 1;
      if (item.status === "success") existing.success += 1;
      else existing.failed += 1;
      map.set(key, existing);
    });
    const days = Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    return days;
  }, [activity]);

  return (
    <Container
      maxWidth={false}
      sx={{
        py: 3,
        px: { xs: 2, sm: 3 },
        bgcolor: campaignV2.pageBg,
        minHeight: "100%",
      }}
    >
      {/* Back button */}
      <Box mb={2}>
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/integrations")}
          disabled={loading || saveState === "loading" || testState === "loading"}
          sx={backButtonSx}
        >
          Back to Integrations
        </Button>
      </Box>

      {/* Loading state */}
      {loading ? (
        <Paper
          variant="outlined"
          sx={{
            ...campaignV2CardSx,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <CircularProgress sx={{ color: campaignV2.accent }} />
        </Paper>
      ) : (
        <>
          {/* Header card */}
      <Paper
        variant="outlined"
        sx={{
          ...campaignV2CardSx,
          p: 3,
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
              color: campaignV2.accent,
              border: "1px solid rgba(107, 70, 193, 0.2)",
            }}
          >
            <WebhookIcon />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Webhook
            </Typography>
            <Typography color="text.secondary">
              Send Kalliq events to external services.
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {enabled ? "Enabled" : "Disabled"}
          </Typography>
          <Switch
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            disabled={!isAdmin || saveState === "loading"}
          />
        </Stack>
      </Paper>

      {/* Tabs + content card */}
      <Paper variant="outlined" sx={{ ...campaignV2CardSx, p: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            mb: 3,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
            "& .Mui-selected": { color: `${campaignV2.accent} !important` },
            "& .MuiTabs-indicator": { bgcolor: campaignV2.tabIndicator },
          }}
        >
          <Tab label="Webhooks" value="webhook" />
          <Tab label="Activity" value="activity" />
        </Tabs>

        {activeTab === "webhook" ? (
          <Stack spacing={3}>
            <TextField
              label="Webhook URL"
              fullWidth
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              disabled={!isAdmin || saveState === "loading"}
              sx={textFieldOutlineSx}
            />
            <TextField
              label="Secret"
              type="password"
              fullWidth
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={initialHasSecret ? "Enter new secret to update" : "Enter secret key"}
              disabled={!isAdmin || saveState === "loading"}
              helperText={initialHasSecret ? "Leave blank to keep existing secret" : ""}
              sx={textFieldOutlineSx}
            />
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Events
              </Typography>
              <Stack spacing={1}>
                {ALLOWED_EVENTS.map((eventType) => (
                  <FormControlLabel
                    key={eventType}
                    control={
                      <Checkbox
                        checked={events.includes(eventType)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEvents([...events, eventType]);
                          } else {
                            setEvents(events.filter((ev) => ev !== eventType));
                          }
                        }}
                        disabled={!isAdmin || saveState === "loading"}
                      />
                    }
                    label={eventType}
                  />
                ))}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Select which events to send to the webhook endpoint.
              </Typography>
            </Box>
            {!isAdmin && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: -2 }}>
                Only admins can modify integration settings.
              </Typography>
            )}
            {isAdmin && (
              <Box>
                <SimpleButton
                  label="Save"
                  onClick={handleSave}
                  loading={saveState === "loading"}
                  success={saveState === "success"}
                  disabled={!isDirty || saveState === "loading"}
                  color="inherit"
                  sx={primaryButtonSx}
                />
              </Box>
            )}
            {isAdmin && (
              <Box>
                <SimpleButton
                  label="Send test"
                  onClick={handleTest}
                  loading={testState === "loading"}
                  disabled={!webhookUrl || !enabled || testState === "loading" || saveState === "loading"}
                  color="inherit"
                  variant="outlined"
                  sx={outlinedSecondarySx}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
                  Sends an integration.test event to verify delivery.
                </Typography>
              </Box>
            )}
          </Stack>
        ) : (
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <ActivityIcon fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                Activity
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2} mb={2}>
              <Paper sx={{ p: 2, flex: 1 }} elevation={0} variant="outlined">
                <Typography variant="caption" color="text.secondary">
                  Total events
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {totalEvents}
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1 }} elevation={0} variant="outlined">
                <Typography variant="caption" color="text.secondary">
                  Success rate
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {successRate.toFixed(1)}%
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1 }} elevation={0} variant="outlined">
                <Typography variant="caption" color="text.secondary">
                  Successful
                </Typography>
                <Typography variant="h6" fontWeight={600} color="success.main">
                  {successCount}
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1 }} elevation={0} variant="outlined">
                <Typography variant="caption" color="text.secondary">
                  Failed
                </Typography>
                <Typography variant="h6" fontWeight={600} color="error.main">
                  {failedCount}
                </Typography>
              </Paper>
            </Stack>

            {/* Simple activity over time chart */}
            <Paper sx={{ p: 2, mb: 2 }} elevation={0} variant="outlined">
              <Typography variant="subtitle2" fontWeight={600} mb={1}>
                Webhook Activity Over Time
              </Typography>
              {activityByDay.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No activity yet.
                </Typography>
              ) : (
                <Box sx={{ height: 180, display: "flex", alignItems: "flex-end", gap: 1 }}>
                  {activityByDay.map((day) => {
                    const maxTotal = Math.max(...activityByDay.map((d) => d.total));
                    const height =
                      maxTotal > 0 ? 40 + (140 * day.total) / maxTotal : 40;
                    return (
                      <Box
                        key={day.date.toISOString()}
                        sx={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: 18,
                            height,
                            borderRadius: 1,
                            background: (theme) =>
                              `linear-gradient(to top, ${theme.palette.success.main}, ${theme.palette.primary.main})`,
                          }}
                        />
                        <Typography variant="caption" sx={{ mt: 0.5 }}>
                          {day.date.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Paper>

            {/* Filters + Refresh */}
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <Button
                size="small"
                variant={activityFilter === "all" ? "contained" : "outlined"}
                onClick={() => setActivityFilter("all")}
              >
                All
              </Button>
              <Button
                size="small"
                variant={activityFilter === "success" ? "contained" : "outlined"}
                onClick={() => setActivityFilter("success")}
              >
                Successful
              </Button>
              <Button
                size="small"
                variant={activityFilter === "failed" ? "contained" : "outlined"}
                onClick={() => setActivityFilter("failed")}
              >
                Failed
              </Button>
              <Button
                size="small"
                onClick={() => fetchActivity(activityFilter)}
                disabled={activityLoading}
              >
                Refresh
              </Button>
            </Stack>

            {/* Recent events list */}
            {activityLoading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={24} sx={{ color: campaignV2.accent }} />
              </Box>
            ) : activity.length === 0 ? (
              <Paper
                elevation={0}
                sx={{ p: 3, textAlign: "center", color: "text.secondary" }}
              >
                <Typography variant="body2">No events yet.</Typography>
                <Typography variant="caption">
                  Once webhooks start firing, you&apos;ll see a history of events here.
                </Typography>
              </Paper>
            ) : (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>
                  Recent Webhook Events
                </Typography>
                <Stack spacing={1}>
                  {activity.map((item) => (
                    <Paper
                      key={item.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 2, pr: 2 }}>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: 320 }}
                          title={item.webhookUrl}
                        >
                          {item.webhookUrl}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(item.timestamp).toLocaleString()}
                        </Typography>
                      </Box>

                      <Box sx={{ flex: 1, display: "flex", gap: 1, justifyContent: "center" }}>
                        <Chip
                          label={item.status === "success" ? "Success" : "Failed"}
                          size="small"
                          color={item.status === "success" ? "success" : "error"}
                        />
                        {item.statusCode !== undefined && (
                          <Chip
                            label={`Status:${item.statusCode}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>

                      <Box sx={{ flex: 0.5, textAlign: "right", pr: 2 }}>
                        <Typography variant="body2">
                          {item.responseTimeMs != null ? `${item.responseTimeMs} ms` : "-"}
                        </Typography>
                      </Box>

                      <Box>
                        <IconButton size="small" onClick={() => setSelectedEvent(item)}>
                          <Typography variant="body2">View</Typography>
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Event details dialog */}
      <Dialog
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Webhook Event Details</DialogTitle>
        {selectedEvent && (
          <DialogContent dividers>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={selectedEvent.status === "success" ? "Success" : "Failed"}
                  color={selectedEvent.status === "success" ? "success" : "error"}
                  size="small"
                />
                {selectedEvent.statusCode !== undefined && (
                  <Chip
                    label={`Status:${selectedEvent.statusCode}`}
                    size="small"
                    variant="outlined"
                  />
                )}
                {selectedEvent.responseTimeMs != null && (
                  <Chip
                    label={`${selectedEvent.responseTimeMs} ms`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Webhook URL
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  {selectedEvent.webhookUrl}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Timestamp
                </Typography>
                <Typography variant="body2">
                  {new Date(selectedEvent.timestamp).toLocaleString()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Payload
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    maxHeight: 320,
                    overflow: "auto",
                    p: 2,
                    fontFamily: "monospace",
                    fontSize: 12,
                    whiteSpace: "pre",
                  }}
                >
                  {JSON.stringify(selectedEvent.payload ?? {}, null, 2)}
                </Paper>
              </Box>
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setSelectedEvent(null)}>Close</Button>
        </DialogActions>
      </Dialog>
        </>
      )}
    </Container>
  );
};

export default WebhookDetailPage;
