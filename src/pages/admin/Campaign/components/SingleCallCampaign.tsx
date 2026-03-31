import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Avatar,
  Tabs,
  Tab,
  Divider,
  Link,
  Stack,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Popover,
} from "@mui/material";
import {
  Animation,
  CallEnd,
  Add,
  Phone,
  Email,
  PlaylistAdd,
  Person,
  Close,
  Edit,
  Delete,
} from "@mui/icons-material";

import ContactOverview from "./ContactOverview";
import ContactStageChip from "./ContactStageChip";
import SendEmailModal from "../../../../components/SendEmailModal";
import AddDealModal from "./AddDealModal";
import EditDealModal from "./EditDealModal";
import { DeleteDialog } from "../../../../components/DeleteDialog";

import api from "../../../../utils/axiosInstance";
import { CallSession, Contact } from "../../../../types/contact";
import { useSnackbar } from "../../../../hooks/useSnackbar";
import { List } from "voice-javascript-common";

interface SingleCallCampaignPanelProps {
  session: CallSession;
  answeredSession: Contact | null;
  onStartCall?: () => void;
  onEndCall: () => void;
  onAccountUpdated?: () => void | Promise<void>;
  manual?: boolean;
  phone?: string;
  autoStart?: boolean;
  callStarted?: boolean;
  handleNumpadClick: (char: string) => void;
}

const tabLabels = [
  "Contact overview",
  "Sequences",
  "Deals",
  "Conversations",
  "Meetings",
];

const SingleCallCampaignPanel: React.FC<SingleCallCampaignPanelProps> = ({
  session,
  answeredSession,
  onStartCall,
  onEndCall,
  onAccountUpdated,
  manual,
  phone,
  autoStart,
  callStarted,
  handleNumpadClick,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [talkingPoints, setTalkingPoints] = useState<string[]>(
    Array.isArray(session.talkingPoints) ? session.talkingPoints : []
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTalkingPoint, setNewTalkingPoint] = useState("");
  const [addToListAnchor, setAddToListAnchor] = useState<HTMLElement | null>(null);
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [lists, setLists] = useState<{ id: string; listName: string }[]>([]);
  const [listSearch, setListSearch] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [updateKey, setUpdateKey] = useState(0);
  const [deals, setDeals] = useState<any[]>([]);
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [isEditDealModalOpen, setIsEditDealModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [isDeleteDealDialogOpen, setIsDeleteDealDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<any | null>(null);

  useEffect(() => {
    if (autoStart) {
      onStartCall?.();
    }
  }, [session.id]);

  // Fetch lists when "Add to list" popover opens
  useEffect(() => {
    if (addToListAnchor) {
      const fetchLists = async () => {
        try {
          const { data } = await api.get<List[]>("/lists");
          setLists(data.map((list) => ({ id: list.id, listName: list.listName })));
        } catch (error) {
          console.error("Failed to fetch lists:", error);
        }
      };
      fetchLists();
    }
  }, [addToListAnchor]);

  // Fetch deals when active tab is 2 (Deals tab)
  useEffect(() => {
    if (activeTab === 2) {
      getDeals();
    }
  }, [activeTab]);

  const { enqueue } = useSnackbar();

  const handleAddToList = async () => {
    if (!selectedListId || !session.id) return;

    try {
      // Get current contact to find its listId
      const contactResponse = await api.get(`/contacts/${session.id}`);
      const contact = contactResponse.data;
      const sourceListId = contact.listId;

      if (!sourceListId) {
        enqueue("Contact is not in any list. Cannot move.", { variant: "error" });
        return;
      }

      if (sourceListId === selectedListId) {
        enqueue("Contact is already in this list.", { variant: "info" });
        setAddToListAnchor(null);
        setSelectedListId(null);
        setListSearch("");
        return;
      }

      // Use move endpoint to add contact to selected list
      await api.post("/contacts/move", {
        sourceListId,
        targetListId: selectedListId,
        contactIds: [session.id],
      });

      enqueue("Contact added to list successfully", { variant: "success" });
      setAddToListAnchor(null);
      setSelectedListId(null);
      setListSearch("");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to add contact to list";
      enqueue(errorMessage, { variant: "error" });
    }
  };

  const onPhoneSubmitHandler = async () => {
    try {
      await api.patch(`/contacts/basic/${session.id}`, {
        phone: newPhone,
      });

      session.phone = newPhone;
      setEditingPhone(false);
      setNewPhone("");
    } catch (err) {
      console.error("Failed to update phone number", err);
    }
  };

  const onStageChangeHandler = async (status: string) => {
    console.log("status: ", typeof status);
    try {
      await api.patch(`/contacts/basic/${session.id}`, {
        status,
      });

      session.status = status;
    } catch (err) {
      console.error("Failed to update phone number", err);
    }
  };

  const handleFieldUpdate = async (field: string, value: string) => {
    try {
      await api.patch(`/contacts/basic/${session.id}`, {
        [field]: value,
      });
      (session as any)[field] = value;
      setUpdateKey((prev) => prev + 1);
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
      throw err;
    }
  };

  const handleRemoveTalkingPoint = async (index: number) => {
    const updated = talkingPoints.filter((_, i) => i !== index);
    try {
      await api.patch(`/contacts/basic/${session.id}`, {
        talkingPoints: updated,
      });
      setTalkingPoints(updated);
    } catch (err) {
      console.error("Failed to remove talking point", err);
    }
  };

  const getDeals = async () => {
    try {
      const { data } = await api.get(`/deals?contactId=${session.id}`);
      console.log("deals: ", data);
      setDeals(data);
    } catch (error) {
      console.error("Failed to get deals:", error);
      setDeals([]);
    }
  };

  const handleDeleteDeal = async () => {
    if (!dealToDelete?.id) {
      return;
    }

    try {
      await api.delete(`/deals/${dealToDelete.id}`);
      enqueue("Deal deleted successfully", { variant: "success" });
      setIsDeleteDealDialogOpen(false);
      setDealToDelete(null);
      getDeals();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete deal";
      enqueue(errorMessage, { variant: "error" });
    }
  };

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          p: 2,
          mt: 2,
          backgroundColor: "#fff",
          boxShadow: 0,
        }}
      >
        <Grid container spacing={2} padding={2}>
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ width: 56, height: 56, marginRight: 2 }}>
                <Person sx={{ fontSize: 36 }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {session.first_name} {session.last_name}
                </Typography>
                {(session.title || session.company) && (
                  <Typography variant="body2" color="text.secondary">
                    {session.title ?? ""}
                    {session.title ? " at " : ""}
                    {session.company ?? ""}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box>
              <Stack spacing={1}>
                {/* Chips */}
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <ContactStageChip
                    contact={session}
                    onStageChange={onStageChangeHandler}
                  />
                  {/* TO DO -- think how to handle this section */}
                  {/* <Chip label="Owner" size="small" variant="outlined" />
                  <Chip label="C-Suite" size="small" variant="outlined" />
                  <Chip label="US-based" size="small" variant="outlined" /> */}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Email fontSize="small" />
                    <Link
                      href="mailto:mike@bdm-pro.com"
                      underline="hover"
                      color="inherit"
                      fontSize="12px"
                    >
                      {session.email}
                    </Link>
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    <Phone fontSize="small" />
                    {!editingPhone && session.phone ? (
                      <>
                        <Typography fontSize="12px" color="text.secondary">
                          {session.phone}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => {
                            setNewPhone(session.phone || "");
                            setEditingPhone(true);
                          }}
                          sx={{ minWidth: "auto", fontSize: "11px", px: 1 }}
                        >
                          Change
                        </Button>
                      </>
                    ) : (
                      <>
                        {editingPhone ? (
                          <>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <TextField
                                type="tel"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                placeholder="Enter phone"
                                size="small"
                                autoFocus
                                sx={{
                                  "& .MuiInputBase-root": {
                                    fontSize: "12px",
                                  },
                                }}
                              />
                              <Button
                                size="small"
                                onClick={onPhoneSubmitHandler}
                                sx={{
                                  minWidth: "auto",
                                  fontSize: "11px",
                                  px: 1,
                                }}
                              >
                                Add
                              </Button>
                              <Button
                                size="small"
                                onClick={() => setEditingPhone(false)}
                                sx={{
                                  minWidth: "auto",
                                  fontSize: "11px",
                                  px: 1,
                                }}
                                color="inherit"
                              >
                                Cancel
                              </Button>
                            </Stack>
                          </>
                        ) : (
                          <>
                            <Typography fontSize="12px" color="text.secondary">
                              No phone number
                            </Typography>
                            <Typography
                              fontSize="0.9rem"
                              color="primary"
                              sx={{ cursor: "pointer", ml: 0.5 }}
                              onClick={() => {
                                setNewPhone(session.phone || "");
                                setEditingPhone(true);
                              }}
                            >
                              • Add phone
                            </Typography>
                          </>
                        )}
                      </>
                    )}
                  </Stack>
                </Stack>
              </Stack>
            </Box>
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              sx={{ mt: 2, mb: 1 }}
            >
              {tabLabels.map((label, idx) => (
                <Tab key={idx} label={label} />
              ))}
            </Tabs>
            {activeTab === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <ContactOverview key={updateKey} contact={session} onUpdate={handleFieldUpdate} onAccountUpdated={onAccountUpdated} />
                </Grid>
              </Grid>
            )}
            {activeTab === 1 && (
              <Box px={3} py={2}>
                <Typography variant="body1" color="text.secondary">
                  No sequences yet.
                </Typography>
              </Box>
            )}
            {activeTab === 2 && (
              <Box px={3} py={2}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6">Deals</Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setIsAddDealModalOpen(true)}
                  >
                    Add Deal
                  </Button>
                </Box>
                {deals.length === 0 ? (
                  <Typography variant="body1" color="text.secondary">
                    No deals yet.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {deals.map((deal) => (
                      <Paper key={deal.id} variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6">
                              {deal.dealname || deal.name}
                            </Typography>
                            {deal.description && (
                              <Typography variant="body2" color="text.secondary" mt={1}>
                                {deal.description}
                              </Typography>
                            )}
                            {deal.amount !== undefined && (
                              <Typography variant="body2" mt={1}>
                                Amount: ${deal.amount.toLocaleString()}
                              </Typography>
                            )}
                            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                              {deal.pipeline && (
                                <Chip label={deal.pipeline} size="small" />
                              )}
                              {deal.dealstage && (
                                <Chip label={deal.dealstage} size="small" />
                              )}
                              {deal.hs_is_closed && (
                                <Chip label="Closed" size="small" color="success" />
                              )}
                            </Stack>
                          </Box>
                          <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                            <Button
                              size="small"
                              startIcon={<Edit />}
                              onClick={() => {
                                setSelectedDeal(deal);
                                setIsEditDealModalOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              startIcon={<Delete />}
                              color="error"
                              onClick={() => {
                                setDealToDelete(deal);
                                setIsDeleteDealDialogOpen(true);
                              }}
                            >
                              Delete
                            </Button>
                          </Stack>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            )}
            {activeTab === 3 && (
              <Box px={3} py={2}>
                <Typography variant="body1" color="text.secondary">
                  No conversations yet.
                </Typography>
              </Box>
            )}
            {activeTab === 4 && (
              <Box px={3} py={2}>
                <Typography variant="body1" color="text.secondary">
                  No meetings yet.
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              variant="outlined"
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                justifyContent: "center",
                borderRadius: 3,
                p: 2,
                mt: 2,
                backgroundColor: "#fff",
                boxShadow: 0,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Button
                variant="outlined"
                startIcon={<PlaylistAdd />}
                onClick={(e) => setAddToListAnchor(e.currentTarget)}
              >
                Add to list
              </Button>
              <Button
                variant="outlined"
                startIcon={<Email />}
                onClick={() => setIsSendEmailModalOpen(true)}
              >
                Send email
              </Button>
              {/* <Button variant="outlined" startIcon={<Animation />}>
                Add to sequence
              </Button> */}
            </Paper>
            <Grid
              item
              xs={12}
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
            >
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  p: 2,
                  mt: 2,
                  backgroundColor: "#fff",
                  boxShadow: 0,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Talking Points
                </Typography>
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  sx={{
                    alignItems: "flex-start",
                    minWidth: 0,
                    width: "100%",
                  }}
                >
                  {talkingPoints.length > 0 ? (
                    talkingPoints.map((point, idx) => (
                      <Chip
                        key={idx}
                        label={point}
                        onDelete={() => handleRemoveTalkingPoint(idx)}
                        deleteIcon={<Close />}
                        sx={{
                          m: 0.5,
                          maxWidth: "100%",
                          height: "auto",
                          alignItems: "flex-start",
                          py: 0.75,
                          "& .MuiChip-label": {
                            whiteSpace: "normal",
                            display: "block",
                            lineHeight: 1.4,
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                          },
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No talking points available.
                    </Typography>
                  )}
                </Stack>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setIsModalOpen(true)}
                  sx={{ mt: 1 }}
                >
                  Add talking point
                </Button>
              </Paper>
              {!manual && (
                <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CallEnd />}
                    onClick={onEndCall}
                    disabled={!callStarted}
                  >
                    End Call
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
      </Paper>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogTitle>Add Talking Point</DialogTitle>
        <Divider />
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            type="textarea"
            variant="outlined"
            label="Talking Point"
            value={newTalkingPoint}
            onChange={(e) => setNewTalkingPoint(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              const updatedPoints = [...talkingPoints, newTalkingPoint.trim()];
              setTalkingPoints(updatedPoints);
              setIsModalOpen(false);
              setNewTalkingPoint("");
              await api.patch(`/contacts/basic/${session.id}`, {
                talkingPoints: updatedPoints,
              });
            }}
            disabled={!newTalkingPoint.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add to List Popover */}
      <Popover
        open={Boolean(addToListAnchor)}
        anchorEl={addToListAnchor}
        onClose={() => {
          setAddToListAnchor(null);
          setSelectedListId(null);
          setListSearch("");
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 2, minWidth: 300 }}>
          <Typography variant="h6" gutterBottom>
            Add to List
          </Typography>
          <Autocomplete
            options={lists}
            getOptionLabel={(option) => option.listName}
            value={lists.find((l) => l.id === selectedListId) || null}
            onChange={(_, newValue) => {
              setSelectedListId(newValue?.id || null);
            }}
            inputValue={listSearch}
            onInputChange={(_, newInputValue) => {
              setListSearch(newInputValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search lists"
                placeholder="Type to search..."
                size="small"
              />
            )}
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              onClick={() => {
                setAddToListAnchor(null);
                setSelectedListId(null);
                setListSearch("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAddToList}
              disabled={!selectedListId}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Popover>

      {/* Send Email Modal */}
      <SendEmailModal
        open={isSendEmailModalOpen}
        onClose={() => setIsSendEmailModalOpen(false)}
        contactId={session.id}
        contactEmail={session.email || ""}
      />

      {/* Add Deal Modal */}
      <AddDealModal
        open={isAddDealModalOpen}
        onClose={() => setIsAddDealModalOpen(false)}
        contactId={session.id}
        onSuccess={() => {
          // Refresh deals list when a new deal is added
          getDeals();
        }}
      />

      {/* Edit Deal Modal */}
      <EditDealModal
        open={isEditDealModalOpen}
        onClose={() => {
          setIsEditDealModalOpen(false);
          setSelectedDeal(null);
        }}
        deal={selectedDeal}
        onSuccess={() => {
          // Refresh deals list when a deal is updated
          getDeals();
        }}
      />

      {/* Delete Deal Dialog */}
      <DeleteDialog
        open={isDeleteDealDialogOpen}
        title="Delete Deal"
        text={`Are you sure you want to delete "${dealToDelete?.dealname || dealToDelete?.name || "this deal"}"? This action cannot be undone.`}
        onClose={() => {
          setIsDeleteDealDialogOpen(false);
          setDealToDelete(null);
        }}
        onConfirm={handleDeleteDeal}
      />
    </>
  );
};

export default SingleCallCampaignPanel;
