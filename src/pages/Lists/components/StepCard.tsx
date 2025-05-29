import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { GroupOutlined, PhoneForwardedOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import WobblingIconButton from "../../../components/UI/WobblingArrowIcon";
import { connectionDisplayMap, TelephonyConnection } from "../constants";
import { SimpleButton } from "../../../components/UI";
import ContactDialog from "./ContactDialog";

const StepCard = ({
  step,
  index,
  contacts,
  selectedCallType,
  list,
  onConnectionClick,
}: any) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [openContactsDialog, setOpenContactsDialog] = useState(false);

  const mode = (selectedCallType || TelephonyConnection.SOFT_CALL) as string;
  const hasEligibleContacts = contacts?.length > 0;

  const handleShowContacts = () => {
    setOpenContactsDialog(true);
  };

  return (
    <Card
      sx={{
        mb: 1,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        transition: "box-shadow 0.3s",
        "&:hover": {
          boxShadow: theme.shadows[1],
        },
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1,
          "&:last-child": {
            paddingBottom: 1.5,
          },
        }}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1" color="text.primary">
              {step.stepName}
            </Typography>
            {hasEligibleContacts && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <GroupOutlined
                  fontSize="small"
                  color="action"
                  sx={{ mt: "1px" }}
                />
                <Typography variant="caption" color="text.secondary">
                  {contacts?.length ?? 0}
                </Typography>
              </Box>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {step.defaultAction}
          </Typography>
        </Box>

        {hasEligibleContacts && (
          <Box display="flex" gap={2}>
            <SimpleButton
              label="Show Contacts"
              variant="contained"
              color="info"
              onClick={handleShowContacts}
            />
            <Tooltip title="Select Connection Type">
              <IconButton
                onClick={(e) => onConnectionClick(e, list.id)}
                color="default"
              >
                <PhoneForwardedOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Box
              display="flex"
              alignItems="center"
              border={`1px solid ${theme.palette.divider}`}
              borderRadius={theme.shape.borderRadius}
              pl={2}
              py={0.5}
              sx={{
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
              onClick={() =>
                navigate("/dashboard/device", {
                  state: { contacts, mode },
                })
              }
            >
              <Typography
                variant="caption"
                fontSize={12}
                color="text.secondary"
                sx={{ mr: 0.5 }}
              >
                {connectionDisplayMap[mode]}
              </Typography>
              <WobblingIconButton />
            </Box>
          </Box>
        )}
      </CardContent>

      <ContactDialog
        open={openContactsDialog}
        onClose={() => setOpenContactsDialog(false)}
        contacts={contacts}
      />
    </Card>
  );
};

export default StepCard;
