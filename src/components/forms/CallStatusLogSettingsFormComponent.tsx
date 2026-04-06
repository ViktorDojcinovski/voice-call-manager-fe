import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import { UserRole } from "voice-javascript-common";

import api from "../../utils/axiosInstance";
import useAppStore from "../../store/useAppStore";

type CallStatusLogData = {
  enabled?: boolean;
};

/**
 * Phone Settings → callStatusLog — toggles the in-app Twilio socket status log panel.
 * Value is merged from admin for non-admin users (see backend applyAdminOverrides).
 */
export default function CallStatusLogSettingsFormComponent(data: CallStatusLogData) {
  const user = useAppStore((state) => state.user);
  const settings = useAppStore((state) => state.settings);
  const setSettings = useAppStore((state) => state.setSettings);
  const isAdmin = user?.role === UserRole.ADMIN;

  const [enabled, setEnabled] = useState(data?.enabled ?? false);

  useEffect(() => {
    setEnabled(data?.enabled ?? false);
  }, [data?.enabled]);

  const onSave = async () => {
    if (!settings || !isAdmin) return;
    try {
      const existingPhoneSettings = { ...settings["Phone Settings"] };
      const { data: res } = await api.patch(`/settings`, {
        "Phone Settings": {
          ...existingPhoneSettings,
          callStatusLog: { enabled },
        },
      });
      setSettings(res);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ maxWidth: 560 }}>
      <Typography variant="h6" gutterBottom>
        Twilio status log
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        When enabled, a debug panel appears in the bottom-right of the app (admin layout) and
        records backend socket events (`call-status-user-*`) and basic Twilio Voice device
        events. Use for troubleshooting call flow; disable for production agents when not
        needed.
      </Typography>

      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This option is controlled by your administrator.
        </Alert>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(_, v) => setEnabled(v)}
            disabled={!isAdmin}
          />
        }
        label="Show Twilio status log"
      />

      {isAdmin && (
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={() => void onSave()}>
            Save
          </Button>
        </Box>
      )}
    </Box>
  );
}
