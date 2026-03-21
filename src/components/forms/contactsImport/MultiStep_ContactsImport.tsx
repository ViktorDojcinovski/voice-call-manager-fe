import { useState } from "react";
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { FormProvider, Resolver, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import React from "react";
import * as z from 'zod';
import type { ZodType } from 'zod';
import { AnyZodObject } from 'zod';

import ContactsImport_step_1 from "./steps/ContactsImport_step_1";
import ContactsImport_step_2 from "./steps/ContactsImport_step_2";
import ContactsImport_step_3 from "./steps/ContactsImport_step_3";
import ContactsImport_step_4 from "./steps/ContactsImport_step_4";

// hubspot integration: component placed below CSV flow
import HubSpotImportSection from "./HubSpotImportSection";

import api from "../../../utils/axiosInstance";
import { zodResolver } from '@hookform/resolvers/zod';
import {
  csvFileImportStep_1_ValidationSchema,
  csvFileImportStep_2_ValidationSchema,
  csvFileImportStep_3_ValidationSchema,
  csvFileImportStep_4_ValidationSchema,
  EXISTING_CONTACTS_ACTION,
} from '../../../schemas/contacts-import/csv-file-import/validation-schema';

type ImportFormValues = {
  file: File;
  hasHeader: boolean;
  mapping: Record<string, string>;
  duplicateField: string;
  timezoneMode: string;
  timezoneManual?: string;
  selectedListId: string;
  existingContactsAction: string;
};

const getValidationSchemaForStep = (step: number) => {
  switch (step) {
    case 1:
      return csvFileImportStep_1_ValidationSchema;
    case 2:
      return csvFileImportStep_2_ValidationSchema;
    case 3:
      return csvFileImportStep_3_ValidationSchema;
    case 4:
      return csvFileImportStep_4_ValidationSchema;
    default:
      return undefined;
  }
};

const MultiStepForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentSchema = getValidationSchemaForStep(step) as AnyZodObject | undefined;
  const methods = useForm<ImportFormValues>({
    defaultValues: {
      hasHeader: false,
      mapping: {},
      duplicateField: "",
      timezoneMode: "",
      timezoneManual: "",
      selectedListId: "",
      existingContactsAction: EXISTING_CONTACTS_ACTION.SKIP,
    },
    resolver: zodResolver(
      getValidationSchemaForStep(step)! as any
    ) as Resolver<ImportFormValues>,
    mode: "onTouched",
  });

  // Dynamically update resolver when step changes
  React.useEffect(() => {
    methods.reset(methods.getValues(), {
      keepErrors: false,
      keepDirty: true,
      keepValues: true,
    });
    // @ts-ignore
    methods.control._options.resolver = zodResolver(
      getValidationSchemaForStep(step)! as any
    ) as Resolver<ImportFormValues>;
  }, [step]);

  const onNextStepHandler = async (data: any) => {
    console.log("data: ", data);
    const isValid = await methods.trigger(); // validate current step
    if (!isValid) return;
    setStep((prev) => prev + 1);
  };
  const onPreviousStepHandler = () => setStep((prev) => prev - 1);
  const onConfirmHandler = async () => {
    setIsSubmitting(true);
    const formDataValues = methods.getValues();
    console.log("form values: ", formDataValues);

    const formData = new FormData();
    formData.append("file", formDataValues.file); // <--- IMPORTANT
    formData.append("hasHeader", String(formDataValues.hasHeader));
    formData.append("duplicateField", formDataValues.duplicateField);
    formData.append("timezoneMode", formDataValues.timezoneMode ?? "");
    if (
      formDataValues.timezoneMode === "manual" &&
      formDataValues.timezoneManual
    ) {
      formData.append("timezoneManual", formDataValues.timezoneManual);
    }
    formData.append("selectedListId", formDataValues.selectedListId);
    formData.append(
      "existingContactsAction",
      formDataValues.existingContactsAction ?? EXISTING_CONTACTS_ACTION.SKIP
    );

    // mapping is stored as { fieldId: csvColumn }, API expects { csvColumn: fieldId }
    const mappingForApi = Object.fromEntries(
      Object.entries(formDataValues.mapping || {})
        .filter(([, csvCol]) => csvCol)
        .map(([fieldId, csvCol]) => [csvCol, fieldId])
    );
    formData.append("mapping", JSON.stringify(mappingForApi));

    try {
      const { data } = await api.post("/contacts/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      console.log("Import Result: ", data);
      setDialogTitle("Success");
      setDialogMessage("The list has been created successfully.");
      setDialogOpen(true);
    } catch (err: any) {
      console.error("Import error: ", err);
      setDialogTitle("Error");
      setDialogMessage(
        err?.response?.data?.message || "There was an error creating the list."
      );
      setDialogOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    navigate("/lists");
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
          IMPORT CONTACTS LIST
        </Typography>
        <Box>
          <FormProvider {...methods} key={step}>
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
                isSubmitting={isSubmitting}
              />
            )}
          </FormProvider>
        </Box>

        {/* hubspot integration: component placed below CSV flow */}
        <HubSpotImportSection />

        <Dialog
          open={dialogOpen}
          // disable closing by backdrop or escape:
          onClose={(_, reason) => {
            if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
             handleDialogClose()            }
          }}
        >
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogContent>
            <Typography>{dialogMessage}</Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setDialogOpen(false) 
                navigate('/lists')      
              }}
              autoFocus
            >
              OK
           </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default MultiStepForm;
