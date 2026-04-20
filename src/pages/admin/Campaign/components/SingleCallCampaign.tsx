import React, { useState, useEffect, ReactNode } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Avatar,
  Tabs,
  Tab,
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
  Add,
  Phone,
  Email,
  Close,
  Edit,
  Delete,
  PlaylistAdd,
  CallEnd,
} from "@mui/icons-material";

import { PhoneFieldWithDropdown } from "../../../../components/atoms/PhoneFieldWithDropdown";
import {
  getContactPhoneDisplayString,
  type DialCallPayload,
} from "../../../../utils/getContactPrimaryPhone";
import { formatContactTitleCompanyLine } from "../../../../utils/formatContactTitleCompanyLine";
import ContactStageChip from "./ContactStageChip";
import SendEmailModal from "../../../../components/SendEmailModal";
import AddDealModal from "./AddDealModal";
import EditDealModal from "./EditDealModal";
import { DeleteDialog } from "../../../../components/DeleteDialog";
import { CampaignV2ThemeProvider } from "./CampaignV2ThemeProvider";
import { CampaignAccountFields } from "./CampaignAccountFields";
import { CampaignProspectFields } from "./CampaignProspectFields";
import { ContactActivityTimeline } from "./ContactActivityTimeline";
import { ContactEmailRepliesSection } from "./ContactEmailRepliesSection";
import { campaignV2, campaignV2CardSx, campaignV2SectionTitleSx } from "./campaignV2Tokens";

import api from "../../../../utils/axiosInstance";
import { CallSession, Contact } from "../../../../types/contact";
import { useSnackbar } from "../../../../hooks/useSnackbar";
import { List } from "voice-javascript-common";

interface SingleCallCampaignPanelProps {
  session: CallSession;
  answeredSession: Contact | null;
  /** Primary: `{ number }` only; menu: `{ number, slot }`. */
  onStartCall?: (payload: DialCallPayload) => void;
  onEndCall: () => void;
  onAccountUpdated?: () => void | Promise<void>;
  manual?: boolean;
  phone?: string;
  autoStart?: boolean;
  callStarted?: boolean;
  isStartCallDisabled?: boolean;
  handleNumpadClick: (char: string) => void;
  /** CallBar (and optional siblings) rendered to the right of contact in the header */
  headerRight?: ReactNode;
  /** e.g. batch Start / Stop campaign row under CallBar */
  headerBelowCallBar?: ReactNode;
  /** Socket / error alerts shown under batch controls in embedded header */
  headerAlerts?: ReactNode;
  /** Bumps ContactActivityTimeline refetch after disposition save */
  timelineRefreshKey?: number;
}

function contactInitials(s: CallSession): string {
  const a = (s.first_name || "").trim().charAt(0);
  const b = (s.last_name || "").trim().charAt(0);
  const out = `${a}${b}`.toUpperCase();
  return out || "?";
}

const SingleCallCampaignPanel: React.FC<SingleCallCampaignPanelProps> = ({
  session,
  answeredSession: _answeredSession,
  onStartCall,
  onEndCall,
  onAccountUpdated,
  manual,
  phone,
  autoStart,
  callStarted,
  isStartCallDisabled = false,
  handleNumpadClick: _handleNumpadClick,
  headerRight,
  headerBelowCallBar,
  headerAlerts,
  timelineRefreshKey = 0,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [talkingPoints, setTalkingPoints] = useState<string[]>(
    Array.isArray(session.talkingPoints) ? session.talkingPoints : [],
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
    setTalkingPoints(
      Array.isArray(session.talkingPoints) ? session.talkingPoints : [],
    );
  }, [session.id, session.talkingPoints]);

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
      void fetchLists();
    }
  }, [addToListAnchor]);

  useEffect(() => {
    if (activeTab === 2) {
      void getDeals();
    }
  }, [activeTab, session.id]);

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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message || "Failed to add contact to list";
      enqueue(errorMessage, { variant: "error" });
    }
  };

  const handlePhoneUpdate = async (
    p: import("../../../../types/contact").ContactPhone,
  ) => {
    try {
      await api.patch(`/contacts/basic/${session.id}`, { phone: p });
      Object.assign(session, { phone: p });
      setUpdateKey((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to update phone number", err);
      throw err;
    }
  };

  const onStageChangeHandler = async (status: string) => {
    try {
      await api.patch(`/contacts/basic/${session.id}`, {
        status,
      });
      session.status = status;
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleFieldUpdate = async (
    field: string,
    value: string | import("../../../../types/contact").ContactPhone,
  ) => {
    try {
      await api.patch(`/contacts/basic/${session.id}`, {
        [field]: value,
      });
      (session as Record<string, unknown>)[field] = value;
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
      void getDeals();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message || "Failed to delete deal";
      enqueue(errorMessage, { variant: "error" });
    }
  };

  const titleCompanyLine = formatContactTitleCompanyLine(
    session.title,
    session.account?.companyName,
  );

  const showHeaderQuickActions = Boolean(headerRight);

  const headerCampaignActionButtons = showHeaderQuickActions ? (
    <Stack
      direction="row"
      flexWrap="wrap"
      gap={1}
      justifyContent="flex-start"
      sx={{ mt: headerBelowCallBar ? 1.25 : 1.5 }}
    >
      {manual && onStartCall && !callStarted && !autoStart && (
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<Phone />}
          disabled={isStartCallDisabled}
          onClick={() => {
            const n =
              getContactPhoneDisplayString(session) || (phone ?? "").trim();
            if (!n) return;
            onStartCall({ number: n });
          }}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Call
        </Button>
      )}
      <Button
        variant="outlined"
        color="primary"
        size="small"
        startIcon={<PlaylistAdd />}
        onClick={(e) => setAddToListAnchor(e.currentTarget)}
        sx={{ textTransform: "none", fontWeight: 600 }}
      >
        Add to list
      </Button>
      <Button
        variant="outlined"
        color="primary"
        size="small"
        startIcon={<Email />}
        onClick={() => setIsSendEmailModalOpen(true)}
        sx={{ textTransform: "none", fontWeight: 600 }}
      >
        Send email
      </Button>
      {!manual && (
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<CallEnd />}
          onClick={onEndCall}
          disabled={!callStarted}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          End call
        </Button>
      )}
    </Stack>
  ) : null;

  const talkingPointsCard = (
    <Box sx={{ ...campaignV2CardSx, p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Typography sx={campaignV2SectionTitleSx}>Talking points</Typography>
      </Stack>
      <Stack
        direction="row"
        flexWrap="wrap"
        sx={{ alignItems: "flex-start", minWidth: 0, width: "100%" }}
      >
        {talkingPoints.length > 0 ? (
          talkingPoints.map((point, idx) => (
            <Chip
              key={idx}
              label={point}
              onDelete={() => void handleRemoveTalkingPoint(idx)}
              deleteIcon={<Close />}
              sx={{
                m: 0.5,
                maxWidth: "100%",
                height: "auto",
                alignItems: "flex-start",
                py: 0.75,
                borderColor: "rgba(107, 70, 193, 0.35)",
                "& .MuiChip-label": {
                  whiteSpace: "normal",
                  display: "block",
                  lineHeight: 1.4,
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                },
              }}
              variant="outlined"
            />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No talking points yet.
          </Typography>
        )}
      </Stack>
      <Button
        size="small"
        startIcon={<Add />}
        onClick={() => setIsModalOpen(true)}
        sx={{ mt: 1, color: campaignV2.link, fontWeight: 600 }}
      >
        Add talking point
      </Button>
    </Box>
  );

  return (
    <CampaignV2ThemeProvider>
      <Paper
        variant="outlined"
        sx={{
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          mt: 2,
          overflow: "hidden",
          borderColor: "divider",
          boxShadow: "0 2px 12px rgba(15, 23, 42, 0.06)",
        }}
      >
        <Box sx={{ bgcolor: campaignV2.pageBg, p: 2 }}>
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} md={headerRight ? 5 : 12}>
              <Box display="flex" alignItems="flex-start" gap={2} mb={1}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    fontWeight: 700,
                  }}
                >
                  {contactInitials(session)}
                </Avatar>
                <Box flex={1} minWidth={0}>
                  <Typography variant="h5" fontWeight={700}>
                    {session.first_name} {session.last_name}
                  </Typography>
                  {titleCompanyLine && (
                    <Typography variant="body2" color="text.secondary">
                      {titleCompanyLine}
                    </Typography>
                  )}
                  
                  <Box sx={{ mt: 1.5, maxWidth: 420 }}>
                    <PhoneFieldWithDropdown
                      icon={<Phone color="primary" />}
                      label="Phone"
                      phone={session.phone}
                      onUpdate={handlePhoneUpdate}
                    />
                  </Box>
                  <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 1.5 }}>
                    <ContactStageChip
                      contact={session}
                      onStageChange={onStageChangeHandler}
                    />
                    {session.email && (
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Email sx={{ fontSize: 18, color: campaignV2.accent }} />
                        <Link
                          href={`mailto:${session.email}`}
                          underline="hover"
                          sx={{ fontSize: 13, color: campaignV2.link, fontWeight: 500 }}
                        >
                          {session.email}
                        </Link>
                      </Stack>
                    )}
                  </Stack>
                </Box>
              </Box>
            </Grid>
            {headerRight ? (
              <Grid item xs={12} md={7}>
                <Box sx={{ width: "100%" }}>{headerRight}</Box>
                {headerBelowCallBar ? (
                  <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-start" }}>
                    {headerBelowCallBar}
                  </Box>
                ) : null}
                {headerCampaignActionButtons}
                {headerAlerts ? (
                  <Box sx={{ mt: 1.5, width: "100%" }}>{headerAlerts}</Box>
                ) : null}
              </Grid>
            ) : null}
          </Grid>
        </Box>

        <Box sx={{ px: 2, pt: 1, pb: 2, bgcolor: "#fff" }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              mb: 2,
              "& .MuiTab-root": { color: "text.secondary" },
              "& .MuiTab-root.Mui-selected": {
                color: "primary.main",
                fontWeight: 700,
              },
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: "3px 3px 0 0",
                bgcolor: "primary.main",
              },
            }}
          >
            <Tab label="Dashboard" />
            <Tab label="Activities" />
            <Tab label="Deals" />
          </Tabs>

          {activeTab === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <Stack spacing={2}>
                  <CampaignAccountFields
                    key={`acc-${updateKey}`}
                    contact={session}
                    onAccountUpdated={onAccountUpdated}
                  />
                  <CampaignProspectFields
                    key={`pro-${updateKey}`}
                    contact={session}
                    onUpdate={handleFieldUpdate}
                  />
                </Stack>
              </Grid>
              <Grid item xs={12} md={7}>
                <Stack spacing={2}>
                  {talkingPointsCard}
                  <ContactActivityTimeline
                    contactId={session.id}
                    density="compact"
                    compactMaxHeight={420}
                    refreshKey={timelineRefreshKey}
                  />
                </Stack>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Stack spacing={3}>
              <ContactActivityTimeline
                contactId={session.id}
                density="comfortable"
                showToolbar
                refreshKey={timelineRefreshKey}
              />
              <ContactEmailRepliesSection
                contactId={session.id}
                active={activeTab === 1}
              />
            </Stack>
          )}

          {activeTab === 2 && (
            <Box px={{ xs: 0, sm: 1 }} py={1}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                flexWrap="wrap"
                gap={1}
              >
                <Typography variant="h6" fontWeight={700}>
                  Deals
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Add />}
                  onClick={() => setIsAddDealModalOpen(true)}
                >
                  Add deal
                </Button>
              </Box>
              {deals.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                  No deals yet.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {deals.map((deal) => (
                    <Paper
                      key={deal.id}
                      variant="outlined"
                      sx={{ ...campaignV2CardSx, p: 2 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
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
                              <Chip label={deal.pipeline} size="small" variant="outlined" />
                            )}
                            {deal.dealstage && (
                              <Chip label={deal.dealstage} size="small" variant="outlined" />
                            )}
                            {deal.hs_is_closed && (
                              <Chip label="Closed" size="small" color="success" />
                            )}
                          </Stack>
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ ml: { sm: 2 } }}>
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
        </Box>
      </Paper>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogTitle>Add talking point</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            variant="outlined"
            label="Talking point"
            value={newTalkingPoint}
            onChange={(e) => setNewTalkingPoint(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
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
            Add to list
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
              color="primary"
              onClick={() => void handleAddToList()}
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
        onSuccess={() => {
          void getDeals();
        }}
      />

      <EditDealModal
        open={isEditDealModalOpen}
        onClose={() => {
          setIsEditDealModalOpen(false);
          setSelectedDeal(null);
        }}
        deal={selectedDeal}
        onSuccess={() => {
          void getDeals();
        }}
      />

      <DeleteDialog
        open={isDeleteDealDialogOpen}
        title="Delete deal"
        text={`Are you sure you want to delete "${dealToDelete?.dealname || dealToDelete?.name || "this deal"}"? This action cannot be undone.`}
        onClose={() => {
          setIsDeleteDealDialogOpen(false);
          setDealToDelete(null);
        }}
        onConfirm={() => void handleDeleteDeal()}
      />
    </CampaignV2ThemeProvider>
  );
};

export default SingleCallCampaignPanel;
