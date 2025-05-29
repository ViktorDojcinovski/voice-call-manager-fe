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

const drawerWidth = 380;

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
        height: "calc(100vh - 120px)",
        p: 0,
        flex: 1,
        overflow: "hidden",
      }}
    >
      <ResizableBox
        className="hide-scrollbar"
        width={drawerWidth}
        height={Infinity}
        minConstraints={[380, Infinity]}
        maxConstraints={[500, Infinity]}
        resizeHandles={["e"]}
        style={{
          height: "100%",
          backgroundColor: theme.palette.background.default,
          borderRight: `1px solid ${theme.palette.divider}`,
          display: "flex",
          flexDirection: "column",
          paddingBottom: 0,
        }}
      >
        <Box className="hide-scrollbar" sx={{ flex: 1, overflowY: "auto" }}>
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
        </Box>
      </ResizableBox>

      {/* Drawer-aware content */}
      <Box
        className="hide-scrollbar"
        sx={{
          flex: 1,
          overflowY: "auto",
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
