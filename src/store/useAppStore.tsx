import { create } from "zustand";

// Define types for the state
interface AppState {
  user: { id: string; name: string } | null;
  settings: Record<string, any> | null;

  // Actions
  setUser: (user: AppState["user"]) => void;
  setSettings: (settings: AppState["settings"]) => void;
  resetStore: () => void;
}

const useAppStore = create<AppState>((set) => ({
  user: null,
  settings: null,

  // Actions
  setUser: (user) => set({ user }),
  setSettings: (settings) => set({ settings }),

  resetStore: () => set({ user: null, settings: null }),
}));

export default useAppStore;
