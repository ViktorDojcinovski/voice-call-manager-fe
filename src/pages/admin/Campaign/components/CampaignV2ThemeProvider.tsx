import { useMemo, ReactNode } from "react";
import {
  ThemeProvider,
  createTheme,
  useTheme,
} from "@mui/material/styles";
import { campaignV2 } from "./campaignV2Tokens";

export function CampaignV2ThemeProvider({ children }: { children: ReactNode }) {
  const outer = useTheme();
  const inner = useMemo(
    () =>
      createTheme(outer, {
        palette: {
          primary: {
            main: campaignV2.accent,
            dark: campaignV2.accentDark,
            light: campaignV2.accentLight,
            contrastText: "#ffffff",
          },
        },
        components: {
          MuiTab: {
            styleOverrides: {
              root: {
                textTransform: "none",
                fontWeight: 600,
                minHeight: 48,
              },
            },
          },
        },
      }),
    [outer],
  );

  return <ThemeProvider theme={inner}>{children}</ThemeProvider>;
}
