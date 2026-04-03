// src/pages/admin/Lists/components/StepRow.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TableRow,
  TableCell,
  Button,
  IconButton,
  Tooltip,
  Box,
  Chip,
  Typography,
} from "@mui/material";
import { GroupOutlined, PhoneForwardedOutlined } from "@mui/icons-material";
import { TelephonyConnection } from "voice-javascript-common";

import WobblingIconButton from "../../../../components/UI/WobblingArrowIcon";
import { connectionDisplayMap } from "../constants";
import ContactDialog from "./ContactDialog";
import { Step } from "../../../../interfaces/list-dialing-step";
import { transformToNormalCase } from "../../../../utils/transformCase";

interface StepRowProps {
  step: Step;
  index: number;
  contacts: any[];
  selectedCallType: string;
  list: { id: string; steps?: Step[] };
  onConnectionClick: (e: React.MouseEvent<HTMLElement>, id: string) => void;
  onContactRemoved?: () => void;
}

const StepRow = ({
  step,
  contacts,
  selectedCallType,
  list,
  onConnectionClick,
  onContactRemoved,
}: StepRowProps) => {
  const navigate = useNavigate();
  const [openContactsDialog, setOpenContactsDialog] = useState(false);

  const mode = (selectedCallType || TelephonyConnection.SOFT_CALL) as string;
  const hasEligible = contacts && contacts.length > 0;
  const defaultDisposition = step.defaultAction;

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Typography fontWeight={500}>{step.stepName}</Typography>
          <Typography variant="body2" color="text.secondary">
            Default action:{" "}
            {transformToNormalCase(step.defaultAction) ?? "none"}
          </Typography>
        </TableCell>
        <TableCell>
          <Box display="flex" alignItems="center" gap={0.5}>
            <GroupOutlined color={hasEligible ? "action" : "disabled"} />
            <Typography variant="body2">
              {hasEligible ? contacts.length : 0}
            </Typography>
            {hasEligible && (
              <Button
                variant="contained"
                size="small"
                onClick={() => setOpenContactsDialog(true)}
                sx={{
                  ml: 2,
                }}
              >
                SHOW
              </Button>
            )}
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={step.stepPriority || "active"}
            size="small"
            variant="outlined"
          />
        </TableCell>
        <TableCell align="right">
          {hasEligible && (
            <Box display="inline-flex" alignItems="center" gap={1}>
              {/* <Tooltip title="Change connection type">
                <IconButton
                  size="small"
                  onClick={(e) => onConnectionClick(e, list.id)}
                >
                  <PhoneForwardedOutlined fontSize="small" />
                </IconButton>
              </Tooltip> */}
              <Box
                component="span"
                display="inline-flex"
                alignItems="center"
                border={1}
                borderColor="divider"
                borderRadius={1}
                px={1}
                py={0.5}
                sx={{ cursor: "pointer" }}
                onClick={() =>
                  navigate("/campaign", {
                    state: {
                      contacts,
                      mode,
                      defaultDisposition,
                      autoStart: false,
                      listId: list.id,
                    },
                  })
                }
              >
                <Typography variant="caption" sx={{ mr: 0.5 }}>
                  {connectionDisplayMap[mode]}
                </Typography>
                <WobblingIconButton />
              </Box>
            </Box>
          )}
        </TableCell>
      </TableRow>

      {/* Contact list modal/dialog */}
      <ContactDialog
        open={openContactsDialog}
        contacts={contacts}
        listId={list.id}
        onClose={() => setOpenContactsDialog(false)}
        onContactRemoved={onContactRemoved}
      />
    </>
  );
};

export default StepRow;
