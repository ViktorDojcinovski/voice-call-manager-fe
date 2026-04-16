import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  CircularProgress,
} from "@mui/material";

import api from "../../../../utils/axiosInstance";
import { useSnackbar } from "../../../../hooks/useSnackbar";
import { campaignV2 } from "./campaignV2Tokens";

interface GmailStatus {
  connected: boolean;
  emailAddress?: string;
}

export interface EmailReply {
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

interface ContactEmailRepliesSectionProps {
  contactId: string;
  /** When false, skip network (tab not visible). */
  active?: boolean;
}

/**
 * Gmail replies list for a contact — used on Campaign Activities tab and can be reused elsewhere.
 */
export function ContactEmailRepliesSection({
  contactId,
  active = true,
}: ContactEmailRepliesSectionProps) {
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [emailReplies, setEmailReplies] = useState<EmailReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [expandedReplyIds, setExpandedReplyIds] = useState<Set<string>>(
    new Set(),
  );
  const { enqueue } = useSnackbar();

  useEffect(() => {
    if (!active || !contactId) return;
    const fetchGmailStatus = async () => {
      try {
        const response = await api.get<GmailStatus>("/email/gmail/status");
        setGmailStatus(response.data);
      } catch {
        setGmailStatus({ connected: false });
      }
    };
    void fetchGmailStatus();
  }, [active, contactId]);

  useEffect(() => {
    if (!active || !contactId) return;
    if (!gmailStatus?.connected) {
      setEmailReplies([]);
      return;
    }
    const fetchEmailReplies = async () => {
      setLoadingReplies(true);
      try {
        const response = await api.get<EmailReply[]>("/email/gmail/replies", {
          params: { contactId },
        });
        setEmailReplies(response.data);
      } catch (error: unknown) {
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 409) {
          setEmailReplies([]);
        } else {
          console.error("Failed to fetch email replies:", error);
          enqueue("Failed to load email replies", { variant: "error" });
        }
      } finally {
        setLoadingReplies(false);
      }
    };
    void fetchEmailReplies();
  }, [active, contactId, gmailStatus?.connected, enqueue]);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        borderColor: "divider",
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        Email replies
      </Typography>
      {loadingReplies ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} sx={{ color: campaignV2.accent }} />
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
                bgcolor: "grey.50",
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
                        if (next.has(reply.id)) next.delete(reply.id);
                        else next.add(reply.id);
                        return next;
                      })
                    }
                    sx={{
                      mt: 0.5,
                      display: "inline-block",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "none",
                      background: "none",
                      p: 0,
                      font: "inherit",
                      color: campaignV2.link,
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
  );
}
