import { useState, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  Box,
  Typography,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";

import useAppStore from "../../../../store/useAppStore";
import { SimpleButton } from "../../../UI/SimpleButton";

import api from "../../../../utils/axiosInstance";

const fetchLists = async () => {
  try {
    const { data } = await api.get("/lists");
    console.log("lists: ", JSON.stringify(data));
    return data;
  } catch (error) {
    console.log("Error fetching lists. ", error);
  }
};

const CsvImport_step_4 = ({ onPrevious, onConfirm }: any) => {
  const { handleSubmit, watch, control } = useFormContext();

  const file = watch("file");
  const hasHeader = watch("hasHeader");
  const duplicateField = watch("duplicateField");

  const [lists, setLists] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState<boolean>(false);

  const settings = useAppStore((state) => state.settings);
  const { integrationSettings } = settings!["Phone Settings"];

  const getFieldNameById = (id: string) => {
    const found = integrationSettings.leads.find((lead: any) => lead.id === id);
    return found ? found.name : "Unmapped";
  };

  useEffect(() => {
    const loadLists = async () => {
      setLoadingLists(true);
      try {
        const fetchedLists = await fetchLists();
        setLists(fetchedLists);
      } catch (error) {
        console.error("Failed to load lists", error);
      } finally {
        setLoadingLists(false);
      }
    };
    loadLists();
  }, []);

  return (
    <form onSubmit={handleSubmit(onConfirm)}>
      <Box
        display="flex"
        flexDirection="column"
        padding={2}
        border="1px solid #eee"
        borderRadius={2}
        mt={1}
        gap={1}
      >
        <Typography variant="h6" gutterBottom>
          Review & Confirm Import
        </Typography>

        <Box mb={2}>
          <Typography variant="subtitle1">File Info</Typography>
          <Typography variant="body2">Name: {file?.name || "N/A"}</Typography>
          <Typography variant="body2">
            Header Row: {hasHeader ? "Yes" : "No"}
          </Typography>
          <Typography variant="body2">
            Duplicate Filter Field: {duplicateField}
          </Typography>
        </Box>

        <Divider />

        <FormControl fullWidth>
          <InputLabel id="select-list-label">Assign to List</InputLabel>
          <Controller
            name="selectedListId"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Select
                {...field}
                labelId="select-list-label"
                label="Assign to List"
                disabled={loadingLists}
              >
                {loadingLists ? (
                  <MenuItem value="">
                    <CircularProgress size={20} />
                  </MenuItem>
                ) : (
                  lists.map((list) => (
                    <MenuItem key={list.id} value={list.id}>
                      {list.listName}
                    </MenuItem>
                  ))
                )}
              </Select>
            )}
          />
        </FormControl>

        <Box display="flex" gap={2}>
          <SimpleButton type="submit" label="Submit" />
          <SimpleButton label="Previous" onClick={onPrevious} />
        </Box>
      </Box>
    </form>
  );
};

export default CsvImport_step_4;
