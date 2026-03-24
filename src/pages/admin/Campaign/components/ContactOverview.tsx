import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Tabs,
  Tab,
  TextField,
  CircularProgress,
  Link,
} from "@mui/material";
import { CallLog } from "voice-javascript-common";

import useAppStore from "../../../../store/useAppStore";
import { CallResult } from "../../../../types/call-results";
import api from "../../../../utils/axiosInstance";
import { useSnackbar } from "../../../../hooks/useSnackbar";

import ActivityRow from "./molecules/ActivityRow";
import { AccountFieldsCard } from "../../Contacts/components/AccountFieldsCard";
import { ProspectFieldsCard } from "../../Contacts/components/ProspectFieldsCard";
import ContactAccountModal from "./ContactAccountModal";
import ContactTimezoneModal from "./ContactTimezoneModal";

import { Contact } from "../../../../types/contact";

interface ContactOverviewProps {
  contact: Contact;
  onUpdate?: (field: string, value: string) => Promise<void>;
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

const ContactOverview = ({
  contact,
  onUpdate,
  onAccountUpdated,
}: ContactOverviewProps) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [openAccountModal, setOpenAccountModal] = useState(false);
  const [openTimezoneModal, setOpenTimezoneModal] = useState(false);

  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [emailReplies, setEmailReplies] = useState<EmailReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [expandedReplyIds, setExpandedReplyIds] = useState<Set<string>>(
    new Set()
  );

  const { settings } = useAppStore((s) => s);
  const callResults: CallResult[] =
    (settings?.["Phone Settings"]?.callResults as CallResult[]) ?? [];

  const userTimeZone = settings?.["General Settings"]?.timezone as
    | string
    | undefined;
  const { enqueue } = useSnackbar();

  useEffect(() => {
    const fetchCallLogs = async () => {
      const callLogs = await api.get("/call-logs", {
        params: { contactId: contact.id },
      });
      setCallLogs(callLogs.data.recordings);
    };
    fetchCallLogs();
  }, [contact.id]);

  useEffect(() => {
    if (tabIndex === 2) {
      fetchGmailStatus();
    }
  }, [tabIndex, contact.id]);

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
        setEmailReplies([]);
      } else {
        console.error("Failed to fetch email replies:", error);
        enqueue("Failed to load email replies", { variant: "error" });
      }
    } finally {
      setLoadingReplies(false);
    }
  };

  const visibleCallLogs = useMemo(
    () => callLogs.filter((l) => !!l.action?.result?.trim()),
    [callLogs]
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
          : cl
      )
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

      {tabIndex === 0 && (
        <Stack spacing={2}>
          <AccountFieldsCard
            contact={contact}
            defaultExpanded={true}
            onEditAccount={() => setOpenAccountModal(true)}
          />
          <ProspectFieldsCard
            contact={contact}
            defaultExpanded={true}
            userTimeZone={userTimeZone}
            onUpdate={onUpdate}
            onEditTimezone={() => setOpenTimezoneModal(true)}
          />
        </Stack>
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
        <Box px={2} py={2}>
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
                          const raw =
                            reply.snippet || "(No preview available)";
                          const text = decodeHtmlEntities(raw);
                          const isLong = text.length > SNIPPET_PREVIEW_LENGTH;
                          const isExpanded = expandedReplyIds.has(reply.id);
                          if (isLong && !isExpanded) {
                            return `${text
                              .slice(0, SNIPPET_PREVIEW_LENGTH)
                              .trim()}...`;
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
