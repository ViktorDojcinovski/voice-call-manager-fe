/* eslint‑disable react/no‑array‑index‑key */
import { useState, useEffect } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import {
  Info,
  Business,
  Person,
  Phone,
  Email,
  Title,
} from "@mui/icons-material";

import { Contact } from "../../../../types/contact";
import { getContactPhoneDisplayString } from "../../../../utils/getContactPrimaryPhone";
import { FieldItem } from "../../../../components/atoms/FieldItem";
import { CallBar } from "./molecules/CallBar";

const LightPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
}));

interface ActiveDialingCardProps {
  session: Contact;
  inputVolume: number;
  outputVolume: number;
  hangUp: () => void;
  handleNumpadClick: (char: string) => void;
}

/* talking‑point mock */
const DEFAULT_POINTS = [
  "Introduce yourself and company",
  "Explain purpose of call",
  "Ask about current challenges",
  "Discuss how our solution addresses their needs",
  "Schedule follow‑up meeting",
];

const ActiveDialingCard = ({
  session,
  inputVolume,
  outputVolume,
  hangUp,
  handleNumpadClick,
}: ActiveDialingCardProps) => {
  const [callStartTime, setCallStartTime] = useState<Date | null>(new Date());
  const [elapsedTime, setElapsedTime] = useState("00:00");

  const [points, setPoints] = useState<string[]>(DEFAULT_POINTS);
  const [newPoint, setNewPoint] = useState("");
  const [tab, setTab] = useState<0 | 1>(0);

  const prospectFields: { label: string; value: string | undefined | null }[] =
    [
      { label: "Account", value: session.company },
      { label: "Title", value: session.capacity },
    ];

  useEffect(() => {
    if (!callStartTime) return;
    const int = setInterval(() => {
      const diff = Math.floor((Date.now() - callStartTime.getTime()) / 1000);
      const mm = String(Math.floor(diff / 60)).padStart(2, "0");
      const ss = String(diff % 60).padStart(2, "0");
      setElapsedTime(`${mm}:${ss}`);
    }, 1_000);
    return () => clearInterval(int);
  }, [callStartTime]);

  /* restart timer whenever we switch session */
  useEffect(() => {
    setCallStartTime(new Date());
  }, [session.id]);

  return (
    <Box>
      <CallBar
        mode="active"
        displayLabel={
          getContactPhoneDisplayString(session) ||
          session.first_name ||
          "No number"
        }
        session={session}
        callStartTime={callStartTime}
        elapsedTime={elapsedTime}
        hasAnsweredSession
        onEndCall={hangUp}
        handleNumpadClick={handleNumpadClick}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={3} overflow="scroll" className="hide-scrollbar">
          <LightPaper>
            <FieldItem
              icon={<Person color="primary" />}
              label="Name"
              value={`${session.first_name ?? ""} ${
                session.last_name ?? ""
              }`.trim()}
            />
            <FieldItem
              icon={<Title color="primary" />}
              label="Title"
              value={session.capacity ?? ""}
            />
            <FieldItem
              icon={<Business color="primary" />}
              label="Company"
              value={session.company ?? ""}
            />
            <FieldItem
              icon={<Email color="primary" />}
              label="Email"
              value={session.email ?? ""}
            />
            <FieldItem
              icon={<Phone color="primary" />}
              label="Phone"
              value={getContactPhoneDisplayString(session)}
            />
            <Button
              fullWidth
              variant="contained"
              size="small"
              sx={{ mt: 2, mb: 1 }}
            >
              Open in CRM
            </Button>
            <Button
              fullWidth
              variant="contained"
              size="small"
              sx={{ backgroundColor: "#0a66c2" }}
            >
              LinkedIn
            </Button>
          </LightPaper>
        </Grid>

        <Grid item xs={12} md={6}>
          <LightPaper>
            <Typography fontWeight={600} gutterBottom>
              Talking Points
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {points.map((p, i) => (
              <Box
                key={i}
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  bgcolor: i % 2 ? "#fafafa" : "#fff",
                  mb: 1,
                  fontSize: 14,
                }}
              >
                • {p}
              </Box>
            ))}

            <Box display="flex" gap={1} mt={1}>
              <TextField
                size="small"
                fullWidth
                placeholder="New talking point…"
                value={newPoint}
                onChange={(e) => setNewPoint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newPoint.trim()) {
                    setPoints([...points, newPoint.trim()]);
                    setNewPoint("");
                  }
                }}
              />
              <Button
                variant="contained"
                disabled={!newPoint.trim()}
                onClick={() => {
                  if (!newPoint.trim()) return;
                  setPoints([...points, newPoint.trim()]);
                  setNewPoint("");
                }}
              >
                Add
              </Button>
            </Box>
          </LightPaper>
        </Grid>

        <Grid item xs={12} md={3}>
          <LightPaper>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="fullWidth"
              sx={{ mb: 2 }}
            >
              <Tab label="Prospect Fields" />
              <Tab label="Activity History" />
            </Tabs>

            {tab === 0 && (
              <Box>
                {prospectFields.map(({ label, value }) => (
                  <Box key={label} mb={1}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: "uppercase" }}
                    >
                      {label}
                    </Typography>
                    <Typography>{value || "—"}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* activity history panel */}
            {tab === 1 && (
              <Box>
                {session.actions?.length ? (
                  session.actions.map((a, i) => {
                    const d = new Date(Number(a.timestamp));
                    return (
                      <Box
                        key={a.id ?? i}
                        display="flex"
                        alignItems="flex-start"
                        gap={1}
                        mb={2}
                      >
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 28,
                            height: 28,
                          }}
                        >
                          <Info fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography fontWeight={500}>
                            {a.subject ?? "Call"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {d.toLocaleDateString()} • {d.toLocaleTimeString()}
                          </Typography>
                          <Typography
                            variant="body2"
                            color={
                              a.result.toLowerCase() === "answered"
                                ? "success.main"
                                : "error.main"
                            }
                          >
                            {a.result}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                ) : (
                  <Typography>No history available.</Typography>
                )}
              </Box>
            )}
          </LightPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ActiveDialingCard;
