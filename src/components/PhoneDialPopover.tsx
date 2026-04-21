import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  Box,
  IconButton,
  InputBase,
} from "@mui/material";
import { Backspace, Phone } from "@mui/icons-material";
import { phoneDials } from "../utils/dials";
import api from "../utils/axiosInstance";

interface PhoneDialerPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const PhoneDialerPopover = ({
  anchorEl,
  onClose,
}: PhoneDialerPopoverProps) => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleNumClick = (digit: string) => {
    setPhoneNumber((prev) => prev + digit);
  };

  const handleClear = () => setPhoneNumber("");

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = async () => {
    // before redirect detect if we have the number in contacts and if yes then go to /cotnacts/contactId otherwise go to the dial step
    const trimmed = phoneNumber.trim();
    if (!trimmed) return;
    const { data } = await api.get(`/contacts/lookup-by-phone?phone=${encodeURIComponent(trimmed)}`);
    // clear value for the input 
    setPhoneNumber("");

    if (data.id) {
      navigate(`/contacts/${data.id}`);
    } else {
      navigate(`/dialer-call/${encodeURIComponent(trimmed)}`);
    }
    onClose();
  };

  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
          },
        },
      }}
    >
      <Box
        sx={{
          width: 220,
          p: 1.5,
          bgcolor: "background.paper",
        }}
      >
        {/* Display area - phone-style */}
        <Box
          sx={{
            mb: 1.5,
            px: 1.5,
            py: 0.75,
            borderRadius: 1.5,
            bgcolor: "grey.50",
            border: "1px solid",
            borderColor: "grey.200",
            minHeight: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 0.5,
          }}
        >
          <InputBase
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter number"
            sx={{
              flex: 1,
              fontFamily: "monospace",
              fontSize: "0.8125rem",
              letterSpacing: 1,
              "& input::placeholder": {
                color: "grey.400",
                opacity: 1,
              },
            }}
          />
          {phoneNumber && (
            <IconButton
              size="small"
              onClick={handleBackspace}
              sx={{
                color: "grey.500",
                "&:hover": { color: "primary.main", bgcolor: "grey.100" },
              }}
            >
              <Backspace sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>

        {/* Keypad - friendly soft buttons */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            mb: 1.5,
          }}
        >
          {phoneDials.flat().map((digit, idx) =>
            digit === null ? (
              <Box key={idx} sx={{ aspectRatio: 1, maxWidth: 48, mx: "auto" }} />
            ) : (
              <Box
                key={idx}
                component="button"
                type="button"
                onClick={() => handleNumClick(digit)}
                sx={{
                  aspectRatio: 1,
                  maxWidth: 48,
                  mx: "auto",
                  width: "100%",
                  borderRadius: "50%",
                  border: "none",
                  bgcolor: "grey.100",
                  color: "text.primary",
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  "&:hover": {
                  bgcolor: "grey.200",
                  color: "primary.main",
                },
              }}
            >
                {digit}
              </Box>
            )
          )}
        </Box>

        {/* Actions */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={handleClear}
            sx={{
              px: 1,
              py: 0.5,
              border: "none",
              bgcolor: "transparent",
              color: "grey.500",
              fontSize: "0.75rem",
              cursor: "pointer",
              borderRadius: 1,
              "&:hover": {
                color: "secondary.main",
                bgcolor: "grey.100",
              },
            }}
          >
            Clear
          </Box>
          <Box
            component="button"
            type="button"
            onClick={handleCall}
            disabled={!phoneNumber.trim()}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1.5,
              py: 0.75,
              border: "none",
              borderRadius: 2,
              bgcolor: phoneNumber.trim()
                ? "success.main"
                : "grey.300",
              color: "white",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: phoneNumber.trim() ? "pointer" : "not-allowed",
              boxShadow: phoneNumber.trim()
                ? "0 2px 8px rgba(76, 175, 80, 0.3)"
                : "none",
              "&:hover": phoneNumber.trim()
                ? {
                    bgcolor: "success.dark",
                    boxShadow: "0 3px 10px rgba(76, 175, 80, 0.35)",
                  }
                : {},
            }}
          >
            <Phone sx={{ fontSize: 16 }} />
            Call
          </Box>
        </Box>
      </Box>
    </Popover>
  );
};

export default PhoneDialerPopover;
