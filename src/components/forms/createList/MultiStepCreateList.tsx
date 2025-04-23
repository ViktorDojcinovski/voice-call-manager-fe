import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import CreateList_step_1 from "./steps/CreateList_step_1";
import CreateList_step_2 from "./steps/CreateList_step_2";
import CreateList_step_3 from "./steps/CreateList_step_3";

import {
  listSettingsValidationSchema,
  listFiltersValidationSchema,
} from "../../../schemas/create-list/validation-schema";
import api from "../../../utils/axiosInstance";

const getValidationSchemaForStep = (step: number) => {
  switch (step) {
    case 1:
      return listSettingsValidationSchema;
    case 2:
      return listFiltersValidationSchema;
    default:
      return undefined;
  }
};

const MultiStepForm = () => {
  const [step, setStep] = useState(1);
  const [schema, setSchema] = useState(getValidationSchemaForStep(1));
  const methods = useForm({
    defaultValues: {
      listName: "",
      listPriority: "medium",
      listType: "static",
      listSharing: "notShared",
    } as any,
    // resolver: zodResolver(schema),
  });

  const updateResolver = (newStep: number) => {
    const newSchema = getValidationSchemaForStep(newStep);
    if (newSchema) {
      methods.reset(methods.getValues(), {
        keepErrors: false,
        keepDirty: true,
        keepValues: true,
      });
      methods.reset(methods.getValues(), { keepDefaultValues: true });
      // methods.control._options.resolver = zodResolver(newSchema);
    }
  };

  const onNextStepHandler = async (data: any) => {
    console.log("data: ", data);
    const nextStep = step + 1;
    updateResolver(nextStep);
    setStep((prev) => prev + 1);
  };

  const onPreviousStepHandler = () => {
    console.log("inside previous step handler");
    const previousStep = step - 1;
    updateResolver(previousStep);
    setStep(previousStep);
  };

  const onConfirmHandler = async () => {
    const formDataValues = methods.getValues();
    console.log("formDataValues: ", formDataValues);

    try {
      const { data } = await api.post("/lists/create-new", {
        ...formDataValues,
      });

      console.log("New list created: ", data);
      // maybe show success message or navigate
    } catch (err) {
      console.error("Import error: ", err);
    }
  };

  return (
    <Box display="flex" justifyContent="center">
      <Box
        display="flex"
        justifyContent="center"
        flexDirection="column"
        width={900}
      >
        <Typography variant="h1" textAlign="center" fontSize={24} mt={5}>
          CREATE NEW LIST
        </Typography>
        <Box>
          <FormProvider {...methods}>
            {step === 1 && <CreateList_step_1 onNext={onNextStepHandler} />}
            {step === 2 && (
              <CreateList_step_2
                onNext={onNextStepHandler}
                onPrevious={onPreviousStepHandler}
              />
            )}
            {step === 3 && (
              <CreateList_step_3
                onPrevious={onPreviousStepHandler}
                onConfirm={onConfirmHandler}
              />
            )}
          </FormProvider>
        </Box>
      </Box>
    </Box>
  );
};

export default MultiStepForm;
