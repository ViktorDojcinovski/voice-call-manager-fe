import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";

import useAppStore from "../../../store/useAppStore";
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
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const getListById = useAppStore((state) => state.getListById);
  const updateList = useAppStore((state) => state.updateList);
  const methods = useForm({
    defaultValues: {
      listName: "",
      listPriority: "medium",
      listType: "static",
      listSharing: "notShared",
    } as any,
    // resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (id) {
      (async () => {
        const list = await getListById(id);

        if (list) {
          const transformedList = {
            ...list,
            exitConditionsPositive: list.exitConditionsPositive.map(
              (condition: string) => ({ value: condition })
            ),
            exitConditionsNegative: list.exitConditionsNegative.map(
              (condition: string) => ({ value: condition })
            ),
          };

          methods.reset({
            ...transformedList,
          });
        }
      })();
    }
  }, [id]);

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
    const nextStep = step + 1;
    updateResolver(nextStep);
    setStep((prev) => prev + 1);
  };

  const onPreviousStepHandler = () => {
    const previousStep = step - 1;
    updateResolver(previousStep);
    setStep(previousStep);
  };

  const submitList = async (formData: any) => {
    if (id) {
      // Edit mode
      return api.patch(`/lists/${id}`, formData);
    } else {
      // Create mode
      return api.post("/lists/create-new", formData);
    }
  };

  const onConfirmHandler = async () => {
    const formDataValues = methods.getValues();
    try {
      const { data } = await submitList(formDataValues);
      console.log(id ? "List updated:" : "New list created:", data);

      navigate("/dashboard/lists");
    } catch (err) {
      console.error("Error submitting list: ", err);
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
          {id ? "EDIT LIST" : "CREATE NEW LIST"}
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
