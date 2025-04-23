import {
  useFormContext,
  Controller,
  SubmitHandler,
  FieldValues,
} from "react-hook-form";
import { Box, Typography, Switch } from "@mui/material";

import { FormRendererProps } from "../interfaces/form-renderer";
import { ButtonAction } from "../enums/form-buttons-actions";
import { SimpleButton, CustomTextField } from "./UI";
import {
  CheckBoxWithNestedField,
  RadioGroupWithNestedField,
  DynamicFieldArray,
} from "./molecules";
import { FormErrorMessage } from "./atoms";

const FormRenderer = ({
  schema,
  onSubmit,
  onNext,
  onPrevious,
}: FormRendererProps) => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useFormContext();

  const handleButtonClick = (action?: string) => {
    console.log("action: ", action);
    switch (action) {
      case ButtonAction.NEXT:
        handleSubmit((data) => {
          console.log("Collected data: ", data);
          onNext?.(data);
        })();
        break;
      case ButtonAction.PREVIOUS:
        onPrevious?.();
        break;
    }
  };

  return (
    <>
      <form
        onSubmit={
          onSubmit
            ? handleSubmit(onSubmit as SubmitHandler<FieldValues>)
            : (e) => e.preventDefault()
        }
      >
        <Box display="flex" flexDirection="column" gap={4}>
          <Typography
            variant="h2"
            fontWeight="bold"
            mt={2}
            pl={2}
            fontSize={16}
          >
            {schema.title}
          </Typography>
          <Box
            display="flex"
            flexDirection="column"
            padding={2}
            border="1px solid #eee"
            borderRadius={2}
            mt={1}
            px={3}
            py={2}
            gap={1}
          >
            {schema.sections.map((section, idx) => {
              const isButtonSection = section.fields.every(
                (f) => f.type === "button"
              );

              return (
                <Box
                  key={`${section}.${idx}`}
                  display={isButtonSection ? "flex" : "block"}
                  flexDirection={isButtonSection ? "row" : "column"}
                  gap={0}
                >
                  {!isButtonSection && (
                    <Typography
                      variant="h3"
                      fontSize={14}
                      mt={4}
                      mb={2}
                      fontWeight="bold"
                    >
                      {section.title}
                    </Typography>
                  )}
                  {section.fields.map((field, fIdx) => {
                    switch (field.type) {
                      case "text":
                        return (
                          <Controller
                            key={fIdx}
                            name={field.name || ""}
                            control={control}
                            render={({ field: controllerField }) => (
                              <CustomTextField
                                value={controllerField.value}
                                onChange={controllerField.onChange}
                                label={field.label}
                                placeholder={field.placeholder}
                                fullWidth={field.fullWidth}
                                error={!!errors[field.name || ""]}
                                helperText={
                                  errors[field.name || ""]?.message as string
                                }
                              />
                            )}
                          />
                        );
                      case "radio":
                        if (!field.options) return null;
                        const selectedOption = watch(field.name || "");
                        return (
                          <RadioGroupWithNestedField
                            controllerKey={fIdx}
                            field={field}
                            control={control}
                            errors={errors}
                            selectedOption={selectedOption}
                          />
                        );
                      case "checkbox":
                        return (
                          <CheckBoxWithNestedField
                            controllerKey={fIdx}
                            field={field}
                            control={control}
                            errors={errors}
                          />
                        );
                      case "button":
                        return (
                          <Box key={fIdx}>
                            <SimpleButton
                              type={
                                field.action === "submit" ? "submit" : "button"
                              }
                              label={field.label || ""}
                              onClick={
                                field.action !== "submit"
                                  ? () => handleButtonClick(field.action)
                                  : undefined
                              }
                            />
                          </Box>
                        );
                      case "toggle":
                        return (
                          <Controller
                            key={fIdx}
                            name={field.name || ""}
                            control={control}
                            render={({ field: controllerField }) => (
                              <Box display="flex" alignItems="center" gap={1}>
                                <Switch
                                  checked={controllerField.value || false}
                                  onChange={(e) =>
                                    controllerField.onChange(e.target.checked)
                                  }
                                  sx={{
                                    transform: "scale(1.5)",
                                  }}
                                />
                                <Typography>{field.label}</Typography>
                              </Box>
                            )}
                          />
                        );
                      case "dynamic":
                        return (
                          <DynamicFieldArray
                            key={fIdx}
                            fieldConfig={field as any} // Pass the config (includes addButtonLabel, nestedFields, etc.)
                            control={control}
                            errors={errors}
                          />
                        );
                      default:
                        return null;
                    }
                  })}
                </Box>
              );
            })}
          </Box>
        </Box>
      </form>

      <FormErrorMessage errors={errors} />
    </>
  );
};

export default FormRenderer;
