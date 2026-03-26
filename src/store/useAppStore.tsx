import { create } from "zustand";

import api from "../utils/axiosInstance";

// Define types for the state
export interface CallStat {
  callsTotal: number;
  callsConnected: number;
  /** Dials with no connection (e.g. no-answer, busy, failed) — total − connections */
  callsNoAnswer?: number;
  satisfactionScore: number;
  avgDurationMin: number;
  followUps: number;
  callsSuccessful: number;
  total: number;
  period: "today" | "week" | "month";
  dailyDistribution: { name: string; calls: number }[];
  leadInsights: { enterprise: number; smb: number };
  timeOnCalls: string;
  enterprisePercent: number;
  smbPercent: number;
}

interface AppState {
  // TO-DO more intuitive is 'me' instead of 'user'
  user: { id: string; name: string; firstName?: string; lastName?: string; role?: string; tenantId?: string; email?: string } | null;
  settings: Record<string, any> | null;
  lists: Record<string, any>[] | null;
  callStats: CallStat | null;

  // Actions
  setUser: (user: AppState["user"]) => void;
  setSettings: (settings: AppState["settings"]) => void;
  setLists: (lists: AppState["lists"]) => void;
  getListById: (id: string) => Record<string, any>;
  fetchLists: () => void;
  updateList: (id: string, updatedData: Partial<any>) => Promise<any>;
  deleteList: (id: string) => void;
  setCallStats: (cs: CallStat | null) => void;
  fetchCallStats: (period?: string) => Promise<void>;

  // Reset
  resetStore: () => void;
}

const useAppStore = create<AppState>((set) => ({
  user: null,
  settings: null,
  lists: null,
  callStats: null,

  // Actions
  setUser: (user) => set({ user }),
  setSettings: (settings) => set({ settings }),
  setLists: (lists) => set({ lists }),
  getListById: async (id: string) => {
    try {
      const { data } = await api.get(`/lists/${id}`);
      return data;
    } catch (error) {
      console.error("Failed to get list by ID:", error);
      return null;
    }
  },
  fetchLists: async () => {
    try {
      const { data } = await api.get("/lists");
      set({ lists: data });
    } catch (error) {
      console.error("Error fetching lists:", error);
    }
  },
  updateList: async (id: string, updatedData: Partial<any>) => {
    try {
      const { data } = await api.put(`/lists/${id}`, updatedData);
      set((state) => ({
        lists:
          state.lists?.map((list) => (list.id === id ? data : list)) ?? null,
      }));
      return data;
    } catch (error) {
      console.error("Failed to update list:", error);
      return null;
    }
  },
  deleteList: async (id: string) => {
    try {
      await api.delete(`/lists/${id}`);
      set((state) => ({
        lists: state.lists?.filter((list) => list.id !== id) ?? null,
      }));
    } catch (error) {
      console.error("Error deleting a list:", error);
    }
  },
  setCallStats: (callStats) => set({ callStats }),

  fetchCallStats: async (period = "today") => {
    try {
      const { data } = await api.get("/call-logs/stats", {
        params: { period },
      });
      set({ callStats: data });
    } catch (err) {
      console.error("Failed to fetch call stats:", err);
      set({ callStats: null });
    }
  },

  resetStore: () => set({ user: null, settings: null, lists: null }),
}));

export default useAppStore;
