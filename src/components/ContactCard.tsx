import {
  Box,
  Card,
  CardContent,
  IconButton,
  Typography,
  Tooltip,
  useTheme,
} from "@mui/material";
import { Delete, PersonRemove, Visibility } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import { Contact } from "../types/contact";
import { getContactPhoneDisplayString } from "../utils/getContactPrimaryPhone";

interface ContactCardProps {
  contact: Contact;
  onDeleteClick?: (contactId: string) => void;
  onRemoveFromListClick?: (contactId: string) => void;
  removeLabel?: string;
  disabled?: boolean;
}

const ContactCard = ({
  contact,
  onDeleteClick,
  onRemoveFromListClick,
  removeLabel = "Remove from list",
  disabled,
}: ContactCardProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const handleRemove = onRemoveFromListClick ?? onDeleteClick;

  return (
    <Box
      sx={{
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <Card
        elevation={1}
        sx={{
          mb: 2,
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.shape.borderRadius,
          transition: "box-shadow 0.3s",
          "&:hover": {
            boxShadow: theme.shadows[3],
          },
        }}
      >
        <CardContent
          sx={{
            pb: `${theme.spacing(2)} !important`,
            pt: theme.spacing(2),
            px: theme.spacing(3),
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={2}
            flexWrap="wrap"
          >
            <Box
              display="flex"
              flexDirection="column"
              sx={{
                pl: 1,
                borderLeft: `4px solid ${theme.palette.primary.main}`,
              }}
            >
              <Typography
                variant="h5"
                color="text.primary"
                fontWeight={600}
                fontSize={theme.typography.pxToRem(16)}
                sx={{
                  pl: 1,
                }}
              >
                {contact.first_name} {contact.last_name}
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                fontWeight={400}
                fontSize={theme.typography.pxToRem(14)}
                sx={{
                  pl: 1,
                }}
              >
                {contact.company}
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                fontWeight={400}
                fontSize={theme.typography.pxToRem(14)}
                sx={{
                  pl: 1,
                }}
              >
                {getContactPhoneDisplayString(contact) || "—"}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Tooltip title="View Contact">
                <IconButton
                  size="small"
                  onClick={() =>
                    navigate("/campaign", {
                      state: { contactId: contact.id, autoStart: false },
                    })
                  }
                >
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>

              {handleRemove && (
                <Tooltip
                  title={
                    onRemoveFromListClick ? removeLabel : "Delete Contact"
                  }
                >
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemove(contact.id)}
                  >
                    {onRemoveFromListClick ? (
                      <PersonRemove fontSize="small" />
                    ) : (
                      <Delete fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ContactCard;
