import { useMemo, useState } from "react";
import {
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  ListItemText,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { Phone, ArrowDropDown } from "@mui/icons-material";

import type { Contact } from "../../types/contact";
import type { DialCallPayload, PhoneSlot } from "../../utils/getContactPrimaryPhone";
import {
  getContactPhoneDisplayString,
  getDialablePhoneMenuOptions,
} from "../../utils/getContactPrimaryPhone";

/** Fired when the user picks a menu row (before dial) or primary Call (choice cleared). */
export type DialChoicePreview = {
  number: string;
  slot: PhoneSlot;
  label: string;
};

export interface SplitDialCallButtonProps {
  /** Contact with structured phone (mobile / company / other). */
  session?: Contact | null;
  /** Fallback dial string when there is no session or no structured numbers. */
  phone?: string;
  /**
   * Primary Call sends `{ number }` only (server uses favourite / mobile→company→other).
   * Menu sends `{ number, slot }` so the campaign can dial that slot explicitly.
   */
  onDial: (payload: DialCallPayload) => void;
  /**
   * When the user opens the menu and picks a row, called with that row before `onDial`.
   * Primary Call clears with `null`. Use to sync the CallBar title with the chosen number.
   */
  onDialChoiceChange?: (choice: DialChoicePreview | null) => void;
  disabled?: boolean;
  /** Light buttons on CallBar gradient: white fill + dashboard blue label (not v2 primary). */
  lightOnGradient?: boolean;
  /** Button label (default: Call). */
  label?: string;
}

/**
 * Primary Call action plus dropdown of all non-bad numbers on the contact.
 * The chevron is shown whenever there is at least one dialable structured number (including a single line).
 */
export function SplitDialCallButton({
  session,
  phone = "",
  onDial,
  onDialChoiceChange,
  disabled = false,
  lightOnGradient = false,
  label = "Call",
}: SplitDialCallButtonProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const menuOptions = useMemo(
    () => (session ? getDialablePhoneMenuOptions(session) : []),
    [session]
  );

  const defaultDialNumber = useMemo(() => {
    if (menuOptions.length > 0 && session) {
      return getContactPhoneDisplayString(session) || menuOptions[0].number;
    }
    return (phone ?? "").trim();
  }, [menuOptions, phone, session]);

  const canStart = Boolean(defaultDialNumber);

  const handlePrimaryCall = () => {
    if (!defaultDialNumber) return;
    onDialChoiceChange?.(null);
    onDial({ number: defaultDialNumber });
  };

  const handlePickNumber = (
    num: string,
    slot: PhoneSlot,
    menuLabel: string
  ) => {
    setMenuAnchor(null);
    if (!num.trim()) return;
    const trimmed = num.trim();
    onDialChoiceChange?.({ number: trimmed, slot, label: menuLabel });
    onDial({ number: trimmed, slot });
  };

  const showSplitDial = Boolean(menuOptions.length >= 1 && defaultDialNumber);

  const lightSx = lightOnGradient
    ? (theme: Theme) => ({
        bgcolor: "rgba(255,255,255,0.95)",
        color: theme.palette.dashboard.infoMain,
        "&:hover": { bgcolor: "#fff" },
      })
    : undefined;

  return (
    <>
      {showSplitDial ? (
        <ButtonGroup
          variant="contained"
          color="success"
          disabled={disabled || !canStart}
        >
          <Button
            startIcon={<Phone />}
            onClick={handlePrimaryCall}
            sx={lightSx}
          >
            {label}
          </Button>
          <Button
            size="small"
            aria-label="Choose number to call"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={
              lightSx
                ? [lightSx, { minWidth: 40, px: 0.5 }]
                : { minWidth: 40, px: 0.5 }
            }
          >
            <ArrowDropDown />
          </Button>
        </ButtonGroup>
      ) : (
        <Button
          variant="contained"
          color="success"
          startIcon={<Phone />}
          onClick={handlePrimaryCall}
          disabled={disabled || !canStart}
          sx={lightSx}
        >
          {label}
        </Button>
      )}
      {showSplitDial && (
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          {menuOptions.map((opt) => (
            <MenuItem
              key={opt.key}
              onClick={() =>
                handlePickNumber(opt.number, opt.key, opt.label)
              }
              dense
            >
              <ListItemText
                primary={opt.label}
                secondary={opt.number}
                secondaryTypographyProps={{ sx: { fontSize: 12 } }}
              />
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
}
