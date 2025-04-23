import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";

import ContactsImport_step_1 from "./steps/ContactsImport_step_1";
import ContactsImport_step_2 from "./steps/ContactsImport_step_2";
import ContactsImport_step_3 from "./steps/ContactsImport_step_3";
import ContactsImport_step_4 from "./steps/ContactsImport_step_4";

import api from "../../../utils/axiosInstance";

type ImportFormValues = {
  file: File;
  hasHeader: boolean;
  mapping: Record<string, string>;
  duplicateField: string;
  selectedListId: string; // or mongoose.Types.ObjectId if you want to be strict
};

const MultiStepForm = () => {
  const methods = useForm<ImportFormValues>({
    defaultValues: {
      hasHeader: true, // or false
      mapping: {},
      duplicateField: "",
      selectedListId: "",
      file: undefined as unknown as File,
    },
  });
  const [step, setStep] = useState(1);

  const onNextStepHandler = async (data: any) => {
    console.log("data: ", data);
    const isValid = await methods.trigger(); // validate current step
    if (!isValid) return;
    setStep((prev) => prev + 1);
  };
  const onPreviousStepHandler = () => setStep((prev) => prev - 1);
  const onConfirmHandler = async () => {
    const formDataValues = methods.getValues();
    console.log("form values: ", formDataValues);

    const formData = new FormData();
    formData.append("file", formDataValues.file); // <--- IMPORTANT
    formData.append("hasHeader", String(formDataValues.hasHeader));
    formData.append("duplicateField", formDataValues.duplicateField);
    formData.append("selectedListId", formDataValues.selectedListId);

    // mapping is an object, so stringify it
    formData.append("mapping", JSON.stringify(formDataValues.mapping));

    try {
      const { data } = await api.post("/contacts/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      console.log("Import Result: ", data);
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
          IMPORT CONTACTS LIST
        </Typography>
        <Box>
          <FormProvider {...methods}>
            {step === 1 && <ContactsImport_step_1 onNext={onNextStepHandler} />}
            {step === 2 && (
              <ContactsImport_step_2
                onNext={onNextStepHandler}
                onPrevious={onPreviousStepHandler}
              />
            )}
            {step === 3 && (
              <ContactsImport_step_3
                onNext={onNextStepHandler}
                onPrevious={onPreviousStepHandler}
              />
            )}
            {step === 4 && (
              <ContactsImport_step_4
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
