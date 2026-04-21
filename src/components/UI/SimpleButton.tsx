import { Button, ButtonProps, CircularProgress } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface SimpleButtonProps extends Omit<ButtonProps, "children"> {
  label: string;
  loading?: boolean;
  success?: boolean;
}

export const SimpleButton: React.FC<SimpleButtonProps> = ({
  label,
  loading = false,
  success = false,
  sx,
  variant = "contained",
  color = "info",
  disabled,
  ...rest
}) => {
  return (
    <Button
      variant={variant}
      fullWidth={false}
      color={success ? "success" : color}
      disabled={disabled || loading}
      sx={{
        mt: 1,
        mr: 1,
        alignSelf: "flex-start",
        ...sx,
      }}
      {...rest}
    >
      {loading ? (
        <>
          <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
          {label}
        </>
      ) : success ? (
        <>
          <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
          {label}
        </>
      ) : (
        label
      )}
    </Button>
  );
};
