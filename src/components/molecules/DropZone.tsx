// src/components/molecules/DropZone.tsx
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Typography, Paper } from "@mui/material";

type DropzoneFieldProps = {
  onDrop: (files: File[]) => void;
  selectedFile?: File | null;
};

export const DropzoneField = ({ onDrop, selectedFile }: DropzoneFieldProps) => {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length) onDrop(acceptedFiles);
    },
    [onDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: false,
    accept: { "text/csv": [".csv"] },
  });

  return (
    <Paper
      {...getRootProps()}
      elevation={3}
      sx={{
        p: 3,
        textAlign: "center",
        border: "2px dashed #ccc",
        backgroundColor: isDragActive ? "#f5f5f5" : "#fff",
        cursor: "pointer",
      }}
    >
      <input {...getInputProps()} />
      {selectedFile ? (
        <Typography variant="body2">{selectedFile.name}</Typography>
      ) : (
        <Typography variant="body2">
          Drag & drop a CSV file here, or click to select
        </Typography>
      )}
    </Paper>
  );
};
