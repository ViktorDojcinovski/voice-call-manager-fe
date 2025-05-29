import { useState } from "react";
import { Box, Tabs, Tab, Chip, IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import useAppStore from "../../store/useAppStore";
import { SimpleButton } from "../UI/SimpleButton";
import api from "../../utils/axiosInstance";

const sfdcFieldOptions: MappedFieldsState = {
  contacts: [
    { id: "first_name", name: "First Name" },
    { id: "last_name", name: "Last Name" },
    { id: "company", name: "Company" },
    { id: "email", name: "Email" },
    { id: "mobile_phone", name: "Mobile Phone" },
  ],
  leads: [
    { id: "first_name", name: "First Name" },
    { id: "last_name", name: "Last Name" },
    { id: "company", name: "Company" },
    { id: "email", name: "Email" },
    { id: "corporate_phone", name: "Corporate Phone" },
    { id: "mobile_phone", name: "Mobile Phone" },
  ],
  accounts: [
    { id: "account_name", name: "Account Name" },
    { id: "industry", name: "Industry" },
    { id: "website", name: "Website" },
    { id: "revenue", name: "Revenue" },
  ],
  opportunities: [
    { id: "opportunity_name", name: "Opportunity Name" },
    { id: "stage", name: "Stage" },
    { id: "amount", name: "Amount" },
    { id: "close_date", name: "Close Date" },
  ],
};

type AppField = { id: string; name: string };

type MappedFieldsState = {
  contacts: AppField[];
  leads: AppField[];
  accounts: AppField[];
  opportunities: AppField[];
};

const tabOptions = ["contacts", "leads", "accounts", "opportunities"] as const;
type TabType = (typeof tabOptions)[number];

export default function FieldMapper() {
  const settings = useAppStore((state) => state.settings);
  const user = useAppStore((state) => state.user);
  const setSettings = useAppStore((state) => state.setSettings);

  const { integrationSettings } = settings!["Phone Settings"];

  const [activeTab, setActiveTab] = useState<TabType>("contacts");
  const [mappedFields, setMappedFields] = useState<MappedFieldsState>(
    integrationSettings ?? {
      contacts: [],
      leads: [],
      accounts: [],
      opportunities: [],
    }
  );

  const handleAddField = (field: any) => {
    setMappedFields((prev) => {
      const updated = { ...prev };
      updated[activeTab] = [...prev[activeTab], field];
      return updated;
    });
  };

  const handleRemoveField = (field: any) => {
    setMappedFields((prev) => {
      const updated = { ...prev };
      updated[activeTab] = prev[activeTab].filter((f) => f !== field);
      return updated;
    });
  };

  const onSubmit = async () => {
    try {
      if (!settings) {
        throw new Error("Missing settings!");
      }
      const existingPhoneSettings = { ...settings["Phone Settings"] };
      const { data } = await api.patch(`/settings/${user!.id}`, {
        "Phone Settings": {
          ...existingPhoneSettings,
          integrationSettings: mappedFields,
        },
      });

      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" color="info">
        INTEGRATION SETTINGS
      </Typography>
      <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
        <Tab label="Contacts" value="contacts" />
        <Tab label="Leads" value="leads" />
        <Tab label="Accounts" value="accounts" />
        <Tab label="Opportunities" value="opportunities" />
      </Tabs>

      <Box sx={{ display: "flex", gap: 4, mt: 3 }}>
        {/* Custom Fields (Mapped Fields) */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">Mapped Fields</Typography>
          <Box
            display="flex"
            padding={2}
            border="1px solid #eee"
            borderRadius={2}
            mt={1}
            gap={1}
          >
            {mappedFields[activeTab].map((field) => (
              <Chip
                key={field.id}
                label={field.name}
                onDelete={() => handleRemoveField(field)}
                deleteIcon={<CloseIcon />}
                color="info"
              />
            ))}
          </Box>
        </Box>

        {/* SFDC Fields List */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">Application Fields</Typography>
          <Box
            display="flex"
            padding={2}
            border="1px solid #eee"
            borderRadius={2}
            marginTop={1}
            gap={1}
          >
            {sfdcFieldOptions[activeTab].map((field) => (
              <Chip
                key={field.id}
                label={field.name}
                disabled={mappedFields[activeTab].some(
                  (f) => f.id === field.id
                )}
                icon={
                  !mappedFields[activeTab].includes(field) ? (
                    <IconButton
                      size="small"
                      onClick={() => handleAddField(field)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    <></>
                  )
                }
              />
            ))}
          </Box>
        </Box>
      </Box>
      <SimpleButton label="save" onClick={onSubmit} />
    </Box>
  );
}
