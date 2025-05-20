import { Menu, MenuItem } from "@mui/material";
import { TelephonyConnection } from "../constants";

const ConnectionMenu = ({ anchorEl, open, onClose, onSelect }: any) => (
  <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
    {Object.values(TelephonyConnection).map((option) => (
      <MenuItem key={option} onClick={() => onSelect(option)}>
        {option}
      </MenuItem>
    ))}
  </Menu>
);

export default ConnectionMenu;
