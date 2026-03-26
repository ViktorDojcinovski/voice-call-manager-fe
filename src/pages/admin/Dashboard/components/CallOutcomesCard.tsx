import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cardStyle } from "../dashboard.constants";

interface OutcomeEntry {
  name: string;
  value: number;
  color: string;
}

interface CallOutcomesCardProps {
  outcomeData: OutcomeEntry[];
  totalCalls: number;
}

export default function CallOutcomesCard({ outcomeData, totalCalls }: CallOutcomesCardProps) {
  const theme = useTheme();
  const total = outcomeData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card elevation={0} sx={{ ...cardStyle, width: "100%" }}>
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Call Outcomes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Session breakdown
            </Typography>
          </Box>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              backgroundColor: theme.palette.background.default,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              ↗
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            position: "relative",
            width: 220,
            height: 220,
            mx: "auto",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                dataKey="value"
                data={outcomeData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={3}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                cornerRadius={6}
              >
                {outcomeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: 32,
                fontWeight: 800,
                lineHeight: 1,
                color: theme.palette.text.primary,
              }}
            >
              {totalCalls}
            </Typography>
            <Typography
              sx={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: 1.5,
                color: theme.palette.text.secondary,
                mt: 0.5,
              }}
            >
              TOTAL DIALS
            </Typography>
          </Box>
        </Box>

        {/* Legend */}
        <Stack direction="row" justifyContent="center" spacing={3} mt={2}>
          {outcomeData.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <Stack key={item.name} alignItems="center" spacing={0.5}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: 3,
                      backgroundColor: item.color,
                    }}
                  />
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="text.secondary"
                    sx={{
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      fontSize: 10,
                    }}
                  >
                    {item.name}
                  </Typography>
                </Stack>
                <Typography variant="body2" fontWeight="bold">
                  {pct}%
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
