import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  styled,
} from "@mui/material";
import { AudioDevice } from "../../../interfaces/audio-device";

interface AudioDevicesListProps {
  devices: AudioDevice[] | null;
}

const DeviceListItem = styled(ListItem)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.action.hover,
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1.5),
  boxShadow: theme.shadows[1],
}));

const AudioDevicesList = ({ devices }: AudioDevicesListProps) => {
  const activeDevices = devices?.filter((device) => device.isActive) || [];

  return (
    <Box>
      {activeDevices.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Active Devices
          </Typography>
          <List dense disablePadding>
            {activeDevices.map((device, i) => (
              <DeviceListItem key={i}>
                <ListItemText
                  primary={device.label}
                  primaryTypographyProps={{ fontSize: 14 }}
                />
              </DeviceListItem>
            ))}
          </List>
          <Divider sx={{ my: 3 }} />
        </>
      )}
    </Box>
  );
};

export default AudioDevicesList;
