import { TextField } from "@mui/material";

interface CustomTextFieldProps {
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  size?: "small" | "medium";
  type?: string;
  multiline?: boolean;
  minRows?: number;
  maxRows?: number;
  InputProps?: any;
  sx?: object;
}

const CustomTextField = ({
  value,
  onChange,
  label,
  placeholder,
  error,
  helperText,
  fullWidth = false,
  size = "medium",
  type = "text",
  multiline = false,
  minRows,
  maxRows,
  InputProps = {},
  sx = {},
}: CustomTextFieldProps) => {
  return (
    <TextField
      value={value}
      onChange={onChange}
      label={label}
      placeholder={placeholder}
      error={error}
      helperText={helperText}
      fullWidth={fullWidth}
      size={size}
      variant="outlined"
      type={type}
      multiline={multiline}
      minRows={minRows}
      maxRows={maxRows}
      InputProps={InputProps}
      sx={sx}
    />
  );
};

export { CustomTextField };
