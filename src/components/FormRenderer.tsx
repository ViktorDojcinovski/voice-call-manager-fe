import { useForm, Controller, FormProvider } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";

import { SimpleButton, CustomTextField } from "./UI";
import { FormRendererProps } from "../interfaces/form-renderer";
import {
  CheckBoxWithNestedField,
  RadioGroupWithNestedField,
} from "./molecules";
import { FormErrorMessage } from "./atoms";

const FormRenderer = ({
  schema,
  onSubmit,
  validationSchema,
  defaultValues,
}: FormRendererProps) => {
  const methods = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = methods;

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box display="flex" flexDirection="column" gap={4}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {schema.title}
            </Typography>
            {schema.sections.map((section, idx) => {
              return (
                <Box key={`${section}.${idx}`}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {section.title}
                  </Typography>
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
                            />
                          </Box>
                        );
                      default:
                        return null;
                    }
                  })}
                </Box>
              );
            })}
          </Box>
        </form>

        <FormErrorMessage errors={errors} />
      </FormProvider>
    </>
  );
};

export default FormRenderer;
