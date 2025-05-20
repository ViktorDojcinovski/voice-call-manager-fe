import { Box, styled } from "@mui/material";

const StatusDot = styled(Box)<{ color: string }>(({ theme, color }) => ({
  width: 10,
  height: 10,
  borderRadius: "50%",
  backgroundColor: color,
  boxShadow: `0 0 4px ${color}`,
}));

export { StatusDot };
