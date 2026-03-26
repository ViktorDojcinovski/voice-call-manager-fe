import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { ZodError } from "zod";
import { z } from "zod";

import useAppStore from "../../../store/useAppStore";
import { useSnackbar } from "../../../hooks/useSnackbar";

const MAX_LISTS_PER_USER = 10;
import CreateList_step_1 from "./steps/CreateList_step_1";
import CreateList_step_3 from "./steps/CreateList_step_3";

import {
  getValidationSchemaForStep,
} from "../../../schemas/create-list/validation-schema";

import api from "../../../utils/axiosInstance";

// Validation schema factory now handled by imported getValidationSchemaForStep

const MultiStepForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueue } = useSnackbar();
  const [step, setStep] = useState(1);
  const [originalListName, setOriginalListName] = useState<string>("");
  const getListById = useAppStore((state) => state.getListById);
  const updateList = useAppStore((state) => state.updateList);
  const lists = useAppStore((state) => state.lists);
  const user = useAppStore((state) => state.user);
  const settings = useAppStore((state) => state.settings);
  const setSettings = useAppStore((state) => state.setSettings);

  // Step 2 (exit strategy) needs Phone Settings call results from the store.
  // Settings are not loaded globally; if the user never visited Dashboard/Campaign,
  // or navigates here before those requests finish, settings stays null and step 2 spins forever.
  useEffect(() => {
    if (!user) return;
    if (settings) return;
    api
      .get("/settings")
      .then(({ data }) => setSettings(data))
      .catch((err) =>
        console.error("[CreateList] Failed to load settings:", err)
      );
  }, [user, settings, setSettings]);
  // Multi-step form: step 1 and step 2 use different Zod shapes; widen typing so the
  // resolver can switch without conflicting with react-hook-form's inferred defaults.
  const methods = useForm<any>({
    defaultValues: {
      listName: "",
      listPriority: "medium",
      listType: "static",
      listSharing: "notShared",
      filters: [{ field: "", operator: "equals", value: "" }],
      crossFilters: [],
    } as any,
    resolver: zodResolver(getValidationSchemaForStep(step, id)),
    mode: 'onTouched',
  });

  // Dynamically update resolver when step changes or id changes (edit mode)
  useEffect(() => {
    const schema = getValidationSchemaForStep(step, id);
    methods.reset(methods.getValues(), {
      keepErrors: false,
      keepDirty: true,
      keepValues: true,
    });
    // @ts-ignore — resolver is swapped when step changes; RHF internal options typing is narrow
    methods.control._options.resolver = zodResolver(schema);
  }, [step, id]);

  useEffect(() => {
    if (id) {
      (async () => {
        const list = await getListById(id);

        if (list) {
          setOriginalListName(list.listName || "");
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

  const onNextStepHandler = (data: any) => {
    // Since we removed the old step 2 (filters), we only have:
    // step 1 -> step 2 (exit strategy) -> submit
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      onConfirmHandler();
    }
  };

  const onPreviousStepHandler = () => {
    if (step === 2) {
      setStep(1);
    }
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
    if (!id && (lists?.length ?? 0) >= MAX_LISTS_PER_USER) {
      enqueue(
        `Maximum ${MAX_LISTS_PER_USER} lists per user. Delete a list to create a new one.`,
        { variant: "error" }
      );
      return;
    }
    try {
      const { data } = await submitList(formDataValues);
      console.log(id ? "List updated:" : "New list created:", data);

      navigate("/lists");
    } catch (err) {
      console.error("Error submitting list: ", err);
    }
  };

  const handleRename = async () => {
    if (!id) return;
    
    const currentName = methods.getValues("listName");
    if (!currentName || currentName.trim() === "") {
      return;
    }

    try {
      await api.patch(`/lists/${id}`, { listName: currentName });
      // Update original name to match current name so validation passes
      setOriginalListName(currentName);
      // Clear validation errors on listName field after successful rename
      methods.clearErrors("listName");
      // Trigger validation to ensure form recognizes the name as valid
      // This will re-run uniqueness check, which should now pass since name matches original
      const isValid = await methods.trigger("listName");
      if (!isValid) {
        // If validation still fails, log for debugging
        console.warn("Validation failed after rename - this should not happen");
      }
      console.log("List name updated successfully");
    } catch (err: any) {
      console.error("Error renaming list: ", err);
      // Show error feedback
      throw err; // Re-throw so step 1 can handle error display
    }
  };

  return (
    <Box display="flex" justifyContent="center">
      <Box
        display="flex"
        justifyContent="center"
        flexDirection="column"
        width="90%"
      >
        <Typography variant="h1" textAlign="center" fontSize={24} mt={5}>
          {id ? "EDIT LIST" : "CREATE NEW LIST"}
        </Typography>
        <Box>
          <FormProvider {...methods} key={step}>
            {step === 1 && (
              <CreateList_step_1 
                onNext={onNextStepHandler} 
                onRename={id ? handleRename : undefined}
                originalListName={originalListName}
                currentListName={methods.watch("listName")}
              />
            )}
            {step === 2 && (
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
