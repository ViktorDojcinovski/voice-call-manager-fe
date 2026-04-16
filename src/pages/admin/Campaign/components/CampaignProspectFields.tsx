import { useEffect, useState } from "react";
import { Box, Grid, Stack, Typography, IconButton } from "@mui/material";
import {
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

import { Contact, ContactPhone } from "../../../../types/contact";
import { EditableFieldItem } from "../../../../components/atoms/EditableFieldItem";
import { PhoneFieldWithDropdown } from "../../../../components/atoms/PhoneFieldWithDropdown";
import { formatContactLocalTime } from "../../../../utils/formatContactLocalTime";
import ContactTimezoneModal from "./ContactTimezoneModal";
import useAppStore from "../../../../store/useAppStore";
import {
  campaignV2,
  campaignV2CardSx,
  campaignV2SectionTitleSx,
} from "./campaignV2Tokens";

export interface CampaignProspectFieldsProps {
  contact: Contact;
  onUpdate?: (field: string, value: string | ContactPhone) => Promise<void>;
}

export function CampaignProspectFields({
  contact,
  onUpdate,
}: CampaignProspectFieldsProps) {
  const [now, setNow] = useState(new Date());
  const [openTimezoneModal, setOpenTimezoneModal] = useState(false);
  const { settings } = useAppStore((s) => s);
  const userTimeZone = settings?.["General Settings"]?.timezone as
    | string
    | undefined;

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const localTimeDisplay = formatContactLocalTime(
    contact.timezone,
    userTimeZone,
    now,
  );

  const iconSx = { color: campaignV2.accent };

  return (
    <Box sx={{ ...campaignV2CardSx, p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Person sx={{ color: campaignV2.accent, fontSize: 22 }} />
        <Typography sx={campaignV2SectionTitleSx}>Prospect fields</Typography>
      </Stack>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            <EditableFieldItem
              icon={<Title sx={iconSx} />}
              label="Title"
              value={contact.title || contact.capacity || ""}
              onSave={
                onUpdate ? (value) => onUpdate("title", value) : undefined
              }
            />
            <EditableFieldItem
              icon={<EmailIcon sx={iconSx} />}
              label="Email"
              value={contact.email || ""}
              type="email"
              onSave={
                onUpdate ? (value) => onUpdate("email", value) : undefined
              }
            />
            <EditableFieldItem
              icon={<LocationOn sx={iconSx} />}
              label="City"
              value={contact.city || ""}
              onSave={
                onUpdate ? (value) => onUpdate("city", value) : undefined
              }
            />
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            <EditableFieldItem
              icon={<Person sx={iconSx} />}
              label="Contact name"
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
              icon={<Phone sx={iconSx} />}
              label="Phone"
              phone={contact.phone}
              onUpdate={
                onUpdate ? (phone) => onUpdate("phone", phone) : undefined
              }
            />
            <EditableFieldItem
              icon={<LinkedIn sx={iconSx} />}
              label="LinkedIn URL"
              value={contact.linkedIn || ""}
              truncateTextAfter={250}
              type="url"
              onSave={
                onUpdate ? (value) => onUpdate("linkedIn", value) : undefined
              }
            />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
              <AccessTime sx={{ ...iconSx, fontSize: 20 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Typography fontSize={13} fontWeight={500} color="text.secondary">
                    Timezone
                  </Typography>
                  {onUpdate && (
                    <IconButton
                      size="small"
                      onClick={() => setOpenTimezoneModal(true)}
                      sx={{ color: campaignV2.accent, p: 0.25 }}
                      title="Edit timezone"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
                <Typography fontSize={13} sx={{ mt: 0.5 }}>
                  {contact.timezone || "—"}
                </Typography>
              </Box>
            </Stack>
            <EditableFieldItem
              icon={<LocationOn sx={iconSx} />}
              label="State"
              value={contact.state || ""}
              onSave={
                onUpdate ? (value) => onUpdate("state", value) : undefined
              }
            />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
              <AccessTime sx={{ ...iconSx, fontSize: 20 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography fontSize={13} fontWeight={500} color="text.secondary">
                  Local time
                </Typography>
                <Typography fontSize={13} sx={{ mt: 0.5 }}>
                  {localTimeDisplay || "—"}
                </Typography>
              </Box>
            </Stack>
            {contact.subject && (
              <EditableFieldItem
                icon={<InsertDriveFile sx={iconSx} />}
                label={String(contact.subject)}
                value=""
              />
            )}
          </Stack>
        </Grid>
      </Grid>
      <ContactTimezoneModal
        open={openTimezoneModal}
        onClose={() => setOpenTimezoneModal(false)}
        value={contact.timezone || ""}
        onSave={onUpdate ? (tz) => onUpdate("timezone", tz) : async () => {}}
      />
    </Box>
  );
}
