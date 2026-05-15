import { useState, useEffect } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Mail } from "@mui/icons-material";
import { format, isValid } from "date-fns";

import { campaignV2 } from "../campaignV2Tokens";
import type { EmailReply } from "../ContactEmailRepliesSection";

const SNIPPET_PREVIEW_LENGTH = 120;

function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

export interface EmailActivityRowProps {
  reply: EmailReply;
}

export function EmailActivityRow({ reply }: EmailActivityRowProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [reply.id]);

  let shortDateBadge = "";
  const ms = reply.date ? new Date(reply.date).getTime() : NaN;
  if (Number.isFinite(ms)) {
    const dateObj = new Date(ms);
    if (isValid(dateObj)) {
      shortDateBadge = format(dateObj, "MM/dd/yyyy h:mm a");
    }
  }

  const raw = reply.snippet || "(No preview available)";
  const text = decodeHtmlEntities(raw);
  const isLong = text.length > SNIPPET_PREVIEW_LENGTH;
  const snippetDisplay =
    isLong && !expanded
      ? `${text.slice(0, SNIPPET_PREVIEW_LENGTH).trim()}...`
      : text;

  return (
    <Box
      sx={{
        py: 1,
        px: 1,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "grey.50",
        mb: 1,
      }}
    >
      <Box
        display="flex"
        alignItems="flex-start"
        gap={1.5}
        flexWrap={{ xs: "wrap", sm: "nowrap" }}
      >
        <Box
          sx={{
            flexShrink: 0,
            px: 1.25,
            py: 0.75,
            borderRadius: 1,
            bgcolor: campaignV2.timelineBadgeBg,
            color: campaignV2.timelineBadgeColor,
            minWidth: 118,
            textAlign: "center",
          }}
        >
          <Typography fontSize={11} fontWeight={700} lineHeight={1.3}>
            {shortDateBadge || "—"}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
          <Mail sx={{ fontSize: 20, color: campaignV2.accent }} />
        </Stack>
        <Box flex={1} minWidth={0}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
            {reply.subject || "(No subject)"}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
            From: {reply.from || "—"} | To: {reply.to || "—"}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {snippetDisplay}
          </Typography>
          {isLong && (
            <Typography
              variant="caption"
              component="button"
              type="button"
              onClick={() => setExpanded((p) => !p)}
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
              {expanded ? "Show less" : "View full message"}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
