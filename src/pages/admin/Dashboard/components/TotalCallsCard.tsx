import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { CallOutlined as PhoneIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import KpiCard from "./KpiCard";
import useAppStore from "../../../../store/useAppStore";

interface TotalCallsCardProps {
  calls: number;
}

export default function TotalCallsCard({ calls }: TotalCallsCardProps) {
  const theme = useTheme();
  const settings = useAppStore((s) => s.settings);
  const d = theme.palette.dashboard;
  const goal =
    settings?.["General Settings"]?.dashboardSettings?.goalProgress ?? 10;
  const progress =
    calls > 0 ? Math.min(Math.round((calls / goal) * 100), 100) : 0;

  return (
    <KpiCard
      icon={<PhoneIcon sx={{ color: d.infoMain, fontSize: 22 }} />}
      iconBg={d.infoBg}
      title="Total Calls"
      value={calls}
      subtitle="today"
    >
      <Box mt={2}>
        <Stack direction="row" justifyContent="space-between" mb={0.5}>
          <Typography
            variant="caption"
            fontWeight={600}
            color="text.secondary"
            sx={{ letterSpacing: 0.5 }}
          >
            GOAL PROGRESS
          </Typography>
          <Typography variant="caption" fontWeight={600} color="primary.main">
            {progress}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: d.progressTrack,
            "& .MuiLinearProgress-bar": { borderRadius: 3 },
          }}
        />
      </Box>
    </KpiCard>
  );
}
