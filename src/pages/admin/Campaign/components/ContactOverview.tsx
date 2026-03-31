import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Tabs,
  Tab,
  TextField,
  CircularProgress,
  IconButton,
  Link,
} from "@mui/material";
import {
  Business,
  Person,
  Phone,
  Email as EmailIcon,
  LinkedIn,
  LocationOn,
  AccessTime,
  Title,
  InsertDriveFile,
  Edit,
} from "@mui/icons-material";
import { CallLog } from "voice-javascript-common";

import useAppStore from "../../../../store/useAppStore";
import { CallResult } from "../../../../types/call-results";
import api from "../../../../utils/axiosInstance";
import { useSnackbar } from "../../../../hooks/useSnackbar";

import ActivityRow from "./molecules/ActivityRow";
import ContactAccountModal from "./ContactAccountModal";
import ContactTimezoneModal from "./ContactTimezoneModal";

import { Contact, ContactPhone } from "../../../../types/contact";
import { EditableFieldItem } from "../../../../components/atoms/EditableFieldItem";
import { PhoneFieldWithDropdown } from "../../../../components/atoms/PhoneFieldWithDropdown";
import { formatContactLocalTime } from "../../../../utils/formatContactLocalTime";
import { formatWebsiteToDomain } from "../../../../utils/formatWebsiteDomain";

interface ContactOverviewProps {
  contact: Contact;
  onUpdate?: (field: string, value: string | ContactPhone) => Promise<void>;
  onAccountUpdated?: () => void | Promise<void>;
}

interface GmailStatus {
  connected: boolean;
  emailAddress?: string;
}

interface EmailReply {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
}

const SNIPPET_PREVIEW_LENGTH = 120;

function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

const ContactOverview = ({ contact, onUpdate, onAccountUpdated }: ContactOverviewProps) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [now, setNow] = useState(new Date());
  const [openAccountModal, setOpenAccountModal] = useState(false);
  const [openTimezoneModal, setOpenTimezoneModal] = useState(false);
  const [accountDescriptionExpanded, setAccountDescriptionExpanded] =
    useState(false);

  // Email state
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [emailReplies, setEmailReplies] = useState<EmailReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [expandedReplyIds, setExpandedReplyIds] = useState<Set<string>>(new Set());

  const { settings } = useAppStore((s) => s);
  const callResults: CallResult[] =
    (settings?.["Phone Settings"]?.callResults as CallResult[]) ?? [];

  const userTimeZone = settings?.["General Settings"]?.timezone as
    | string
    | undefined;
  const { enqueue } = useSnackbar();

  useEffect(() => {
    setAccountDescriptionExpanded(false);
  }, [contact.id, contact.account?.description]);

  useEffect(() => {
    const fetchCallLogs = async () => {
      const callLogs = await api.get("/call-logs", {
        params: { contactId: contact.id },
      });

      setCallLogs(callLogs.data.recordings);
    };

    fetchCallLogs();
  }, []);

  // Fetch Gmail connection status (minimal check only)
  useEffect(() => {
    if (tabIndex === 2) {
      fetchGmailStatus();
    }
  }, [tabIndex, contact.id]);

  // Fetch replies after status is loaded (only if connected)
  useEffect(() => {
    if (tabIndex === 2 && gmailStatus?.connected && contact.id) {
      fetchEmailReplies();
    } else if (tabIndex === 2 && !gmailStatus?.connected) {
      setEmailReplies([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabIndex, gmailStatus?.connected, contact.id]);

  const fetchGmailStatus = async () => {
    try {
      const response = await api.get<GmailStatus>("/email/gmail/status");
      setGmailStatus(response.data);
    } catch (error: any) {
      // Silently set disconnected status - no error toast needed
      setGmailStatus({ connected: false });
    }
  };

  const fetchEmailReplies = async () => {
    if (!contact.id) return;
    setLoadingReplies(true);
    try {
      const response = await api.get<EmailReply[]>("/email/gmail/replies", {
        params: { contactId: contact.id },
      });
      setEmailReplies(response.data);
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Gmail not connected - silently handle
        setEmailReplies([]);
      } else {
        console.error("Failed to fetch email replies:", error);
        enqueue("Failed to load email replies", { variant: "error" });
      }
    } finally {
      setLoadingReplies(false);
    }
  };

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const localTimeDisplay = formatContactLocalTime(
    contact.timezone,
    userTimeZone,
    now,
  );

  const visibleCallLogs = useMemo(
    () => callLogs.filter((l) => !!l.action?.result?.trim()),
    [callLogs],
  );

  const handleResultChange = (sid: string, result: string) => {
    setCallLogs((prev) =>
      prev.map((cl) =>
        cl.sid === sid
          ? {
              ...cl,
              action: {
                ...(cl.action ?? { result: "", notes: "", timestamp: "" }),
                result,
              },
            }
          : cl,
      ),
    );
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        p: 2,
        mt: 2,
        backgroundColor: "#fff",
        boxShadow: 0,
      }}
    >
      {/* Tabs Header */}
      <Tabs
        value={tabIndex}
        onChange={(_, val) => setTabIndex(val)}
        sx={{ mb: 3 }}
      >
        <Tab
          label="Prospect Fields"
          sx={{
            fontWeight: 600,
            color: tabIndex === 0 ? "#0f59ff" : "text.secondary",
          }}
        />
        <Tab
          label="Activity History"
          sx={{
            fontWeight: 600,
            color: tabIndex === 1 ? "#0f59ff" : "text.secondary",
          }}
        />
        <Tab
          label="Email"
          sx={{
            fontWeight: 600,
            color: tabIndex === 2 ? "#0f59ff" : "text.secondary",
          }}
        />
      </Tabs>

      {/* Tab Content */}
      {tabIndex === 0 && (
        <Grid container spacing={3}>
          {/* Left */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box
                display="flex"
                alignItems="flex-start"
                sx={{ py: 1 }}
              >
                <Business color="primary" sx={{ mr: 1, mt: 0.5, fontSize: 20 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography fontSize={13} fontWeight={500} color="text.secondary">
                      Account
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setOpenAccountModal(true)}
                      sx={{ minWidth: "auto", p: 0.25 }}
                      title="Edit account"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography fontSize={13} sx={{ mt: 0.5 }}>
                    {contact.account?.companyName || "—"}
                  </Typography>
                  {contact.account?.website ? (
                    <Link
                      href={contact.account.website.startsWith("http") ? contact.account.website : `https://${contact.account.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      fontSize={13}
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      {formatWebsiteToDomain(contact.account.website)}
                    </Link>
                  ) : (
                    <Typography fontSize={13} color="text.secondary">—</Typography>
                  )}
                  {contact.account?.description ? (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography
                        fontSize={13}
                        color="text.secondary"
                        sx={{
                          wordBreak: "break-word",
                          whiteSpace: accountDescriptionExpanded
                            ? "pre-wrap"
                            : undefined,
                          ...(accountDescriptionExpanded
                            ? {}
                            : {
                                display: "-webkit-box",
                                WebkitLineClamp: 4,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                cursor: "pointer",
                              }),
                        }}
                        onClick={
                          accountDescriptionExpanded
                            ? undefined
                            : () => setAccountDescriptionExpanded(true)
                        }
                        title={
                          accountDescriptionExpanded
                            ? undefined
                            : "Click to expand"
                        }
                      >
                        {contact.account.description}
                      </Typography>
                      {accountDescriptionExpanded && (
                        <Typography
                          variant="caption"
                          component="button"
                          type="button"
                          onClick={() => setAccountDescriptionExpanded(false)}
                          color="primary"
                          sx={{
                            mt: 0.5,
                            display: "block",
                            fontWeight: 500,
                            cursor: "pointer",
                            border: "none",
                            background: "none",
                            p: 0,
                            font: "inherit",
                          }}
                        >
                          Show less
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography fontSize={13} sx={{ mt: 0.5 }} color="text.secondary">
                      —
                    </Typography>
                  )}
                </Box>
              </Box>
              <EditableFieldItem
                icon={<Title color="primary" />}
                label="Title"
                value={contact.title || contact.capacity || ""}
                onSave={
                  onUpdate ? (value) => onUpdate("title", value) : undefined
                }
              />
              <EditableFieldItem
                icon={<EmailIcon color="primary" />}
                label="Email"
                value={contact.email || ""}
                onSave={
                  onUpdate ? (value) => onUpdate("email", value) : undefined
                }
              />
              <PhoneFieldWithDropdown
                icon={<Phone color="primary" />}
                label="Direct Phone"
                phone={contact.phone}
                onUpdate={
                  onUpdate ? (phone) => onUpdate("phone", phone) : undefined
                }
              />
              <EditableFieldItem
                icon={<LocationOn color="primary" />}
                label="City"
                value={contact.city || ""}
                onSave={
                  onUpdate ? (value) => onUpdate("city", value) : undefined
                }
              />
              {/* <EditableFieldItem
                icon={<InsertDriveFile color="primary" />}
                label="Record Type"
                value={contact.recordType || ""}
                onSave={
                  onUpdate
                    ? (value) => onUpdate("recordType", value)
                    : undefined
                }
              /> */}
            </Stack>
          </Grid>

          {/* Right */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <EditableFieldItem
                icon={<Person color="primary" />}
                label="Contact Name"
                value={`${contact.first_name} ${contact.last_name}`}
                onSave={
                  onUpdate
                    ? async (value) => {
                        const parts = value.trim().split(/\s+/);
                        const firstName = parts[0] || "";
                        const lastName = parts.slice(1).join(" ") || "";
                        await onUpdate("first_name", firstName);
                        if (lastName || !contact.last_name) {
                          await onUpdate("last_name", lastName);
                        }
                      }
                    : undefined
                }
              />
              <PhoneFieldWithDropdown
                icon={<Phone color="primary" />}
                label="Phone"
                phone={contact.phone}
                onUpdate={
                  onUpdate ? (phone) => onUpdate("phone", phone) : undefined
                }
              />
              <EditableFieldItem
                icon={<LinkedIn color="primary" />}
                label="LinkedIn URL"
                value={contact.linkedIn || ""}
                truncateTextAfter={250}
                type="url"
                onSave={
                  onUpdate ? (value) => onUpdate("linkedIn", value) : undefined
                }
              />
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ py: 1 }}
              >
                <AccessTime color="primary" sx={{ fontSize: 20 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography
                      fontSize={13}
                      fontWeight={500}
                      color="text.secondary"
                    >
                      Timezone
                    </Typography>
                    {onUpdate && (
                      <IconButton
                        size="small"
                        onClick={() => setOpenTimezoneModal(true)}
                        sx={{ minWidth: "auto", p: 0.25 }}
                        title="Edit timezone"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  <Typography fontSize={13} sx={{ mt: 0.5 }}>
                    {contact.timezone || "—"}
                  </Typography>
                </Box>
              </Stack>
              <EditableFieldItem
                icon={<LocationOn color="primary" />}
                label="State"
                value={contact.state || ""}
                onSave={
                  onUpdate ? (value) => onUpdate("state", value) : undefined
                }
              />
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ py: 1 }}
              >
                <AccessTime color="primary" sx={{ fontSize: 20 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography
                    fontSize={13}
                    fontWeight={500}
                    color="text.secondary"
                  >
                    Local Time
                  </Typography>
                  <Typography fontSize={13} sx={{ mt: 0.5 }}>
                    {localTimeDisplay || "—"}
                  </Typography>
                </Box>
              </Stack>
              {contact.subject && (
                <EditableFieldItem
                  icon={<InsertDriveFile color="primary" />}
                  label={contact.subject}
                  value=""
                />
              )}
            </Stack>
          </Grid>
        </Grid>
      )}
      {tabIndex === 1 && (
        <Box px={2}>
          {visibleCallLogs.length > 0 ? (
            <Stack spacing={2}>
              {visibleCallLogs.map((callLog) => (
                <ActivityRow
                  key={callLog.sid}
                  entry={callLog}
                  callResults={callResults}
                  onResultChange={handleResultChange}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No activity history available yet.
            </Typography>
          )}
        </Box>
      )}
      {tabIndex === 2 && (
        // Email Tab
        <Box px={2} py={2}>
          {/* Email Replies */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Email Replies
            </Typography>
            {loadingReplies ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : !gmailStatus?.connected ? (
              <Typography variant="body2" color="text.secondary">
                Connect Gmail in Settings → Email Settings.
              </Typography>
            ) : emailReplies.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No email replies yet
              </Typography>
            ) : (
              <Stack spacing={2}>
                {emailReplies.map((reply) => (
                  <Box
                    key={reply.id}
                    sx={{
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        {reply.subject || "(No subject)"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(reply.date).toLocaleString()}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 1, display: "block" }}
                    >
                      From: {reply.from} | To: {reply.to}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          display: "block",
                        }}
                      >
                        {(() => {
                          const raw = reply.snippet || "(No preview available)";
                          const text = decodeHtmlEntities(raw);
                          const isLong = text.length > SNIPPET_PREVIEW_LENGTH;
                          const isExpanded = expandedReplyIds.has(reply.id);
                          if (isLong && !isExpanded) {
                            return `${text.slice(0, SNIPPET_PREVIEW_LENGTH).trim()}...`;
                          }
                          return text;
                        })()}
                      </Typography>
                      {(reply.snippet?.length ?? 0) > SNIPPET_PREVIEW_LENGTH && (
                        <Typography
                          variant="caption"
                          component="button"
                          type="button"
                          onClick={() =>
                            setExpandedReplyIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(reply.id)) {
                                next.delete(reply.id);
                              } else {
                                next.add(reply.id);
                              }
                              return next;
                            })
                          }
                          color="primary"
                          sx={{
                            mt: 0.5,
                            display: "inline-block",
                            fontWeight: 500,
                            cursor: "pointer",
                            border: "none",
                            background: "none",
                            p: 0,
                            font: "inherit",
                          }}
                        >
                          {expandedReplyIds.has(reply.id)
                            ? "Show less"
                            : "View full message"}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Box>
      )}
      <ContactAccountModal
        open={openAccountModal}
        onClose={() => setOpenAccountModal(false)}
        contact={contact}
        onSaved={() => {
          setOpenAccountModal(false);
          onAccountUpdated?.();
        }}
      />
      <ContactTimezoneModal
        open={openTimezoneModal}
        onClose={() => setOpenTimezoneModal(false)}
        value={contact.timezone || ""}
        onSave={onUpdate ? (tz) => onUpdate("timezone", tz) : async () => {}}
      />
    </Paper>
  );
};

export default ContactOverview;
