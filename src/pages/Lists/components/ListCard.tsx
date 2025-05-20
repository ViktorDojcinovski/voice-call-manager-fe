import {
  Box,
  Card,
  CardContent,
  IconButton,
  Typography,
  Chip,
  Tooltip,
  useTheme,
} from "@mui/material";
import { Edit, Delete, ExpandMore, GroupOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import ConnectionMenu from "./ConnectionMenu";
import StepCard from "./StepCard";
import { Step } from "../../../interfaces/list-dialing-step";
import { getStatusColor } from "../../../utils/getStatusColor";

const ListCard = ({
  list,
  selectedCall,
  expanded,
  eligibleContacts,
  onExpand,
  onConnectionClick,
  onConnectionChange,
  anchorEl,
  menuListId,
  closeMenu,
  onDeleteClick,
}: any) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const hasContacts = list.contacts?.length > 0;
  const contactCount = list.contacts?.length ?? 0;

  return (
    <Box>
      <Card
        elevation={1}
        sx={{
          mb: 2,
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.shape.borderRadius,
          transition: "box-shadow 0.3s",
          "&:hover": {
            boxShadow: theme.shadows[3],
          },
        }}
      >
        <CardContent
          sx={{
            pb: `${theme.spacing(2)} !important`,
            pt: theme.spacing(2),
            px: theme.spacing(3),
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={2}
          >
            <Typography
              variant="h6"
              color="text.primary"
              fontWeight={600}
              fontSize={theme.typography.pxToRem(16)}
              sx={{
                pl: 1,
                borderLeft: `4px solid ${theme.palette.primary.main}`,
              }}
            >
              {list.listName}
            </Typography>

            <Box display="flex" alignItems="center" mt={0.5} gap={0.5}>
              <GroupOutlined
                fontSize="small"
                color={hasContacts ? "action" : "disabled"}
              />
              <Typography
                variant="caption"
                color={hasContacts ? "text.secondary" : "warning.main"}
              >
                {hasContacts
                  ? `Contacts: ${contactCount}`
                  : "No Contacts Assigned"}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Chip
                label={list.status || "active"}
                size="small"
                color={getStatusColor(list.status)}
                variant="outlined"
              />

              <Tooltip title="Edit List">
                <IconButton
                  onClick={() =>
                    navigate(`/dashboard/create-new-list/${list.id}`)
                  }
                  size="small"
                  color="default"
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete List">
                <IconButton
                  onClick={() => onDeleteClick(list.id)}
                  size="small"
                  color="error"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Expand Steps">
                <IconButton
                  onClick={() => onExpand(list.id, list.steps)}
                  size="small"
                >
                  <ExpandMore
                    fontSize="small"
                    style={{
                      transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {expanded &&
        list.steps?.map((step: Step, i: number) => (
          <StepCard
            key={step.id}
            step={step}
            index={i}
            contacts={eligibleContacts?.[i] ?? step.contacts}
            selectedCallType={selectedCall}
            list={list}
            onConnectionClick={onConnectionClick}
          />
        ))}

      <ConnectionMenu
        anchorEl={anchorEl}
        open={menuListId === list.id}
        onClose={closeMenu}
        onSelect={(option: string) => onConnectionChange(list.id, option)}
      />
    </Box>
  );
};

export default ListCard;
