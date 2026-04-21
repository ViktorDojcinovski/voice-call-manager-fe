import { useState, useEffect } from "react";
import { Stack, Box, Typography, TextField, IconButton } from "@mui/material";
import { Edit, Check, Close } from "@mui/icons-material";

interface EditableFieldItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onSave?: (value: string) => Promise<void>;
  /** When true, renders a textarea instead of a single-line input when editing */
  textarea?: boolean;
  /** When > 0, truncates the text after the specified number of characters */
  truncateTextAfter?: number;
  /** The type of the value (e.g. "url" for LinkedIn URLs) */
  type?: "url" | "text"| "email";
}

const EditableFieldItem = ({
  icon,
  label,
  value = "",
  onSave,
  textarea = false,
  truncateTextAfter = 0,
  type = "text",
}: EditableFieldItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  const handleEdit = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!onSave || editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save field:", error);
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !textarea && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <Stack 
      direction="row" 
      spacing={1} 
      alignItems="center" 
      sx={{ width: "100%" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {icon}
      <Box sx={{ flexGrow: 1 }}>
        <Typography fontSize={13} fontWeight={500} color="text.secondary">
          {label}
        </Typography>
        {isEditing ? (
          <Stack direction="row" spacing={0.5} alignItems={textarea ? "flex-start" : "center"} sx={{ mt: 0.5 }}>
            <TextField
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              multiline={textarea}
              minRows={textarea ? 3 : undefined}
              size="small"
              autoFocus
              sx={{
                flexGrow: 1,
                "& .MuiInputBase-root": {
                  fontSize: 13,
                  py: 0.5,
                },
                textOverflow: "ellipsis",
                wordWrap: "break-word",
                wordBreak: "break-word",
                
              }}
            />
            <IconButton
              size="small"
              onClick={handleSave}
              disabled={isSaving}
              sx={{ minWidth: "auto", p: 0.5 }}
            >
              <Check fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleCancel}
              disabled={isSaving}
              sx={{ minWidth: "auto", p: 0.5 }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
            <Typography
              component={type === "url" ? "a" : "span"}
              href={type === "url" ? value : undefined}
              target={type === "url" ? "_blank" : undefined}
              rel={type === "url" ? "noopener noreferrer" : undefined}
              fontSize={13}
              sx={{
                flexGrow: 1,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                wordWrap: "break-word",
                overflowWrap: "break-word",
                maxWidth: truncateTextAfter > 0 ? `${truncateTextAfter}px` : "100%",
              }}
            >
              {value || "—"}
            </Typography>
            {onSave && (
              <IconButton
                size="small"
                onClick={handleEdit}
                sx={{ 
                  minWidth: "auto", 
                  p: 0.5,
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 0.2s",
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            )}
          </Stack>
        )}
      </Box>
    </Stack>
  );
};

export { EditableFieldItem };
