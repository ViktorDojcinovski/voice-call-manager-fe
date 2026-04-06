import { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Checkbox,
  IconButton,
  Typography,
  Stack,
} from "@mui/material";
import { Delete, Add, DragIndicator } from "@mui/icons-material";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

import { SimpleButton, CustomTextField } from "../UI";
import useAppStore from "../../store/useAppStore";
import { CallResult } from "../../types/call-results";
import api from "../../utils/axiosInstance";
import { UserRole } from "voice-javascript-common";

const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substr(2, 9);

type SaveState = "idle" | "loading" | "success";

export default function CallResultsManager() {
  const user = useAppStore((s) => s.user);
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);

  const isReadOnly = user?.role !== UserRole.ADMIN;

  const [callResults, setCallResults] = useState<CallResult[]>([]);
  const [newResult, setNewResult] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Clone on mount/update
  useEffect(() => {
    if (settings?.["Phone Settings"]?.callResults) {
      const cloned = settings["Phone Settings"].callResults.map(
        (item: CallResult) => ({
          id: item.id || generateId(),
          label: item.label || "",
          checked: !!item.checked,
          considerPositive: !!item.considerPositive,
          marksBadNumber: !!item.marksBadNumber,
        })
      );
      setCallResults(cloned);
    }
  }, [settings]);

  const toggleCheckbox = (id: string) => {
    setCallResults((prev) =>
      prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it))
    );
  };

  const togglePositive = (id: string) => {
    setCallResults((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, considerPositive: !it.considerPositive } : it
      )
    );
  };

  /** At most one row may be the designated "bad number" disposition. */
  const setBadNumberRow = (id: string, checked: boolean) => {
    setCallResults((prev) =>
      prev.map((it) => {
        if (it.id === id) return { ...it, marksBadNumber: checked };
        return checked ? { ...it, marksBadNumber: false } : it;
      })
    );
  };

  const handleAdd = () => {
    if (!newResult.trim()) return;
    setCallResults((prev) => [
      ...prev,
      {
        id: generateId(),
        label: newResult,
        checked: false,
        considerPositive: false,
        marksBadNumber: false,
      },
    ]);
    setNewResult("");
  };

  const handleDelete = (id: string) => {
    setCallResults((prev) => prev.filter((it) => it.id !== id));
  };

  const handleEdit = (id: string, label: string) => {
    setCallResults((prev) =>
      prev.map((it) => (it.id === id ? { ...it, label } : it))
    );
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;
    setCallResults((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  const onSubmit = async () => {
    if (saveState === "loading") return; // block double-clicks
    try {
      if (!settings) throw new Error("Missing settings!");

      setSaveState("loading");

      const existingPhoneSettings = { ...settings["Phone Settings"] };
      const payloadResults = callResults.map(
        ({ label, checked, considerPositive, marksBadNumber }) => ({
          label,
          checked,
          considerPositive,
          marksBadNumber: !!marksBadNumber,
        })
      );
      const { data } = await api.patch(`/settings`, {
        "Phone Settings": { ...existingPhoneSettings, callResults: payloadResults },
      });

      setSettings(data);

      // success flash (green) for 3s, then fade back
      setSaveState("success");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err) {
      console.error(err);
      setSaveState("idle"); // or keep separate error state if you prefer
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" color="info" mb={4}>
        CALL RESULTS LIST
        {isReadOnly && (
          <Typography variant="body2" color="textSecondary" mb={2}>
            You do not have permission to edit call results.
          </Typography>
        )}
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
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="call-results">
            {(provided) => (
              <Box ref={provided.innerRef} {...provided.droppableProps}>
                {callResults.map((item, index) => (
                  <Draggable
                    key={item.id}
                    draggableId={item.id}
                    index={index}
                    isDragDisabled={isReadOnly || saveState === "loading"}
                  >
                    {(provided, snapshot) => (
                      <Stack
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        mb={1}
                        sx={{
                          bgcolor: snapshot.isDragging
                            ? "action.hover"
                            : "transparent",
                          borderRadius: 1,
                        }}
                      >
                        <IconButton
                          {...provided.dragHandleProps}
                          size="small"
                          sx={{ cursor: "grab" }}
                          disabled={isReadOnly || saveState === "loading"}
                        >
                          <DragIndicator fontSize="small" />
                        </IconButton>
                        <Checkbox
                          checked={item.checked}
                          onChange={() => toggleCheckbox(item.id)}
                          color="info"
                          disabled={isReadOnly || saveState === "loading"}
                        />
                        <TextField
                          size="small"
                          variant="outlined"
                          value={item.label}
                          onChange={(e) => handleEdit(item.id, e.target.value)}
                          sx={{ flexGrow: 1 }}
                          disabled={isReadOnly || saveState === "loading"}
                        />
                        <Typography variant="body2">
                          Consider connection
                        </Typography>
                        <Checkbox
                          checked={item.considerPositive || false}
                          onChange={() => togglePositive(item.id)}
                          color="success"
                          disabled={isReadOnly || saveState === "loading"}
                        />
                        <Typography variant="body2" noWrap>
                          Bad number
                        </Typography>
                        <Checkbox
                          checked={item.marksBadNumber || false}
                          onChange={(_, c) => setBadNumberRow(item.id, c)}
                          color="error"
                          disabled={isReadOnly || saveState === "loading"}
                        />
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(item.id)}
                          disabled={isReadOnly || saveState === "loading"}
                        >
                          <Delete />
                        </IconButton>
                      </Stack>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>

        <Stack direction="row" spacing={1} mt={3}>
          <CustomTextField
            placeholder="Add Call Result"
            value={newResult}
            onChange={(e) => setNewResult(e.target.value)}
          />
          <IconButton
            color="info"
            onClick={handleAdd}
            disabled={isReadOnly || saveState === "loading"}
          >
            <Add />
          </IconButton>
        </Stack>
      </Box>

      <SimpleButton
        label="Save"
        onClick={onSubmit}
        loading={saveState === "loading"}
        success={saveState === "success"}
        disabled={isReadOnly || saveState === "loading"}
        sx={{ mt: 2 }}
      />
    </Box>
  );
}
