import { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  MenuItem,
  Chip,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { WeekDay } from "voice-javascript-common";

import useAppStore from "../../store/useAppStore";
import api from "../../utils/axiosInstance";
import { SimpleButton } from "../UI/SimpleButton";

interface TimeSlot {
  from: string;
  to: string;
}

type Schedule = Record<string, TimeSlot[]>;

const defaultSchedule: Schedule = {
  [WeekDay.MONDAY]: [{ from: "08:00 AM", to: "06:00 PM" }],
  [WeekDay.TUESDAY]: [{ from: "08:00 AM", to: "06:00 PM" }],
  [WeekDay.WEDNESDAY]: [{ from: "08:00 AM", to: "06:00 PM" }],
  [WeekDay.THURSDAY]: [{ from: "08:00 AM", to: "06:00 PM" }],
  [WeekDay.FRIDAY]: [{ from: "08:00 AM", to: "06:00 PM" }],
  [WeekDay.SATURDAY]: [],
  [WeekDay.SUNDAY]: [],
};

const timeOptions = [
  "12:00 AM",
  "01:00 AM",
  "02:00 AM",
  "03:00 AM",
  "04:00 AM",
  "05:00 AM",
  "06:00 AM",
  "07:00 AM",
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
  "09:00 PM",
  "10:00 PM",
  "11:00 PM",
];

const ScheduleComponent = () => {
  const settings = useAppStore((state) => state.settings);
  const user = useAppStore((state) => state.user);
  const setSettings = useAppStore((state) => state.setSettings);

  const { schedulesManagement } = settings!["Phone Settings"];

  const [schedule, setSchedule] = useState<Schedule>(() => {
    return Object.keys(schedulesManagement).length > 0
      ? schedulesManagement
      : defaultSchedule;
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");

  const handleOpenModal = (day: string) => {
    setSelectedDay(day);
    setFromTime("");
    setToTime("");
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleAddTimeframe = () => {
    if (!selectedDay || !fromTime || !toTime) return;

    setSchedule((prev) => ({
      ...prev,
      [selectedDay]: [...prev[selectedDay], { from: fromTime, to: toTime }],
    }));

    handleClose();
  };

  const handleRemoveTimeframe = (day: string, index: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const onSubmit = async () => {
    try {
      if (!settings) {
        throw new Error("Missing settings!");
      }
      const existingPhoneSettings = { ...settings["Phone Settings"] };
      const { data } = await api.patch(`/settings/${user!.id}`, {
        "Phone Settings": {
          ...existingPhoneSettings,
          schedulesManagement: schedule,
        },
      });
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
      <Typography
        variant="h6"
        fontWeight="bold"
        color="primary"
        marginBottom={4}
      >
        CALL SCHEDULE
      </Typography>
      <Box
        display="flex"
        padding={2}
        border="1px solid #eee"
        borderRadius={2}
        mt={1}
        gap={1}
      >
        {Object.keys(schedule).map((day) => (
          <Box key={day} sx={{ mb: 2 }} paddingBottom={2}>
            <Typography
              display="inline-block"
              marginLeft={1}
              width="120px"
              component="span"
              fontWeight="bold"
              color="black"
            >
              {day}
            </Typography>
            {schedule[day].length > 0 ? (
              schedule[day].map((slot, index) => (
                <Chip
                  key={index}
                  label={`${slot.from} - ${slot.to}`}
                  onDelete={() => handleRemoveTimeframe(day, index)}
                  deleteIcon={<RemoveCircleOutlineIcon />}
                  sx={{ mb: 0.5 }}
                />
              ))
            ) : (
              <Typography component="span" color="black" sx={{ ml: 1 }}>
                No Schedule
              </Typography>
            )}
            <IconButton size="small" onClick={() => handleOpenModal(day)}>
              <AddCircleOutlineIcon />
            </IconButton>
          </Box>
        ))}
      </Box>
      <SimpleButton label="Save" onClick={onSubmit} />

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add Timeframe</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="From"
            fullWidth
            value={fromTime}
            onChange={(e) => setFromTime(e.target.value)}
            sx={{ mt: 2 }}
          >
            {timeOptions.map((time) => (
              <MenuItem key={time} value={time}>
                {time}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="To"
            fullWidth
            value={toTime}
            onChange={(e) => setToTime(e.target.value)}
            sx={{ mt: 2 }}
          >
            {timeOptions.map((time) => (
              <MenuItem key={time} value={time}>
                {time}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAddTimeframe} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduleComponent;
