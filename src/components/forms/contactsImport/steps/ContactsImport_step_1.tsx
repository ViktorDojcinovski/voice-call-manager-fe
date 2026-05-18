import { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { Controller } from "react-hook-form";

import { SimpleButton } from "../../../UI";
import { DropzoneField } from "../../../molecules";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { csvFileImportStep_1_ValidationSchema } from "../../../../schemas/contacts-import/csv-file-import/validation-schema";

import cfg from "../../../../config";

const CsvImport_step_1 = ({ onNext }: { onNext: (data: any) => void }) => {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useFormContext();

  const selectedFile = watch("file");

  const handleDrop = (files: File[]) => {
    const file = files[0];
    setValue("file", file, { shouldValidate: true });
  };

  const onSubmit = (data: any) => {
    onNext(data);
  };

  const handleDownloadTemplate = () => {
    debugger;
    const templateUrl =  "kalliq_Template.csv";
    window.open(templateUrl, "_blank");
  };

  return (
    <>        
    <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" mb={2}>
      <Typography variant="body1" color="text.secondary" mb={2}>
        Feel free to download the template and use it to import your contacts.
      </Typography>
    
      <Button variant="contained" color="primary" onClick={handleDownloadTemplate}>Download Template</Button>
    </Box>

    <form onSubmit={handleSubmit(onSubmit)}>
      <Box
        display="flex"
        flexDirection="column"
        padding={2}
        border="1px solid #eee"
        borderRadius={2}
        mt={1}
        gap={1}
      >
        <DropzoneField onDrop={handleDrop} selectedFile={selectedFile} />
        {errors.file && (
          <Typography color="error" mt={1}>
            {errors.file.message as string}
          </Typography>
        )}
        <FormControlLabel
          control={
            <Controller
              name="hasHeader"
              control={control}
              render={({ field }) => (
                <Checkbox {...field} checked={field.value} />
              )}
            />
          }
          label="CSV includes header row"
        />

        <SimpleButton label="Next" type="submit" />
      </Box>
    </form>
    </>
  );
};

export default CsvImport_step_1;
