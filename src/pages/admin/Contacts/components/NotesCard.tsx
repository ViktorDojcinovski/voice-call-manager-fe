import { useState } from "react";
import {
  Paper,
  Typography,
  Tabs,
  Tab,
  Box,
  Link,
} from "@mui/material";

interface NotesCardProps {
  onAddNote?: () => void;
}

export function NotesCard({ onAddNote }: NotesCardProps) {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Notes
        </Typography>
        <Link
          component="button"
          variant="body2"
          onClick={onAddNote}
          sx={{ cursor: "pointer", textDecoration: "none" }}
        >
          Add note
        </Link>
      </Box>
      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v as number)}
        sx={{
          minHeight: 40,
          "& .MuiTab-root": { minHeight: 40, py: 1 },
        }}
      >
        <Tab label="Prospect" />
        <Tab label="Account" />
      </Tabs>
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No notes.
        </Typography>
      </Box>
    </Paper>
  );
}
