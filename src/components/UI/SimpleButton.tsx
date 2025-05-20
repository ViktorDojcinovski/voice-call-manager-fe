import { Button, ButtonProps } from "@mui/material";

interface SimpleButtonProps extends Omit<ButtonProps, "children"> {
  label: string;
}

const SimpleButton: React.FC<SimpleButtonProps> = ({
  label,
  sx,
  variant = "contained",
  ...rest
}) => {
  return (
    <Button
      variant={variant}
      fullWidth={false}
      sx={{ mt: 1, mr: 1, alignSelf: "flex-start", ...sx }}
      color="primary"
      {...rest}
    >
      {label}
    </Button>
  );
};

export { SimpleButton };
