import { create } from "zustand";

import api from "../utils/axiosInstance";

// Define types for the state
interface AppState {
  user: { id: string; name: string } | null;
  settings: Record<string, any> | null;
  lists: Record<string, any>[] | null;

  // Actions
  setUser: (user: AppState["user"]) => void;
  setSettings: (settings: AppState["settings"]) => void;
  setLists: (lists: AppState["lists"]) => void;
  getListById: (id: string) => Record<string, any>;
  fetchLists: () => void;
  updateList: (id: string, updatedData: Partial<any>) => Promise<any>;
  deleteList: (id: string) => void;
  resetStore: () => void;
}

const useAppStore = create<AppState>((set) => ({
  user: null,
  settings: null,
  lists: null,

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

  resetStore: () => set({ user: null, settings: null, lists: null }),
}));

export default useAppStore;
