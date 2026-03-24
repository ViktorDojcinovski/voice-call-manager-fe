import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Stack,
  IconButton,
} from "@mui/material";
import {
  Person,
  Phone,
  Email as EmailIcon,
  LinkedIn,
  LocationOn,
  AccessTime,
  Title,
  ExpandMore as ExpandMoreIcon,
  Edit,
} from "@mui/icons-material";
import { Contact } from "../../../../types/contact";
import { EditableFieldItem } from "../../../../components/atoms/EditableFieldItem";
import { formatContactLocalTime } from "../../../../utils/formatContactLocalTime";

interface ProspectFieldsCardProps {
  contact: Contact;
  defaultExpanded?: boolean;
  userTimeZone?: string;
  onUpdate?: (field: string, value: string) => Promise<void>;
  onEditTimezone?: () => void;
  onEditAccount?: () => void;
}

const CARD_STYLES = {
  borderRadius: 2,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  "&:before": { display: "none" },
};

export function ProspectFieldsCard({
  contact,
  defaultExpanded = true,
  userTimeZone,
  onUpdate,
  onEditTimezone,
}: ProspectFieldsCardProps) {
  const fields = [
    { key: "sequence", label: "Sequence", value: (contact as any).sequence },
    { key: "title", label: "Title", value: contact.title || contact.capacity },
    { key: "email", label: "Email", value: contact.email },
    { key: "timezone", label: "Time Zone", value: contact.timezone },
    { key: "activity", label: "Activity", value: (contact as any).activity },
  ].filter((f) => f.value && String(f.value).trim());

  const count = Math.max(
    fields.length,
    [contact.first_name, contact.last_name, contact.phone, contact.email, contact.title, contact.timezone].filter(Boolean).length
  );

  const localTimeDisplay = formatContactLocalTime(
    contact.timezone,
    userTimeZone,
    new Date()
  );

  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      sx={CARD_STYLES}
      elevation={0}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          "& .MuiAccordionSummary-content": {
            alignItems: "center",
            gap: 1,
          },
        }}
      >
        <Person sx={{ fontSize: 20, color: "primary.main" }} />
        <Typography variant="subtitle1" fontWeight={600}>
          Prospect Fields
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          ({count})
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Stack spacing={2}>
          <EditableFieldItem
            icon={<Person color="primary" sx={{ fontSize: 20 }} />}
            label="Contact Name"
            value={`${contact.first_name || ""} ${contact.last_name || ""}`.trim()}
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
          <EditableFieldItem
            icon={<Title color="primary" sx={{ fontSize: 20 }} />}
            label="Title"
            value={contact.title || contact.capacity || ""}
            onSave={onUpdate ? (v) => onUpdate("title", v) : undefined}
          />
          <EditableFieldItem
            icon={<EmailIcon color="primary" sx={{ fontSize: 20 }} />}
            label="Email"
            value={contact.email || ""}
            type="email"
            onSave={onUpdate ? (v) => onUpdate("email", v) : undefined}
          />
          <EditableFieldItem
            icon={<Phone color="primary" sx={{ fontSize: 20 }} />}
            label="Phone"
            value={contact.phone || ""}
            onSave={onUpdate ? (v) => onUpdate("phone", v) : undefined}
          />
          <EditableFieldItem
            icon={<LocationOn color="primary" sx={{ fontSize: 20 }} />}
            label="City"
            value={contact.city || ""}
            onSave={onUpdate ? (v) => onUpdate("city", v) : undefined}
          />
          <EditableFieldItem
            icon={<LocationOn color="primary" sx={{ fontSize: 20 }} />}
            label="State"
            value={contact.state || ""}
            onSave={onUpdate ? (v) => onUpdate("state", v) : undefined}
          />
          <EditableFieldItem
            icon={<LinkedIn color="primary" sx={{ fontSize: 20 }} />}
            label="LinkedIn URL"
            value={contact.linkedIn || ""}
            truncateTextAfter={250}
            type="url"
            onSave={onUpdate ? (v) => onUpdate("linkedIn", v) : undefined}
          />
          <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.5 }}>
            <AccessTime color="primary" sx={{ fontSize: 20 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography fontSize={13} fontWeight={500} color="text.secondary">
                  Time Zone
                </Typography>
                {onUpdate && onEditTimezone && (
                  <IconButton
                    size="small"
                    onClick={onEditTimezone}
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
          <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.5 }}>
            <AccessTime color="primary" sx={{ fontSize: 20 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography fontSize={13} fontWeight={500} color="text.secondary">
                Local Time
              </Typography>
              <Typography fontSize={13} sx={{ mt: 0.5 }}>
                {localTimeDisplay || "—"}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
