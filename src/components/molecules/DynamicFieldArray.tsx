import {
  useFieldArray,
  Controller,
  Control,
  FieldErrors,
} from "react-hook-form";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";

import { SimpleButton } from "../UI";

interface DynamicFieldConfig {
  type: "dynamic";
  name: string;
  label: string;
  addButtonLabel: string;
  nestedFields: {
    type: string;
    name: string;
    label: string;
    placeholder?: string;
    options?: { label: string; value: string | boolean }[]; // for select fields
  }[];
}

interface DynamicFieldArrayProps {
  fieldConfig: DynamicFieldConfig;
  control: Control<any>;
  errors: FieldErrors<any>;
}

const DynamicFieldArray: React.FC<DynamicFieldArrayProps> = ({
  fieldConfig,
  control,
  errors,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldConfig.name,
  });

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {fieldConfig.label}
      </Typography>
      {fields.map((item, index) => (
        <Box
          key={item.id}
          sx={{ border: "1px solid #ccc", borderRadius: 2, p: 2, mb: 2 }}
        >
          <Grid container spacing={2}>
            {fieldConfig.nestedFields.map((nestedField, idx) => {
              const fieldName = `${fieldConfig.name}[${index}].${nestedField.name}`;
              const nestedError = (
                errors?.[fieldConfig.name] as unknown as any[]
              )?.[index]?.[nestedField.name];
              switch (nestedField.type) {
                case "text":
                  return (
                    <Grid item xs={12} sm={4} key={idx}>
                      <Controller
                        name={fieldName}
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label={nestedField.label}
                            placeholder={nestedField.placeholder}
                            fullWidth
                            error={Boolean(nestedError)}
                            helperText={nestedError?.message}
                          />
                        )}
                      />
                    </Grid>
                  );
                case "select":
                  return (
                    <Grid item xs={12} sm={4} key={idx}>
                      <Controller
                        name={fieldName}
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            fullWidth
                            label={nestedField.label}
                          >
                            {nestedField.options?.map((option, j) => (
                              <MenuItem
                                key={j}
                                value={option.value as string | number}
                              >
                                {option.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </Grid>
                  );
                default:
                  return null;
              }
            })}
          </Grid>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => remove(index)}
            sx={{ mt: 1 }}
          >
            Remove
          </Button>
        </Box>
      ))}
      <SimpleButton
        label={fieldConfig.addButtonLabel}
        variant="outlined"
        onClick={() => append({})}
      />
    </Box>
  );
};

export { DynamicFieldArray };
