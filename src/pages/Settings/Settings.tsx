import { useState } from "react";
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ResizableBox } from "react-resizable";

import { settingsComponentRegistry } from "../../registry/settings-component-registry";
import SettingsTypeWrapper from "../../components/SettingsTypeWrapper";
import useAppStore from "../../store/useAppStore";

import "react-resizable/css/styles.css";
import "./Settings.css";
import { translateToTitleCase } from "../../utils/translateToTitle";

const drawerWidth = 340;

type SelectedType = {
  parent: string;
  child: string;
} | null;

const Settings: React.FC = () => {
  const theme = useTheme();
  const settings = useAppStore((state) => state.settings) as Record<
    string,
    Record<string, any>
  > | null;

  const settingsKeys = settings
    ? Object.keys(settings)
        .filter((key) => key !== "user" && key !== "id")
        .map((key) => translateToTitleCase(key))
    : [];

  const [selected, setSelected] = useState<SelectedType>(null);

  const handleChildClick = (parent: string, child: string) => {
    setSelected({ parent, child });
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "calc(100vh - 64px)",
        p: 0,
        flex: 1,
        overflow: "hidden",
      }}
    >
      <ResizableBox
        width={drawerWidth}
        height={Infinity}
        minConstraints={[300, Infinity]}
        maxConstraints={[500, Infinity]}
        resizeHandles={["e"]}
        style={{
          height: "100%",
          overflowY: "auto",
          backgroundColor: theme.palette.background.default,
          borderRight: `1px solid ${theme.palette.divider}`,
        }}
      >
        {settingsKeys.map((category) => (
          <Accordion key={category} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="bold">
                {category}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List disablePadding>
                {Object.keys(settings![category]).map((subKey) => (
                  <ListItemButton
                    key={subKey}
                    selected={
                      selected?.parent === category &&
                      selected?.child === subKey
                    }
                    onClick={() => handleChildClick(category, subKey)}
                    sx={{
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      pl: 3,
                      pr: 2,
                    }}
                  >
                    <ListItemText primary={translateToTitleCase(subKey)} />
                  </ListItemButton>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </ResizableBox>

      {/* Drawer-aware content */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: 4,
          py: 3,
          bgcolor: theme.palette.background.paper,
        }}
      >
        {settings &&
          selected &&
          (() => {
            const Component =
              settingsComponentRegistry[selected.parent]?.[selected.child];
            if (!Component) return <Typography>{"Nothing found"}</Typography>;
            return (
              <SettingsTypeWrapper
                settingsName={selected.child}
                data={settings[selected.parent][selected.child]}
                Component={Component}
              />
            );
          })()}
      </Box>
    </Box>
  );
};

export default Settings;
