import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Phone,
  Email,
  Person,
  Close,
  Edit,
  Delete,
  CallEnd,
} from "@mui/icons-material";

import api from "../../../../utils/axiosInstance";
import { CallSession, Contact } from "../../../../types/contact";
import { useSnackbar } from "../../../../hooks/useSnackbar";
import { List } from "voice-javascript-common";
import useAppStore from "../../../../store/useAppStore";

import ContactStageChip from "./ContactStageChip";
import SendEmailModal from "../../../../components/SendEmailModal";
import AddDealModal from "./AddDealModal";
import EditDealModal from "./EditDealModal";
import { DeleteDialog } from "../../../../components/DeleteDialog";
import ContactAccountModal from "./ContactAccountModal";
import ContactTimezoneModal from "./ContactTimezoneModal";

import { AccountFieldsCard } from "../../Contacts/components/AccountFieldsCard";
import { ProspectFieldsCard } from "../../Contacts/components/ProspectFieldsCard";
import { NotesCard } from "../../Contacts/components/NotesCard";
import { ContactHistoryTimeline } from "../../Contacts/components/ContactHistoryTimeline";

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
  "Dashboard",
  "Sequences",
  "Deals",
  "Conversations",
  "Meetings",
];

const SingleCallCampaignPanel: React.FC<SingleCallCampaignPanelProps> = ({
  session,
  onStartCall,
  onEndCall,
  onAccountUpdated,
  manual,
  callStarted,
}) => {
  const navigate = useNavigate();
  const { settings } = useAppStore();
  const userTimeZone = settings?.["General Settings"]?.timezone as
    | string
    | undefined;

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
  const [openAccountModal, setOpenAccountModal] = useState(false);
  const [openTimezoneModal, setOpenTimezoneModal] = useState(false);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const { data } = await api.get<List[]>("/lists");
        setLists(data.map((list) => ({ id: list.id, listName: list.listName })));
      } catch (error) {
        console.error("Failed to fetch lists:", error);
      }
    };
    fetchLists();
  }, []);

  useEffect(() => {
    if (addToListAnchor) {
      const fetchLists = async () => {
        try {
          const { data } = await api.get<List[]>("/lists");
          setLists(
            data.map((list) => ({ id: list.id, listName: list.listName }))
          );
        } catch (error) {
          console.error("Failed to fetch lists:", error);
        }
      };
      fetchLists();
    }
  }, [addToListAnchor]);

  useEffect(() => {
    if (activeTab === 2) {
      getDeals();
    }
  }, [activeTab]);

  const { enqueue } = useSnackbar();

  const handleAddToList = async () => {
    if (!selectedListId || !session.id) return;
    try {
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
      enqueue(
        error.response?.data?.message || "Failed to add contact to list",
        { variant: "error" }
      );
    }
  };

  const onPhoneSubmitHandler = async () => {
    try {
      await api.patch(`/contacts/basic/${session.id}`, { phone: newPhone });
      (session as any).phone = newPhone;
      setEditingPhone(false);
      setNewPhone("");
    } catch (err) {
      console.error("Failed to update phone number", err);
    }
  };

  const onStageChangeHandler = async (status: string) => {
    try {
      await api.patch(`/contacts/basic/${session.id}`, { status });
      (session as any).status = status;
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleFieldUpdate = async (field: string, value: string) => {
    try {
      await api.patch(`/contacts/basic/${session.id}`, { [field]: value });
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
      setDeals(data || []);
    } catch (error) {
      setDeals([]);
    }
  };

  const handleDeleteDeal = async () => {
    if (!dealToDelete?.id) return;
    try {
      await api.delete(`/deals/${dealToDelete.id}`);
      enqueue("Deal deleted successfully", { variant: "success" });
      setIsDeleteDealDialogOpen(false);
      setDealToDelete(null);
      getDeals();
    } catch (error: any) {
      enqueue(
        error.response?.data?.message || "Failed to delete deal",
        { variant: "error" }
      );
    }
  };

  const handleOpenAddToList = (e: React.MouseEvent) => {
    setAddToListAnchor(e.currentTarget);
  };

  const handleCall = () => {
    if (onStartCall) {
      onStartCall();
    } else if (session.phone) {
      navigate("/campaign", {
        state: {
          contactId: session.id,
          phone: session.phone,
          autoStart: true,
        },
      });
    }
  };

  const contactListName = session.listId
    ? lists.find((l) => l.id === session.listId)?.listName
    : undefined;

  const companyName =
    (session as any).account?.companyName || (session as any).company;

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          display: "flex",
          flexDirection: "column",
          borderRadius: 2,
          p: 2,
          mt: 2,
          backgroundColor: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main" }}>
              <Person sx={{ fontSize: 36 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {session.first_name} {session.last_name}
              </Typography>
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Typography variant="body2" color="text.secondary">
                  {session.phone || "No phone"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {companyName ? ` - ${companyName}` : ""}
                </Typography>
              </Stack>
              {(session.title || companyName) && (
                <Typography variant="body2" color="text.secondary">
                  {session.title ?? ""}
                  {session.title ? " at " : ""}
                  {companyName ?? ""}
                </Typography>
              )}
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {!manual && callStarted && (
              <Button
                variant="contained"
                color="error"
                startIcon={<CallEnd />}
                onClick={onEndCall}
              >
                End Call
              </Button>
            )}
          </Box>
        </Box>

        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
          sx={{ mt: 2 }}
          alignItems="center"
        >
          <ContactStageChip
            contact={session}
            onStageChange={onStageChangeHandler}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <Email fontSize="small" />
            <Link
              href={`mailto:${session.email}`}
              underline="hover"
              color="primary"
              fontSize="13px"
            >
              {session.email || "No email"}
            </Link>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {session.phone ? (
              <Tooltip title="Call contact">
                <IconButton
                  onClick={handleCall}
                  size="small"
                  sx={{
                    bgcolor: "#7C3AED",
                    color: "white",
                    "&:hover": { bgcolor: "#6D28D9" },
                    width: 32,
                    height: 32,
                  }}
                >
                  <Phone sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            ) : (
              <Phone fontSize="small" color="action" />
            )}
            {!editingPhone && session.phone ? (
              <>
                <Typography fontSize="13px" color="text.secondary">
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
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="Enter phone"
                      size="small"
                      autoFocus
                      sx={{ "& .MuiInputBase-root": { fontSize: "12px" } }}
                    />
                    <Button size="small" onClick={onPhoneSubmitHandler}>
                      Add
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setEditingPhone(false)}
                      color="inherit"
                    >
                      Cancel
                    </Button>
                  </Stack>
                ) : (
                  <>
                    <Typography fontSize="12px" color="text.secondary">
                      No phone number
                    </Typography>
                    <Typography
                      fontSize="0.9rem"
                      color="primary.main"
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

        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            mt: 2,
            "& .MuiTab-root": { textTransform: "none" },
            "& .Mui-selected": { color: "#8A3FFC" },
            "& .MuiTabs-indicator": { bgcolor: "#8A3FFC" },
          }}
        >
          {tabLabels.map((label, idx) => (
            <Tab key={idx} label={label} />
          ))}
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Left column ~33% */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <AccountFieldsCard
                contact={session as Contact}
                defaultExpanded={true}
                onEditAccount={() => setOpenAccountModal(true)}
              />
              <ProspectFieldsCard
                key={updateKey}
                contact={session as Contact}
                defaultExpanded={true}
                userTimeZone={userTimeZone}
                onUpdate={handleFieldUpdate}
                onEditTimezone={() => setOpenTimezoneModal(true)}
              />
              <NotesCard onAddNote={() => {}} />
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  p: 2,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Talking Points
                </Typography>
                <Stack direction="row" flexWrap="wrap" spacing={0.5}>
                  {talkingPoints.length > 0 ? (
                    talkingPoints.map((point, idx) => (
                      <Chip
                        key={idx}
                        label={point}
                        onDelete={() => handleRemoveTalkingPoint(idx)}
                        deleteIcon={<Close />}
                        size="small"
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
            </Stack>
          </Grid>

          {/* Right column ~66% */}
          <Grid item xs={12} md={8}>
            <ContactHistoryTimeline
              contactId={session.id}
              contactListId={session.listId}
              listName={contactListName}
              onAddToList={handleOpenAddToList}
              onAddTask={() => {}}
              onNewEmail={() => setIsSendEmailModalOpen(true)}
              onNewSms={() => {}}
              onResultChange={() => setUpdateKey((k) => k + 1)}
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

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogTitle>Add Talking Point</DialogTitle>
        <Divider />
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
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

      <Popover
        open={Boolean(addToListAnchor)}
        anchorEl={addToListAnchor}
        onClose={() => {
          setAddToListAnchor(null);
          setSelectedListId(null);
          setListSearch("");
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
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
            onInputChange={(_, newInputValue) => setListSearch(newInputValue)}
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

      <SendEmailModal
        open={isSendEmailModalOpen}
        onClose={() => setIsSendEmailModalOpen(false)}
        contactId={session.id}
        contactEmail={session.email || ""}
      />

      <AddDealModal
        open={isAddDealModalOpen}
        onClose={() => setIsAddDealModalOpen(false)}
        contactId={session.id}
        onSuccess={getDeals}
      />

      <EditDealModal
        open={isEditDealModalOpen}
        onClose={() => {
          setIsEditDealModalOpen(false);
          setSelectedDeal(null);
        }}
        deal={selectedDeal}
        onSuccess={getDeals}
      />

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

      <ContactAccountModal
        open={openAccountModal}
        onClose={() => setOpenAccountModal(false)}
        contact={session as Contact}
        onSaved={() => {
          setOpenAccountModal(false);
          onAccountUpdated?.();
        }}
      />

      <ContactTimezoneModal
        open={openTimezoneModal}
        onClose={() => setOpenTimezoneModal(false)}
        value={session.timezone || ""}
        onSave={
          handleFieldUpdate
            ? (tz) => handleFieldUpdate("timezone", tz)
            : async () => {}
        }
      />
    </>
  );
};

export default SingleCallCampaignPanel;
