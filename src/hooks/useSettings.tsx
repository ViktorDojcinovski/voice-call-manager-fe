import { useState } from "react";

import useAppStore from "../store/useAppStore";
import { translateToTitleCase } from "../utils/translateToTitle";

export const useSettings = () => {
  // Settings

  type SelectedType = {
    parent: string;
    child: string;
  } | null;

  const settings = useAppStore((state) => state.settings) as Record<
    string,
    Record<string, any>
  > | null;

  // Map original keys to display keys for lookup
  const keyMap = settings
    ? Object.keys(settings)
        .filter((key) => {
          const lowerKey = key.toLowerCase().replace(/\s+/g, "");
          return (
            key !== "user" &&
            key !== "id" &&
            !["createdat", "updatedat", "created_at", "updated_at"].includes(lowerKey) &&
            !["__v", "notificationssettings", "notifications_settings"].includes(lowerKey)
          );
        })
        .reduce((acc, key) => {
          acc[translateToTitleCase(key)] = key;
          return acc;
        }, {} as Record<string, string>)
    : {};

  const settingsKeys = Object.keys(keyMap);

  const [selected, setSelected] = useState<SelectedType>({
    parent: "Phone Settings",
    child: "powerDialerManagement",
  });

  const handleChildClick = (parent: string, child: string) => {
    setSelected({ parent, child });
  };

  return {
    selected,
    settingsKeys,
    settings,
    handleChildClick,
    keyMap, // Map display keys back to original keys
  };
};
