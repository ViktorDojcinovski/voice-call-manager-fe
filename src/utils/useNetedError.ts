import { useFormContext } from "react-hook-form";
import get from "lodash/get";

export const useNestedError = (name: string) => {
  const {
    formState: { errors },
  } = useFormContext();

  const fieldError = get(errors, name);
  const error = !!fieldError;
  const helperText =
    typeof fieldError?.message === "string" ? fieldError.message : "";

  return { error, helperText };
};
