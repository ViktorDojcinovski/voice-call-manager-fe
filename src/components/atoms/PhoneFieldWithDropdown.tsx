import { useState } from "react";
import { Stack, Box, Typography, IconButton } from "@mui/material";
import { Edit, Star, Warning } from "@mui/icons-material";
import type { ContactPhone } from "../../types/contact";
import { getContactPrimaryPhone } from "../../utils/getContactPrimaryPhone";
import { ContactPhoneEditModal } from "./ContactPhoneEditModal";

interface PhoneFieldWithDropdownProps {
  phone?: ContactPhone | null;
  onUpdate?: (phone: ContactPhone) => Promise<void>;
  readOnly?: boolean;
  label?: string;
  icon?: React.ReactNode;
}

/**
 * Shows primary dialable number with edit (modal lists all slots). No slot dropdown.
 */
export function PhoneFieldWithDropdown({
  phone,
  onUpdate,
  readOnly = false,
  label = "Phone",
  icon,
}: PhoneFieldWithDropdownProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const primary = getContactPrimaryPhone({ phone }) ?? "";

  const handleSaveFromModal = async (next: ContactPhone) => {
    if (!onUpdate) return;
    await onUpdate(next);
  };

  const displayValue = primary || "—";

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ width: "100%" }}
      >
        {icon}
        <Box sx={{ flexGrow: 1 }}>
          <Typography fontSize={13} fontWeight={500} color="text.secondary">
            {label}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              {phone?.mobile?.isFavourite && (
                <Star fontSize="small" color="primary" />
              )}
              {phone?.company?.isFavourite && (
                <Star fontSize="small" color="primary" />
              )}
              {phone?.other?.isFavourite && (
                <Star fontSize="small" color="primary" />
              )}
              {(phone?.mobile?.isBad ||
                phone?.company?.isBad ||
                phone?.other?.isBad) && (
                <Warning fontSize="small" color="error" />
              )}
              <Typography fontSize={13}>{displayValue}</Typography>
            </Stack>
            {!readOnly && onUpdate && (
              <IconButton
                size="small"
                onClick={() => setModalOpen(true)}
                aria-label="Edit phone numbers"
              >
                <Edit fontSize="small" />
              </IconButton>
            )}
          </Stack>
        </Box>
      </Stack>

      <ContactPhoneEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        phone={phone}
        onSave={handleSaveFromModal}
      />
    </>
  );
}
