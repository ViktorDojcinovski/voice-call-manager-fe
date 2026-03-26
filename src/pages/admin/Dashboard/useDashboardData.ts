import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Task } from "voice-javascript-common";

import api from "../../../utils/axiosInstance";
import useAppStore from "../../../store/useAppStore";

export type PresetPeriod = "today" | "week" | "month";
export type Period = PresetPeriod | string; // string = "YYYY-MM-DD" date

export function useDashboardData() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, callStats, fetchCallStats, setSettings } = useAppStore();

  const [period, setPeriod] = useState<Period>("today");
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groupedTasks, setGroupedTasks] = useState<{
    "To Do": Task[];
    "In Progress": Task[];
    Completed: Task[];
  }>({
    "To Do": [],
    "In Progress": [],
    Completed: [],
  });

  useEffect(() => {
    if (!user) return;
    api
      .get(`/settings`)
      .then(({ data }) => setSettings(data))
      .catch((err) => console.error("[dashboard] settings:", err));
  }, [user, setSettings]);

  useEffect(() => {
    if (fetchCallStats) {
      fetchCallStats(period).catch((err) => {
        console.error("[dashboard] Failed to fetch call stats:", err);
      });
    }
  }, [fetchCallStats, period]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await api.get("/tasks");

        const grouped = {
          "To Do": [] as Task[],
          "In Progress": [] as Task[],
          Completed: [] as Task[],
        };

        if (Array.isArray(data)) {
          data.forEach((task: Task) => {
            if (grouped[task.status]) {
              grouped[task.status].push(task);
            }
          });
        }

        setTasks(data || []);
        setGroupedTasks(grouped);
      } catch (err) {
        console.error("[dashboard] Failed to fetch tasks:", err);
        setTasks([]);
        setGroupedTasks({
          "To Do": [],
          "In Progress": [],
          Completed: [],
        });
      }
    };

    fetchTasks();
  }, []);

  const kpi = useMemo(() => {
    if (!callStats) return { calls: 0, satisfaction: 0, duration: 0 };
    return {
      calls: callStats.callsTotal,
      satisfaction: callStats.satisfactionScore ?? 0,
      duration: callStats.avgDurationMin ?? 0,
    };
  }, [callStats]);

  const outcomeData = useMemo(() => {
    const total = callStats?.callsTotal || 0;
    const connected = callStats?.callsConnected || 0;
    const noAnswer =
      callStats?.callsNoAnswer !== undefined
        ? callStats.callsNoAnswer
        : Math.max(0, total - connected);

    return [
      {
        name: "Connections",
        value: connected,
        color: theme.palette.success.main,
      },
      {
        name: "No answer",
        value: noAnswer,
        color: theme.palette.error.main,
      },
    ];
  }, [callStats, theme.palette]);

  return { user, kpi, tasks, groupedTasks, outcomeData, navigate, period, setPeriod, customDate, setCustomDate };
}
