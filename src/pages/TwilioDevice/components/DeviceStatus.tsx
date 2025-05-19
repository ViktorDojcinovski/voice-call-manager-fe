import { Box, Typography, useTheme, styled } from "@mui/material";

const StatusDot = styled(Box)<{ color: string }>(({ theme, color }) => ({
  width: 10,
  height: 10,
  borderRadius: "50%",
  backgroundColor: color,
  boxShadow: `0 0 4px ${color}`,
}));

const StatusLine = ({ status }: { status: string }) => {
  const theme = useTheme();

  const colorMap: Record<string, string> = {
    connected: theme.palette.success.main,
    disconnected: theme.palette.error.main,
    calling: theme.palette.warning.main,
  };

  const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Box mt={2} display="flex" alignItems="center" gap={1}>
      <StatusDot color={colorMap[status] || theme.palette.grey[500]} />
      <Typography variant="body2" fontWeight={500}>
        {capitalizedStatus}
      </Typography>
    </Box>
  );
};

export default StatusLine;
