import { Controller, Control, FieldErrors } from "react-hook-form";
import {
  Box,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography,
} from "@mui/material";

import { CustomTextField } from "../UI";
import { useNestedError } from "../../utils/useNetedError";
import { Field } from "../../interfaces/form-renderer";
import { FieldError } from "../atoms";

interface RadioGroupWithNestedFieldProps {
  controllerKey: number;
  field: Field;
  control: Control<any, any>;
  errors: FieldErrors;
  selectedOption: any;
}

const RadioGroupWithNestedField = ({
  controllerKey,
  field,
  control,
  errors,
  selectedOption,
}: RadioGroupWithNestedFieldProps) => {
  return (
    <Controller
      key={controllerKey}
      name={field.name || ""}
      control={control}
      render={({ field: controllerField }) => (
        <RadioGroup {...controllerField}>
          {field.options!.map((option: any, key: any) => (
            <Box key={key}>
              <FormControlLabel
                value={option.value}
                control={<Radio color="info" />}
                label={option.label}
              />
              {option.nestedField && (
                <Controller
                  name={option.nestedField.name || ""}
                  control={control}
                  render={({ field }) => {
                    const nestedName = option.nestedField?.name || "";
                    const { error, helperText } = useNestedError(nestedName);

                    return (
                      <CustomTextField
                        value={field.value}
                        onChange={(e) => {
                          if (option.nestedField!.type === "number") {
                            const value =
                              e.target.value === ""
                                ? undefined
                                : +e.target.value;
                            field.onChange(value);
                          } else {
                            field.onChange(e.target.value);
                          }
                        }}
                        label={option.nestedField!.label}
                        type={option.nestedField!.type}
                        error={error}
                        helperText={helperText}
                        sx={{
                          mt: 1,
                          display:
                            selectedOption === option.value ? "block" : "none",
                        }}
                      />
                    );
                  }}
                />
              )}
            </Box>
          ))}
          <FieldError errors={errors} field={field} />
        </RadioGroup>
      )}
    />
  );
};

export { RadioGroupWithNestedField };
