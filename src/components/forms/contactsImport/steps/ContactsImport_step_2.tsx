import React, { useEffect, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";

import { SimpleButton } from "../../../UI/SimpleButton";

const CsvImport_step_2 = ({
  onNext,
  onPrevious,
}: {
  onNext: (data: any) => void;
  onPrevious: () => void;
}) => {
  const { control, handleSubmit } = useFormContext();
  const [fields, setFields] = useState<string[]>([]);

  useEffect(() => {
    // TO-DO - check the logic behind how to form this list
    setFields(["email", "phone", "customerID"]);
  }, []);

  const onSubmit = (data: any) => {
    console.log("Step 1 Data:", data);
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
        <Typography variant="h6">Select a Duplicate Filter Field</Typography>
        <FormControl fullWidth margin="normal">
          <InputLabel id="filter-label">Field</InputLabel>
          <Controller
            name="duplicateField"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Select labelId="filter-label" label="Field" {...field}>
                {fields.map((f) => (
                  <MenuItem key={f} value={f}>
                    {f}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </FormControl>
        <Box display="flex" flexDirection="row">
          <SimpleButton label="Next" type="submit" />
          <SimpleButton label="Previous" onClick={onPrevious} />
        </Box>
      </Box>
    </form>
  );
};

export default CsvImport_step_2;
