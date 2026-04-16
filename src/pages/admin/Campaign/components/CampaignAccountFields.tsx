import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Link,
} from "@mui/material";
import { Business, Edit, Link as LinkIcon } from "@mui/icons-material";

import api from "../../../../utils/axiosInstance";
import { Contact } from "../../../../types/contact";
import { EditableFieldItem } from "../../../../components/atoms/EditableFieldItem";
import { formatWebsiteToDomain } from "../../../../utils/formatWebsiteDomain";
import ContactAccountModal from "./ContactAccountModal";
import {
  campaignV2,
  campaignV2CardSx,
  campaignV2SectionTitleSx,
} from "./campaignV2Tokens";

export interface CampaignAccountFieldsProps {
  contact: Contact;
  onAccountUpdated?: () => void | Promise<void>;
}

export function CampaignAccountFields({
  contact,
  onAccountUpdated,
}: CampaignAccountFieldsProps) {
  const [openAccountModal, setOpenAccountModal] = useState(false);
  const accountId = contact.account?.id;

  const patchAccount = async (payload: Record<string, string>) => {
    if (!accountId) return;
    await api.patch(`/accounts/tenant/update/${accountId}`, payload);
    await onAccountUpdated?.();
  };

  return (
    <Box sx={{ ...campaignV2CardSx, p: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Business sx={{ color: campaignV2.accent, fontSize: 22 }} />
          <Typography sx={campaignV2SectionTitleSx}>Account fields</Typography>
        </Stack>
        <IconButton
          size="small"
          onClick={() => setOpenAccountModal(true)}
          title="Change linked account"
          sx={{ color: campaignV2.accent }}
        >
          <LinkIcon fontSize="small" />
        </IconButton>
      </Stack>

      {!accountId ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          No account linked.{" "}
          <Link
            component="button"
            type="button"
            onClick={() => setOpenAccountModal(true)}
            sx={{ color: campaignV2.link, fontWeight: 600, cursor: "pointer" }}
          >
            Link an account
          </Link>
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          <EditableFieldItem
            icon={<Business sx={{ color: campaignV2.accent }} />}
            label="Account name"
            value={contact.account?.companyName || ""}
            onSave={(value) => patchAccount({ companyName: value.trim() })}
          />
          <EditableFieldItem
            icon={<Edit sx={{ color: campaignV2.accent }} />}
            label="Website"
            value={contact.account?.website || ""}
            type="url"
            onSave={(value) => patchAccount({ website: value.trim() })}
          />
          {contact.account?.website ? (
            <Link
              href={
                contact.account.website.startsWith("http")
                  ? contact.account.website
                  : `https://${contact.account.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              fontSize={13}
              sx={{ color: campaignV2.link, pl: 4 }}
            >
              {formatWebsiteToDomain(contact.account.website)}
            </Link>
          ) : null}
          <EditableFieldItem
            icon={<Edit sx={{ color: campaignV2.accent }} />}
            label="Description"
            value={contact.account?.description || ""}
            textarea
            onSave={(value) => patchAccount({ description: value.trim() })}
          />
        </Stack>
      )}

      <ContactAccountModal
        open={openAccountModal}
        onClose={() => setOpenAccountModal(false)}
        contact={contact}
        onSaved={() => {
          setOpenAccountModal(false);
          void onAccountUpdated?.();
        }}
      />
    </Box>
  );
}
