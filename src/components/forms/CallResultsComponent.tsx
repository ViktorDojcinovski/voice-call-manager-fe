import { useState } from "react";
import {
  Box,
  TextField,
  Checkbox,
  IconButton,
  Typography,
  Stack,
} from "@mui/material";
import { Delete, Add } from "@mui/icons-material";

import { SimpleButton, CustomTextField } from "../UI";
import useAppStore from "../../store/useAppStore";
import api from "../../utils/axiosInstance";

type CallResult = {
  id: string;
  label: string;
  checked: boolean;
};

export default function CallResultsManager() {
  const settings = useAppStore((state) => state.settings);
  const user = useAppStore((state) => state.user);
  const setSettings = useAppStore((state) => state.setSettings);
  const [callResults, setCallResults] = useState<CallResult[]>(
    settings ? settings["Phone Settings"].callResults : []
  );
  const [newResult, setNewResult] = useState("");

  const toggleCheckbox = (id: string) => {
    setCallResults((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleAdd = () => {
    if (!newResult.trim()) return;
    setCallResults((prev) => [
      ...prev,
      { id: Date.now().toString(), label: newResult, checked: false },
    ]);
    setNewResult("");
  };

  const handleDelete = (id: string) => {
    setCallResults((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEdit = (id: string, label: string) => {
    setCallResults((prev) =>
      prev.map((item) => (item.id === id ? { ...item, label } : item))
    );
  };

  const onSubmit = async () => {
    try {
      if (!settings) {
        throw new Error("Missing settings!");
      }
      const existingPhoneSettings = { ...settings["Phone Settings"] };
      const { data } = await api.patch(`/settings/${user!.id}`, {
        "Phone Settings": {
          ...existingPhoneSettings,
          callResults,
        },
      });
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" color="primary" mb={4}>
        CALL RESULTS LIST
      </Typography>
      <Box
        display="flex"
        flexDirection="column"
        padding={2}
        border="1px solid #eee"
        borderRadius={2}
        mt={1}
        width="70%"
        gap={1}
      >
        {callResults.map((item, index) => (
          <Stack
            key={item.id || index}
            direction="row"
            spacing={1}
            alignItems="center"
            mb={1}
          >
            <Checkbox
              checked={item.checked}
              onChange={() => toggleCheckbox(item.id)}
            />
            <TextField
              size="small"
              variant="outlined"
              value={item.label}
              onChange={(e) => handleEdit(item.id, e.target.value)}
              sx={{ flexGrow: 1 }}
            />
            <IconButton color="error" onClick={() => handleDelete(item.id)}>
              <Delete />
            </IconButton>
          </Stack>
        ))}
        <Stack direction="row" spacing={1} mt={3}>
          <CustomTextField
            placeholder="Add Call Result"
            value={newResult}
            onChange={(e) => setNewResult(e.target.value)}
          />
          <IconButton color="primary" onClick={handleAdd}>
            <Add />
          </IconButton>
        </Stack>
      </Box>

      <SimpleButton label="Save" onClick={onSubmit} />
    </Box>
  );
}
