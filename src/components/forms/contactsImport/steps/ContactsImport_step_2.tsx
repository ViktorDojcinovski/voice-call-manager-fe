import React, { useEffect, useMemo } from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  Autocomplete,
  Box,
  FormControl,
  Grid,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import { SimpleButton } from "../../../UI/SimpleButton";
import { TIMEZONE_MODE } from "../../../../schemas/contacts-import/csv-file-import/validation-schema";
import { CONTACT_IMPORT_PHONE_FIELD_IDS } from "../../../../schemas/contacts-import/csv-file-import/phone-field-ids";
import { getAllTimezones } from "../../../../utils/timezones";

const DUPLICATE_FILTER_FIELDS = ["email", "customerID"] as const;

const CsvImport_step_2 = ({
  onNext,
  onPrevious,
}: {
  onNext: (data: any) => void;
  onPrevious: () => void;
}) => {
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useFormContext();
  const timezones = useMemo(() => getAllTimezones(), []);

  const timezoneMode = watch("timezoneMode");
  const duplicateField = watch("duplicateField");

  useEffect(() => {
    if (duplicateField && CONTACT_IMPORT_PHONE_FIELD_IDS.has(duplicateField)) {
      setValue("duplicateField", "");
    }
  }, [duplicateField, setValue]);

  const onSubmit = (data: any) => {
    console.log("Step 2 Data:", data);
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box
        display="flex"
        flexDirection="column"
        padding={2}
        border="1px solid #eee"
        borderRadius={2}
        mt={1}
        gap={1}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Configurations
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Duplicate Filter Field
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Timezone
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} />
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="filter-label">Field</InputLabel>
              <Controller
                name="duplicateField"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Select labelId="filter-label" label="Field" {...field} value={field.value ?? ""}>
                    {DUPLICATE_FILTER_FIELDS.map((f) => (
                      <MenuItem key={String(f)} value={f}>
                        {f}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.duplicateField && (
                <Typography color="error" mt={1} variant="caption">
                  {errors.duplicateField.message as string}
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" flexDirection="column" gap={2}>
              <FormControl fullWidth>
                <InputLabel id="timezone-mode-label">Timezone source</InputLabel>
                <Controller
                  name="timezoneMode"
                  control={control}
                  defaultValue={TIMEZONE_MODE.EMPTY}
                  render={({ field }) => (
                    <Select
                      labelId="timezone-mode-label"
                      label="Timezone source"
                      {...field}
                      value={field.value ?? TIMEZONE_MODE.EMPTY}
                    >
                      <MenuItem value={TIMEZONE_MODE.EMPTY}>
                        <em>—</em>
                      </MenuItem>
                      <MenuItem value={TIMEZONE_MODE.USE_FROM_CSV_MAP}>
                        Use from CSV map
                      </MenuItem>
                      <MenuItem value={TIMEZONE_MODE.AUTO_DETECT}>
                        Auto-detect timezone
                      </MenuItem>
                      <MenuItem value={TIMEZONE_MODE.MANUAL}>
                        Set manually
                      </MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
              {timezoneMode === TIMEZONE_MODE.MANUAL && (
                <Controller
                  name="timezoneManual"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <Autocomplete
                      options={timezones}
                      getOptionLabel={(option) => option}
                      value={field.value || null}
                      onChange={(_, newValue) => field.onChange(newValue ?? "")}
                      isOptionEqualToValue={(option, value) => option === value}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select timezone"
                          placeholder="Search timezone..."
                          error={!!errors.timezoneManual}
                          helperText={
                            errors.timezoneManual
                              ? (errors.timezoneManual as { message?: string }).message
                              : undefined
                          }
                        />
                      )}
                    />
                  )}
                />
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={4} />
        </Grid>

        <Box display="flex" flexDirection="row">
          <SimpleButton label="Next" type="submit" />
          <SimpleButton label="Previous" onClick={onPrevious} />
        </Box>
      </Box>
    </form>
  );
};

export default CsvImport_step_2;
