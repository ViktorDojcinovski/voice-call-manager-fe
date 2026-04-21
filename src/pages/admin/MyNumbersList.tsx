import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
  Tooltip,
  Paper,
  Container,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { PhoneNumber } from "voice-javascript-common";

import { useSnackbar } from "../../hooks/useSnackbar";

import api from "../../utils/axiosInstance";
import {
  campaignV2,
  campaignV2CardSx,
  campaignV2SectionTitleSx,
} from "./Campaign/components/campaignV2Tokens";

const chipSx = {
  fontSize: "1rem",
  pl: 1,
  borderColor: campaignV2.outlineBorder,
  "& .MuiChip-label": { px: 0.5 },
};

const copyIconSx = {
  ml: 1,
  color: campaignV2.accent,
  "&:hover": {
    color: campaignV2.accentDark,
    bgcolor: campaignV2.rowSelectedFill,
  },
};

export default function PhoneNumbersPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { enqueue } = useSnackbar();

  useEffect(() => {
    const fetchMyNumbers = async () => {
      try {
        const { data } = await api.get("/numbers/my");

        setPhoneNumbers(data.map((num: PhoneNumber) => num.number));
        setLoading(false);
      } catch (error) {
        enqueue("Failed to load numbers", { variant: "error" });
      }
    };

    fetchMyNumbers();
  }, []);

  const handleCopy = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(number);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  return (
    <Container
      maxWidth={false}
      sx={{
        py: 3,
        px: { xs: 2, sm: 3 },
        bgcolor: campaignV2.pageBg,
        minHeight: "100%",
      }}
    >
      <Box mb={3}>
        <Typography sx={campaignV2SectionTitleSx}>Telephony</Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
          Your Phone Numbers
        </Typography>
      </Box>

      {loading ? (
        <Paper
          variant="outlined"
          sx={{
            ...campaignV2CardSx,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 8,
          }}
        >
          <CircularProgress sx={{ color: campaignV2.accent }} />
        </Paper>
      ) : (
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {phoneNumbers.map((number) => (
            <Chip
              key={number}
              label={
                <Box display="flex" alignItems="center">
                  {number}
                  <Tooltip title={copiedNumber === number ? "Copied!" : "Copy"}>
                    <IconButton
                      size="small"
                      sx={copyIconSx}
                      onClick={() => handleCopy(number)}
                    >
                      {copiedNumber === number ? (
                        <CheckIcon fontSize="small" />
                      ) : (
                        <ContentCopyIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              variant="outlined"
              sx={chipSx}
            />
          ))}
        </Stack>
      )}
    </Container>
  );
}
