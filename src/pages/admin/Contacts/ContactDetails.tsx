import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  ArrowBack as ArrowBackIcon,
  Add,
  Phone,
  Email,
  PlaylistAdd,
  Person,
  Close,
  Edit,
  Delete,
} from "@mui/icons-material";
import api from "../../../utils/axiosInstance";
import { useSnackbar } from "../../../hooks/useSnackbar";
import Loading from "../../../components/UI/Loading";
import { Contact } from "../../../types/contact";
import ContactOverview from "../Campaign/components/ContactOverview";
import ContactStageChip from "../Campaign/components/ContactStageChip";
import SendEmailModal from "../../../components/SendEmailModal";
import AddDealModal from "../Campaign/components/AddDealModal";
import EditDealModal from "../Campaign/components/EditDealModal";
import { DeleteDialog } from "../../../components/DeleteDialog";
import { List } from "voice-javascript-common";

const tabLabels = [
  "Contact overview",
  "Sequences",
  "Deals",
  "Conversations",
  "Meetings",
];

const ContactDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueue } = useSnackbar();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [talkingPoints, setTalkingPoints] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTalkingPoint, setNewTalkingPoint] = useState("");
  const [addToListAnchor, setAddToListAnchor] = useState<HTMLElement | null>(
    null,
  );
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
    if (id) {
      loadContact();
    }
  }, [id]);

  // Fetch lists when "Add to list" popover opens
  useEffect(() => {
    if (addToListAnchor) {
      const fetchLists = async () => {
        try {
          const { data } = await api.get<List[]>("/lists");
          setLists(
            data.map((list) => ({ id: list.id, listName: list.listName })),
          );
        } catch (error) {
          console.error("Failed to fetch lists:", error);
        }
      };
      fetchLists();
    }
  }, [addToListAnchor]);

  // Fetch deals when active tab is 2 (Deals tab)
  useEffect(() => {
    if (activeTab === 2 && contact?.id) {
      getDeals();
    }
  }, [activeTab, contact?.id]);

  const loadContact = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/contacts/${id}`);
      const contactData = res.data;
      setContact(contactData);
      setTalkingPoints(
        Array.isArray(contactData.talkingPoints)
          ? contactData.talkingPoints
          : [],
      );
    } catch (error) {
      enqueue("Failed to load contact details", { variant: "error" });
      navigate("/contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async () => {
    if (!selectedListId || !contact?.id) return;

    try {
      // Get current contact to find its listId
      const contactResponse = await api.get(`/contacts/${contact.id}`);
      const contactData = contactResponse.data;
      const sourceListId = contactData.listId;

      if (!sourceListId) {
        enqueue("Contact is not in any list. Cannot move.", {
          variant: "error",
        });
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
        contactIds: [contact.id],
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
    if (!contact?.id) return;
    try {
      await api.patch(`/contacts/basic/${contact.id}`, {
        phone: newPhone,
      });

      if (contact) {
        contact.phone = newPhone;
        setContact({ ...contact });
      }
      setEditingPhone(false);
      setNewPhone("");
      enqueue("Phone number updated", { variant: "success" });
    } catch (err) {
      console.error("Failed to update phone number", err);
      enqueue("Failed to update phone number", { variant: "error" });
    }
  };

  const onStageChangeHandler = async (status: string) => {
    if (!contact?.id) return;
    try {
      await api.patch(`/contacts/basic/${contact.id}`, {
        status,
      });

      if (contact) {
        contact.status = status;
        setContact({ ...contact });
      }
      enqueue("Stage updated", { variant: "success" });
    } catch (err) {
      console.error("Failed to update stage", err);
      enqueue("Failed to update stage", { variant: "error" });
    }
  };

  const handleFieldUpdate = async (field: string, value: string) => {
    if (!contact?.id) return;
    try {
      await api.patch(`/contacts/basic/${contact.id}`, {
        [field]: value,
      });
      if (contact) {
        (contact as any)[field] = value;
        setContact({ ...contact });
      }
      setUpdateKey((prev) => prev + 1);
      enqueue("Contact updated successfully", { variant: "success" });
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
      enqueue(`Failed to update ${field}`, { variant: "error" });
      throw err;
    }
  };

  const handleRemoveTalkingPoint = async (index: number) => {
    if (!contact?.id) return;
    const updated = talkingPoints.filter((_, i) => i !== index);
    try {
      await api.patch(`/contacts/basic/${contact.id}`, {
        talkingPoints: updated,
      });
      setTalkingPoints(updated);
      enqueue("Talking point removed", { variant: "success" });
    } catch (err) {
      console.error("Failed to remove talking point", err);
      enqueue("Failed to remove talking point", { variant: "error" });
    }
  };

  const getDeals = async () => {
    if (!contact?.id) return;
    try {
      const { data } = await api.get(`/deals?contactId=${contact.id}`);
      setDeals(data || []);
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

  const onCall = () => {
    if (!contact) return;
    navigate("/campaign", {
      state: {
        contactId: contact.id,
        phone: contact.phone,
        autoStart: true,
      },
    });
  };

  if (loading) {
    return <Loading />;
  }

  if (!contact) {
    return (
      <Box p={3}>
        <Typography variant="h6">Contact not found</Typography>
        <Button
          onClick={() => navigate("/contacts")}
          startIcon={<ArrowBackIcon />}
        >
          Back to Contacts
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box mb={3} display="flex" alignItems="center" gap={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/contacts")}
          variant="outlined"
        >
          Back to Contacts
        </Button>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          p: 2,
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
                  {contact.first_name} {contact.last_name}
                </Typography>
                {(contact.title || contact.account?.companyName) && (
                  <Typography variant="body2" color="text.secondary">
                    {contact.title ?? ""}
                    {contact.title ? " at " : ""}
                    {contact.account?.companyName ?? ""}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box>
              <Stack spacing={1}>
                {/* Chips */}
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <ContactStageChip
                    contact={contact}
                    onStageChange={onStageChangeHandler}
                  />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Email fontSize="small" />
                    <Link
                      href={`mailto:${contact.email}`}
                      underline="hover"
                      color="inherit"
                      fontSize="12px"
                    >
                      {contact.email || "No email"}
                    </Link>
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    <Phone fontSize="small" />
                    {!editingPhone && contact.phone ? (
                      <>
                        <Typography fontSize="12px" color="text.secondary">
                          {contact.phone}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => {
                            setNewPhone(contact.phone || "");
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
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
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
                                setNewPhone(contact.phone || "");
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
                  <ContactOverview
                    key={updateKey}
                    contact={contact}
                    onUpdate={handleFieldUpdate}
                    onAccountUpdated={loadContact}
                  />
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
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6">
                              {deal.dealname || deal.name}
                            </Typography>
                            {deal.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                mt={1}
                              >
                                {deal.description}
                              </Typography>
                            )}
                            {deal.amount !== undefined && (
                              <Typography variant="body2" mt={1}>
                                Amount: ${deal.amount.toLocaleString()}
                              </Typography>
                            )}
                            <Stack
                              direction="row"
                              spacing={1}
                              mt={1}
                              flexWrap="wrap"
                            >
                              {deal.pipeline && (
                                <Chip label={deal.pipeline} size="small" />
                              )}
                              {deal.dealstage && (
                                <Chip label={deal.dealstage} size="small" />
                              )}
                              {deal.hs_is_closed && (
                                <Chip
                                  label="Closed"
                                  size="small"
                                  color="success"
                                />
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
              {/* <Button variant="outlined" startIcon={<Add />}>
                Add to sequence
              </Button> */}
              <Button
                variant="contained"
                color="primary"
                startIcon={<Phone />}
                onClick={onCall}
              >
                Call
              </Button>
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
                <Stack direction="row" flexWrap="wrap">
                  {talkingPoints.length > 0 ? (
                    talkingPoints.map((point, idx) => (
                      <Chip
                        key={idx}
                        label={point}
                        onDelete={() => handleRemoveTalkingPoint(idx)}
                        deleteIcon={<Close />}
                        sx={{ m: 0.5 }}
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
              if (!contact?.id) return;
              const updatedPoints = [...talkingPoints, newTalkingPoint.trim()];
              setTalkingPoints(updatedPoints);
              setIsModalOpen(false);
              setNewTalkingPoint("");
              try {
                await api.patch(`/contacts/basic/${contact.id}`, {
                  talkingPoints: updatedPoints,
                });
                enqueue("Talking point added", { variant: "success" });
              } catch (err) {
                enqueue("Failed to add talking point", { variant: "error" });
              }
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
        contactId={contact.id}
        contactEmail={contact.email || ""}
      />

      {/* Add Deal Modal */}
      <AddDealModal
        open={isAddDealModalOpen}
        onClose={() => setIsAddDealModalOpen(false)}
        contactId={contact.id}
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
    </Box>
  );
};

export default ContactDetails;
