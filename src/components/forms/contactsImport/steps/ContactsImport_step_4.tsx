import { useState, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  Box,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  CircularProgress,
  Radio,
  RadioGroup,
} from "@mui/material";

import useAppStore from "../../../../store/useAppStore";
import { SimpleButton } from "../../../UI/SimpleButton";

import api from "../../../../utils/axiosInstance";
import { EXISTING_CONTACTS_ACTION } from "../../../../schemas/contacts-import/csv-file-import/validation-schema";

const fetchLists = async () => {
  try {
    const { data } = await api.get("/lists");
    console.log("lists: ", JSON.stringify(data));
    return data;
  } catch (error) {
    console.log("Error fetching lists. ", error);
  }
};

const CsvImport_step_4 = ({ onPrevious, onConfirm, isSubmitting = false }: any) => {
  const { handleSubmit, watch, control, formState: { errors }, } = useFormContext();

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

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="subtitle1">File Info</Typography>
              <Typography variant="body2">Name: {file?.name || "N/A"}</Typography>
              <Typography variant="body2">
                Header Row: {hasHeader ? "Yes" : "No"}
              </Typography>
              <Typography variant="body2">
                Duplicate Filter Field: {duplicateField}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="select-list-label">Assign to List</InputLabel>
              <Controller
                name="selectedListId"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value ?? ""}
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
                        <MenuItem key={String(list.id)} value={list.id}>
                          {list.listName}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                )}
              />
              {errors.selectedListId && (
                <Typography color="error" variant="caption" mt={1}>
                  {errors.selectedListId.message as string}
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">Existing contacts (matched by duplicate field)</FormLabel>
              <Controller
                name="existingContactsAction"
                control={control}
                defaultValue={EXISTING_CONTACTS_ACTION.SKIP}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value ?? EXISTING_CONTACTS_ACTION.SKIP}
                    onChange={(_, value) => field.onChange(value)}
                  >
                    <FormControlLabel
                      value={EXISTING_CONTACTS_ACTION.MOVE_UNASSIGNED}
                      control={<Radio />}
                      label="Move the already present but unassigned contacts to the list"
                    />
                    <FormControlLabel
                      value={EXISTING_CONTACTS_ACTION.MOVE_ALL}
                      control={<Radio />}
                      label="Move all contacts to the list, no matter the assigned status"
                    />
                    <FormControlLabel
                      value={EXISTING_CONTACTS_ACTION.SKIP}
                      control={<Radio />}
                      label="Don't do anything with the existing contacts"
                    />
                  </RadioGroup>
                )}
              />
            </FormControl>
          </Grid>
        </Grid>

        <Box display="flex" gap={2}>
          <SimpleButton type="submit" label="Submit" loading={isSubmitting} />
          <SimpleButton label="Previous" onClick={onPrevious} disabled={isSubmitting} />
        </Box>
      </Box>
    </form>
  );
};

export default CsvImport_step_4;
