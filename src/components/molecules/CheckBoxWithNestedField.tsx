import { Controller, Control, FieldErrors } from "react-hook-form";
import { Box, FormControlLabel, Checkbox, Typography } from "@mui/material";

import { CustomTextField } from "../UI";
import { Field } from "../../interfaces/form-renderer";
import { useNestedError } from "../../utils/useNetedError";
import { FieldError } from "../atoms";

interface CheckBoxWithNestedFieldProps {
  controllerKey: number | string;
  field: Field;
  control: Control<any, any>;
  errors: FieldErrors;
}

const CheckBoxWithNestedField = ({
  controllerKey,
  field,
  control,
  errors,
}: CheckBoxWithNestedFieldProps) => {
  return (
    <Controller
      key={`${controllerKey}.${field.name}`}
      name={field.name || ""}
      control={control}
      render={({ field: controllerField }) => {
        const isChecked = !!controllerField.value;

        return (
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  {...controllerField}
                  checked={isChecked}
                  onChange={(e) => controllerField.onChange(e.target.checked)}
                  color="info"
                />
              }
              label={field.label}
            />
            {field.nestedField && (
              <Controller
                name={field.nestedField.name || ""}
                control={control}
                render={({ field: nestedControllerField }) => {
                  const { error, helperText } = useNestedError(
                    field.nestedField?.name || ""
                  );

                  return (
                    <CustomTextField
                      {...nestedControllerField}
                      type={field.nestedField!.type}
                      label={field.nestedField!.label}
                      error={error}
                      helperText={helperText}
                      onChange={(e) => {
                        if (field.nestedField!.type === "number") {
                          const value =
                            e.target.value === "" ? undefined : +e.target.value;
                          nestedControllerField.onChange(value);
                        } else {
                          nestedControllerField.onChange(e.target.value);
                        }
                      }}
                      sx={{
                        mt: 1,
                        display: isChecked ? "block" : "none",
                      }}
                    />
                  );
                }}
              />
            )}
            <FieldError errors={errors} field={field} />
          </Box>
        );
      }}
    />
  );
};

export { CheckBoxWithNestedField };
