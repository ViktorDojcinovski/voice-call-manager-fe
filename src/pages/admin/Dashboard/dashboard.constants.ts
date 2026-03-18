import type { SxProps, Theme, Palette } from "@mui/material/styles";
import type { Task } from "voice-javascript-common";

// TODO: replace with value from BE settings
export const TARGET_DURATION = "2:00 min";

// ── Shared styles ──

export const cardStyle: SxProps<Theme> = {
  borderRadius: 4,
  border: "none",
  backgroundColor: "background.paper",
  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.06)",
  transition: "all .25s ease",
  "&:hover": {
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.10)",
    transform: "translateY(-2px)",
  },
};

export const iconBoxSx: SxProps<Theme> = {
  width: 42,
  height: 42,
  borderRadius: 3,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// ── Color helpers ──

type TaskStatus = Task["status"];
type TaskPriority = NonNullable<Task["priority"]>;

export function getPriorityChipSx(
  priority: TaskPriority | undefined,
  palette: Palette,
) {
  const p = priority ?? "Medium";
  const colorMap: Record<TaskPriority, string> = {
    High: palette.error.main,
    Medium: palette.warning.main,
    Low: palette.success.main,
  };
  const color = colorMap[p];
  return { backgroundColor: `${color}18`, color };
}

export function getStatusChipSx(
  status: TaskStatus,
  d: Palette["dashboard"],
) {
  const map: Record<TaskStatus, { backgroundColor: string; color: string }> = {
    Completed: { backgroundColor: d.completedBg, color: d.completedMain },
    "In Progress": { backgroundColor: d.infoBg, color: d.infoMain },
    "To Do": { backgroundColor: d.neutralBg, color: d.neutralMain },
  };
  return map[status];
}

// ── Table columns ──

export const TABLE_COLUMNS = [
  { label: "TASK NAME", sx: { flex: 2 } as const },
  { label: "PRIORITY", sx: { width: 100, textAlign: "center" } as const },
  { label: "STATUS", sx: { width: 120, textAlign: "center" } as const },
  { label: "ACTION", sx: { width: 40, textAlign: "center" } as const },
];
