import { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";

import { SimpleButton } from "../../../UI";
import { DropzoneField } from "../../../molecules";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { csvFileImportStep_1_ValidationSchema } from "../../../../schemas/contacts-import/csv-file-import/validation-schema";

const CsvImport_step_1 = ({ onNext }: { onNext: (data: any) => void }) => {
  const {
    register,
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

  return (
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
          control={<Checkbox {...register("hasHeader")} />}
          label="CSV includes header row"
        />

        <SimpleButton label="Next" type="submit" />
      </Box>
    </form>
  );
};

export default CsvImport_step_1;
