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
    <Button variant={variant} sx={{ mt: 1, ...sx }} {...rest}>
      {label}
    </Button>
  );
};

export { SimpleButton };
