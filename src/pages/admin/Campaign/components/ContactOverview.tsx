import { useState } from "react";
import { Box, Paper, Typography, Stack, Tabs, Tab } from "@mui/material";

import { Contact, ContactPhone } from "../../../../types/contact";
import { CampaignAccountFields } from "./CampaignAccountFields";
import { CampaignProspectFields } from "./CampaignProspectFields";
import { ContactActivityTimeline } from "./ContactActivityTimeline";
import { ContactEmailRepliesSection } from "./ContactEmailRepliesSection";
import { campaignV2 } from "./campaignV2Tokens";

interface ContactOverviewProps {
  contact: Contact;
  onUpdate?: (field: string, value: string | ContactPhone) => Promise<void>;
  onAccountUpdated?: () => void | Promise<void>;
}

const ContactOverview = ({ contact, onUpdate, onAccountUpdated }: ContactOverviewProps) => {
  const [tabIndex, setTabIndex] = useState(0);

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
        sx={{
          mb: 3,
          "& .MuiTab-root": { color: "text.secondary", fontWeight: 600 },
          "& .MuiTab-root.Mui-selected": {
            color: campaignV2.accent,
            fontWeight: 700,
          },
          "& .MuiTabs-indicator": {
            bgcolor: campaignV2.accent,
            height: 3,
          },
        }}
      >
        <Tab label="Prospect fields" />
        <Tab label="Activity history" />
        <Tab label="Email" />
      </Tabs>

      {tabIndex === 0 && (
        <Stack spacing={2}>
          <CampaignAccountFields contact={contact} onAccountUpdated={onAccountUpdated} />
          <CampaignProspectFields contact={contact} onUpdate={onUpdate} />
        </Stack>
      )}
      {tabIndex === 1 && (
        <Box px={{ xs: 0, sm: 1 }}>
          <ContactActivityTimeline contactId={contact.id} density="comfortable" />
        </Box>
      )}
      {tabIndex === 2 && (
        <Box px={{ xs: 0, sm: 1 }} py={1}>
          <ContactEmailRepliesSection contactId={contact.id} active={tabIndex === 2} />
        </Box>
      )}
    </Paper>
  );
};

export default ContactOverview;
