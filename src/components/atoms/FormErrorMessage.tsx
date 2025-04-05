import { Box, Typography } from "@mui/material";
import { FieldErrors } from "react-hook-form";

interface FormErrorMessageProps {
  errors: FieldErrors;
}

const FormErrorMessage = ({ errors }: FormErrorMessageProps) => {
  return (
    <>
      {Object.keys(errors).length > 0 && (
        <Box mt={2} mb={2}>
          <Typography color="error" variant="body2">
            Please correct the fields highlighted below.
          </Typography>
        </Box>
      )}
    </>
  );
};

export { FormErrorMessage };
