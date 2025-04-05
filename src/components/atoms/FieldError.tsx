import { Typography } from "@mui/material";
import { FieldErrors } from "react-hook-form";

import { Field } from "../../interfaces/form-renderer";

interface FieldErrorProps {
  errors: FieldErrors;
  field: Field;
}

const FieldError = ({ errors, field }: FieldErrorProps) => {
  return (
    <>
      {errors?.[field.name || ""]?.message && (
        <Typography color="error" variant="caption">
          {errors[field.name || ""]?.message as string}
        </Typography>
      )}
    </>
  );
};

export { FieldError };
