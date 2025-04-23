import { useEffect, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
} from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import Papa from "papaparse";

import useAppStore from "../../../../store/useAppStore";
import { SimpleButton } from "../../../UI";

const CsvImport_step_3 = ({
  onNext,
  onPrevious,
}: {
  onNext: (data: any) => void;
  onPrevious: () => void;
}) => {
  const { control, handleSubmit, watch } = useFormContext();
  const [csvColumns, setCsvColumns] = useState<string[]>([]);

  const settings = useAppStore((state) => state.settings);
  const { integrationSettings } = settings!["Phone Settings"];

  const hasHeader = watch("hasHeader");
  const selectedFile = watch("file");

  useEffect(() => {
    if (selectedFile) {
      Papa.parse(selectedFile, {
        header: hasHeader,
        preview: 1, // only read the first row
        skipEmptyLines: true,
        complete: (results: any) => {
          if (hasHeader) {
            // If hasHeader is true, PapaParse gives data as object
            const headers = Object.keys(results.data[0] || {});
            setCsvColumns(headers);
          } else {
            // If no header, we get values only
            const firstRow = results.data[0];
            const headers = firstRow.map(
              (_: any, index: number) => `Column ${index + 1}`
            );
            setCsvColumns(headers);
          }
        },
        error: (error: any) => {
          console.error("Error parsing CSV:", error);
        },
      });
    }
  }, [selectedFile, hasHeader]);

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
        <Typography variant="h6">Map CSV Columns to Data Fields</Typography>
        <Grid container spacing={2}>
          {csvColumns.map((col, index) => (
            <Grid
              container
              item
              xs={12}
              key={index}
              alignItems="center"
              spacing={2}
            >
              {/* Column label */}
              <Grid item xs={3}>
                <Typography variant="body1">{col}</Typography>
              </Grid>

              {/* Arrow icon */}
              <Grid item xs={1} display="flex" justifyContent="center">
                <KeyboardArrowRightIcon />
              </Grid>

              {/* Select input */}
              <Grid item xs={8}>
                <FormControl fullWidth>
                  <InputLabel id={`mapping-${index}-label`}>Field</InputLabel>
                  <Controller
                    name={`mapping.${col}`}
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <Select
                        labelId={`mapping-${index}-label`}
                        label="Field"
                        {...field}
                      >
                        {integrationSettings.leads.map((lead: any) => (
                          <MenuItem key={lead._id} value={lead.id}>
                            {lead.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          ))}
        </Grid>
        <Box display="flex" flexDirection="row">
          <SimpleButton label="Next" type="submit" />
          <SimpleButton label="Previous" onClick={onPrevious} />
        </Box>
      </Box>
    </form>
  );
};

export default CsvImport_step_3;
