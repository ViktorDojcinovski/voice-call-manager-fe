import { useState } from "react";
import {
  Stack,
  Box,
  Typography,
  TextField,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Edit, Check, Close, Star, StarBorder, Warning } from "@mui/icons-material";
import type { ContactPhone, PhoneEntry } from "../../types/contact";
import { getContactPrimaryPhone } from "../../utils/getContactPrimaryPhone";

const SLOTS = [
  { key: "mobile" as const, label: "Mobile" },
  { key: "company" as const, label: "Company" },
  { key: "other" as const, label: "Other" },
] as const;

const defaultEntry: PhoneEntry = { number: null, isBad: false, isFavourite: false };

function getEntriesWithNumbers(phone?: ContactPhone | null): {
  key: (typeof SLOTS)[number]["key"];
  label: string;
  number: string;
  isBad: boolean;
  isFavourite: boolean;
}[] {
  if (!phone) return [];
  return SLOTS.filter((s) => phone[s.key]?.number?.trim()).map((s) => ({
    key: s.key,
    label: s.label,
    number: phone[s.key]!.number!.trim(),
    isBad: !!phone[s.key]?.isBad,
    isFavourite: !!phone[s.key]?.isFavourite,
  }));
}

interface PhoneFieldWithDropdownProps {
  phone?: ContactPhone | null;
  onUpdate?: (phone: ContactPhone) => Promise<void>;
  readOnly?: boolean;
  label?: string;
  icon?: React.ReactNode;
}

export function PhoneFieldWithDropdown({
  phone,
  onUpdate,
  readOnly = false,
  label = "Phone",
  icon,
}: PhoneFieldWithDropdownProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState<ContactPhone>(() => ({
    mobile: { ...defaultEntry, ...phone?.mobile },
    company: { ...defaultEntry, ...phone?.company },
    other: { ...defaultEntry, ...phone?.other },
  }));
  const [selectedSlot, setSelectedSlot] = useState<"mobile" | "company" | "other">("mobile");
  const [isSaving, setIsSaving] = useState(false);

  const primary = getContactPrimaryPhone({ phone }) ?? "";
  const entries = getEntriesWithNumbers(phone);
  const hasMultiple = entries.length >= 2;
  const [displaySlot, setDisplaySlot] = useState<string | null>(null);
  const displayedNumber =
    (displaySlot && entries.find((e) => e.key === displaySlot)?.number) ?? primary;

  const handleStartEdit = () => {
    setEditPhone({
      mobile: { ...defaultEntry, ...phone?.mobile },
      company: { ...defaultEntry, ...phone?.company },
      other: { ...defaultEntry, ...phone?.other },
    });
    const firstWithNumber = entries[0]?.key ?? "mobile";
    setSelectedSlot(firstWithNumber);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!onUpdate) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onUpdate(editPhone);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save phone", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFavourite = async (slot: "mobile" | "company" | "other") => {
    if (!onUpdate || !phone) return;
    const current = phone[slot];
    if (!current?.number?.trim()) return;
    const newPhone: ContactPhone = {
      ...phone,
      [slot]: {
        ...current,
        isFavourite: !current.isFavourite,
      },
    };
    await onUpdate(newPhone);
  };

  const handleToggleBad = async (slot: "mobile" | "company" | "other") => {
    if (!onUpdate || !phone) return;
    const current = phone[slot];
    if (!current?.number?.trim()) return;
    const newPhone: ContactPhone = {
      ...phone,
      [slot]: {
        ...current,
        isBad: !current.isBad,
      },
    };
    await onUpdate(newPhone);
  };

  const displayValue = displayedNumber || primary || "—";

  if (isEditing) {
    const currentVal = editPhone[selectedSlot]?.number ?? "";
    const isFav = !!editPhone[selectedSlot]?.isFavourite;
    const isBad = !!editPhone[selectedSlot]?.isBad;

    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
        {icon}
        <Box sx={{ flexGrow: 1 }}>
          <Typography fontSize={13} fontWeight={500} color="text.secondary">
            {label}
          </Typography>
          <Stack spacing={1} sx={{ mt: 0.5 }}>
            {hasMultiple && (
              <FormControl size="small" fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={selectedSlot}
                  label="Type"
                  onChange={(e) =>
                    setSelectedSlot(e.target.value as "mobile" | "company" | "other")
                  }
                >
                  {SLOTS.map((s) => (
                    <MenuItem key={s.key} value={s.key}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <TextField
                type="tel"
                size="small"
                value={currentVal}
                onChange={(e) =>
                  setEditPhone((prev) => ({
                    ...prev,
                    [selectedSlot]: {
                      ...prev[selectedSlot],
                      number: e.target.value || null,
                      isBad: prev[selectedSlot]?.isBad ?? false,
                      isFavourite: prev[selectedSlot]?.isFavourite ?? false,
                    },
                  }))
                }
                placeholder={`${SLOTS.find((s) => s.key === selectedSlot)?.label ?? selectedSlot} number`}
                sx={{ flexGrow: 1 }}
              />
              <IconButton
                size="small"
                onClick={() =>
                  setEditPhone((prev) => ({
                    ...prev,
                    [selectedSlot]: {
                      ...prev[selectedSlot],
                      isFavourite: !isFav,
                    },
                  }))
                }
                color={isFav ? "primary" : "default"}
              >
                {isFav ? <Star fontSize="small" /> : <StarBorder fontSize="small" />}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  setEditPhone((prev) => ({
                    ...prev,
                    [selectedSlot]: {
                      ...prev[selectedSlot],
                      isBad: !isBad,
                    },
                  }))
                }
                color={isBad ? "error" : "default"}
              >
                <Warning fontSize="small" />
              </IconButton>
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" onClick={handleSave} disabled={isSaving}>
                <Check fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleCancel} disabled={isSaving}>
                <Close fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    );
  }

  return (
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
          {hasMultiple ? (
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={displaySlot ?? (entries.find((e) => e.isFavourite)?.key ?? entries[0]?.key ?? "")}
                onChange={(e) => setDisplaySlot(e.target.value || null)}
                displayEmpty
                renderValue={(v) => {
                  const e = entries.find((x) => x.key === v) ?? entries[0];
                  return e ? `${e.label}: ${e.number}` : "—";
                }}
                sx={{ fontSize: 13, py: 0.25 }}
              >
                {entries.map((e) => (
                  <MenuItem key={e.key} value={e.key}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {e.isFavourite && <Star fontSize="small" color="primary" />}
                      {e.isBad && <Warning fontSize="small" color="error" />}
                      <Typography fontSize={13}>
                        {e.label}: {e.number}
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Stack direction="row" spacing={0.5} alignItems="center">
              {phone?.mobile?.isFavourite && <Star fontSize="small" color="primary" />}
              {phone?.company?.isFavourite && <Star fontSize="small" color="primary" />}
              {phone?.other?.isFavourite && <Star fontSize="small" color="primary" />}
              {(phone?.mobile?.isBad || phone?.company?.isBad || phone?.other?.isBad) && (
                <Warning fontSize="small" color="error" />
              )}
              <Typography fontSize={13}>{displayValue}</Typography>
            </Stack>
          )}
          {!readOnly && onUpdate && (
            <IconButton size="small" onClick={handleStartEdit}>
              <Edit fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
