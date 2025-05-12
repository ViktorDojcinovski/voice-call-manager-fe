import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  IconButton,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Edit,
  Delete,
  PhoneForwardedOutlined,
  ExpandMore,
} from "@mui/icons-material";

import api from "../utils/axiosInstance";

import { SimpleButton } from "../components/UI/SimpleButton";
import useAppStore from "../store/useAppStore";
import WobblingIconButton from "../components/UI/WobblingArrowIcon";

type Contact = {
  [key: string]: string;
};

interface List {
  id: string;
  listName: string;
  step: Step[];
  contacts: Contact[];
}

interface Step {
  id: string;
  stepName: string;
  contacts: Contact[];
  defaultAction: string;
}

enum TelephonyConnection {
  SOFT_CALL = "Soft call",
  PARALLEL_CALL = "Two Parallel calls",
  ADVANCED_PARALLEL_CALL = "Four Parallel calls",
}

const connectionDisplayMap: Record<TelephonyConnection, string> = {
  [TelephonyConnection.SOFT_CALL]: "1X",
  [TelephonyConnection.PARALLEL_CALL]: "2X",
  [TelephonyConnection.ADVANCED_PARALLEL_CALL]: "4X",
};

const Lists = () => {
  const navigate = useNavigate();
  const lists = useAppStore((state) => state.lists);
  const fetchLists = useAppStore((state) => state.fetchLists);
  const deleteList = useAppStore((state) => state.deleteList);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuListId, setMenuListId] = useState<string | null>(null);
  const [selectedCalls, setSelectedCalls] = useState<Record<string, string>>(
    {}
  );
  const [expandedListId, setExpandedListId] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [eligibleContacts, setEligibleContacts] = useState<{
    [listId: string]: {
      [stepIndex: number]: Contact[];
    };
  }>({});

  const fetchEligibleContacts = async (listId: string, steps: Step[]) => {
    const results: { [stepIndex: number]: Contact[] } = {};

    for (let i = 0; i < steps.length; i++) {
      try {
        const res = await api.post(`/lists/${listId}/step/${i + 1}/contacts`);
        results[i] = res.data;
      } catch (err) {
        console.error(`Failed to fetch contacts for step ${i + 1}`, err);
        results[i] = [];
      }
    }

    setEligibleContacts((prev) => ({
      ...prev,
      [listId]: results,
    }));
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleEdit = (id: string) => {
    navigate(`/dashboard/create-new-list/${id}`);
  };

  const handleDeleteClick = (id: string) => {
    setListToDelete(id);
    setOpenDialog(true);
  };

  const handleDelete = async () => {
    if (listToDelete) {
      await deleteList(listToDelete);
      setOpenDialog(false);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setListToDelete(null); // Reset the listToDelete
  };

  return (
    <>
      <Box display="flex" justifyContent="right">
        <SimpleButton
          label="Import New Contacts"
          onClick={() => navigate("/dashboard/import-contacts")}
        />
        <SimpleButton
          label="Create New List"
          onClick={() => navigate("/dashboard/create-new-list")}
        />
      </Box>
      <Box m={5} p={5}>
        <Typography variant="h1" fontSize={24} mb={5} ml={2}>
          Lists
        </Typography>
        {lists &&
          lists.map((list) => {
            const selected = selectedCalls[list.id] as TelephonyConnection;

            return (
              <Box key={list.id}>
                <Card sx={{ marginBottom: 2 }}>
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="h6" fontSize={16}>
                        {list.listName}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          display="flex"
                          flexDirection="row"
                          alignItems="center"
                          gap={1}
                          marginRight={5}
                          sx={{ cursor: "pointer" }}
                        >
                          <IconButton
                            onClick={(event) => {
                              setAnchorEl(event.currentTarget);
                              setMenuListId(list.id);
                            }}
                          >
                            <PhoneForwardedOutlined />
                          </IconButton>
                          {selected && (
                            <Typography
                              variant="caption"
                              color="grey"
                              fontSize={12}
                              border="1px solid grey"
                              borderRadius={5}
                              paddingLeft={2}
                            >
                              <Box
                                display="flex"
                                flexDirection="row"
                                alignItems="center"
                                onClick={() => {
                                  if (selected) {
                                    navigate("/dashboard/device", {
                                      state: {
                                        contacts: list.contacts,
                                        mode: selected as TelephonyConnection,
                                      },
                                    });
                                  }
                                }}
                              >
                                {connectionDisplayMap[selected]}
                                <WobblingIconButton />
                              </Box>
                            </Typography>
                          )}
                        </Box>
                        <IconButton onClick={() => handleEdit(list.id)}>
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteClick(list.id)}>
                          <Delete />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            const isExpanding = expandedListId !== list.id;
                            setExpandedListId(isExpanding ? list.id : null);
                            if (isExpanding && list.steps?.length) {
                              fetchEligibleContacts(list.id, list.steps);
                            }
                          }}
                        >
                          <ExpandMore
                            style={{
                              transform:
                                expandedListId === list.id
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                              transition: "transform 0.2s",
                            }}
                          />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
                {/* Show steps if expanded */}
                {expandedListId === list.id && list.steps?.length > 0 && (
                  <Box mt={2} pl={2}>
                    {list.steps.map((step: Step, index: number) => {
                      const contacts =
                        eligibleContacts[list.id]?.[index] ?? step.contacts; // fallback

                      return (
                        <Card
                          key={step.id}
                          sx={{ mb: 1, backgroundColor: "#f9f9f9" }}
                        >
                          <CardContent
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Box>
                              <Typography variant="subtitle1">
                                {step.stepName}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {step.defaultAction}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {contacts?.length ?? 0} eligible contact(s)
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              color="grey"
                              fontSize={12}
                              border="1px solid grey"
                              borderRadius={5}
                              paddingLeft={2}
                            >
                              <Box
                                display="flex"
                                flexDirection="row"
                                alignItems="center"
                                onClick={() => {
                                  if (selected) {
                                    navigate("/dashboard/device", {
                                      state: {
                                        contacts: contacts,
                                        mode:
                                          selected ||
                                          (TelephonyConnection.SOFT_CALL as TelephonyConnection),
                                      },
                                    });
                                  }
                                }}
                              >
                                {
                                  connectionDisplayMap[
                                    selected || TelephonyConnection.SOFT_CALL
                                  ]
                                }
                                <WobblingIconButton />
                              </Box>
                            </Typography>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                )}

                <Menu
                  anchorEl={anchorEl}
                  open={menuListId === list.id}
                  onClose={() => {
                    setMenuListId(null);
                    setAnchorEl(null);
                  }}
                >
                  {Object.values(TelephonyConnection).map((option) => (
                    <MenuItem
                      key={option}
                      onClick={() => {
                        setSelectedCalls((prev) => ({
                          ...prev,
                          [list.id]: option,
                        }));
                        setMenuListId(null);
                        setAnchorEl(null);
                      }}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            );
          })}
      </Box>

      {/* Dialog for delete confirmation */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this list?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Lists;
