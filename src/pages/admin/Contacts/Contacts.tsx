import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Stack,
  TextField,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  TablePagination,
  IconButton,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Typography,
  Button,
  Container,
} from "@mui/material";
import {
  Call as CallIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import _ from "lodash";
import { List } from "voice-javascript-common";

import api from "../../../utils/axiosInstance";
import { Contact } from "../../../types/contact";
import { getContactPhoneDisplayString } from "../../../utils/getContactPrimaryPhone";
import ContactDrawer from "./components/ContactDrawer";
import { DeleteDialog } from "../../../components/DeleteDialog";
import SelectField from "../../../components/UI/SelectField";
import { useSnackbar } from "../../../hooks/useSnackbar";
import { MoveContactsDialog } from "../../../components/MoveContactsDialog";
import { AssignUnassignedDialog } from "../../../components/AssignUnassignedDialog";
import { useMoveContacts } from "../../../hooks/useMoveContacts";
import Loading from "../../../components/UI/Loading";
import CheckboxField from "../../../components/UI/CheckboxField";
import {
  campaignV2,
  campaignV2CardSx,
  campaignV2SectionTitleSx,
} from "../Campaign/components/campaignV2Tokens";

const primaryButtonSx = {
  textTransform: "none" as const,
  fontWeight: 700,
  color: "#fff",
  backgroundColor: campaignV2.accent,
  boxShadow: campaignV2.ctaShadow,
  "&:hover": {
    background: campaignV2.accentDark,
    color: "#fff",
  },
  "&.Mui-disabled": {
    color: "rgba(255, 255, 255, 0.65)",
  },
};

const outlinedSecondarySx = {
  textTransform: "none" as const,
  fontWeight: 700,
  borderColor: campaignV2.accent,
  color: campaignV2.accent,
  "&:hover": {
    borderColor: campaignV2.accentDark,
    bgcolor: campaignV2.subtleFill,
  },
};

const tableHeadRowSx = {
  bgcolor: campaignV2.tableHeaderFill,
  borderBottom: campaignV2.tableDivider,
};

const searchFieldSx = {
  width: 300,
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: campaignV2.outlineBorder,
    },
  },
};

const accentIconButtonSx = {
  color: campaignV2.accent,
  "&:hover": {
    color: campaignV2.accentDark,
    bgcolor: campaignV2.rowSelectedFill,
  },
};

const ContactsPage = () => {
  const { enqueue } = useSnackbar();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [lists, setLists] = useState<List[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [targetListId, setTargetListId] = useState("");
  const [assignUnassignedOpen, setAssignUnassignedOpen] = useState(false);
  const [assignUnassignedTargetListId, setAssignUnassignedTargetListId] =
    useState("");
  const [assigningUnassigned, setAssigningUnassigned] = useState(false);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [deleteBulkOpen, setDeleteBulkOpen] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [noPhoneStats, setNoPhoneStats] = useState<{
    withoutPhone: number;
    total: number;
    percentage: number;
  } | null>(null);

// START PUSH CODE HUBSPOT
  const [pushingToHubspot, setPushingToHubspot] = useState(false);

  const onPushToHubspot = async () => {
    if (pushingToHubspot || selectedContactIds.length === 0) return;
    
    setPushingToHubspot(true);
    try {
      // NOTE: If you don't have a `currentUser.id` available in this component, 
      // you can either import your auth context (e.g., `const { user } = useAuth();`) 
      // or change your backend route to rely on `req.user!.id` instead of sending it here.
      const res = await api.post("/hubspot/bulk-push", { 
        ids: selectedContactIds,
      });
      
      enqueue(res.data.message || `Successfully pushed to HubSpot`, { variant: "success" });
      setSelectedContactIds([]);
      load();
    } catch (err: any) {
      enqueue(err.response?.data?.error || "Failed to push to HubSpot", { variant: "error" });
    } finally {
      setPushingToHubspot(false);
    }
  };
  // END OF PUSH CODE HUBSPOT

  const { moveContacts } = useMoveContacts({
    onMoved: (moved: number, skipped: number) => {
      enqueue(`moved: ${moved} skipped: ${skipped}`, { variant: "success" });

      setMoveDialogOpen(false);
      setSelectedContactIds([]);
      load();
    },
  });

  const onMoveConfirmHandler = async () => {
    await moveContacts(selectedListId, targetListId, selectedContactIds);
  };

  const onAssignUnassignedConfirm = async () => {
    if (assigningUnassigned || !assignUnassignedTargetListId) return;
    setAssigningUnassigned(true);
    try {
      await api.post("/contacts/assign-unassigned", {
        listId: assignUnassignedTargetListId,
      });
      enqueue("Unassigned contacts assigned to list", { variant: "success" });
      setAssignUnassignedOpen(false);
      setAssignUnassignedTargetListId("");
      await load();
      loadUnassignedCount();
    } catch {
      enqueue("Failed to assign unassigned contacts", { variant: "error" });
    } finally {
      setAssigningUnassigned(false);
    }
  };

  const loadNoPhoneStats = useCallback(async () => {
    try {
      const res = await api.get("/contacts/stats/no-phone");
      setNoPhoneStats(res.data);
    } catch {
      setNoPhoneStats(null);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const isUnassigned = selectedListId === "__unassigned__";
      const isNoPhone = selectedListId === "__no_phone__";
      const res = await api.get("/contacts", {
        params: {
          search,
          page: isUnassigned || isNoPhone ? 1 : page + 1,
          limit: isUnassigned || isNoPhone ? 10000 : rowsPerPage,
          listId:
            isUnassigned || isNoPhone ? undefined : selectedListId || undefined,
        },
      });
      let data = res.data.data || [];
      let totalCount = res.data.total || 0;

      if (isUnassigned) {
        data = data.filter(
          (c: Contact) => c.listId == null || c.listId === undefined,
        );
        totalCount = data.length;
        data = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
      }

      if (isNoPhone) {
        data = data.filter((c: Contact) => !getContactPhoneDisplayString(c));
        totalCount = data.length;
        data = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
      }

      setContacts(data);
      setTotal(totalCount);
      loadNoPhoneStats();
    } catch {
      enqueue("Failed to load contacts", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, page, rowsPerPage, selectedListId, enqueue, loadNoPhoneStats]);

  const loadLists = async () => {
    try {
      const res = await api.get("/lists");
      setLists(
        res.data.map((list: List) => ({
          id: list.id,
          listName: list.listName,
        })),
      );
    } catch {
      enqueue("Failed to load lists", { variant: "error" });
    }
  };

  const loadUnassignedCount = useCallback(async () => {
    if (selectedListId === "__unassigned__") {
      setUnassignedCount(total);
      return;
    }
    try {
      const res = await api.get("/contacts", {
        params: { limit: 10000, page: 1 },
      });
      const data = res.data.data || [];
      const count = data.filter(
        (c: Contact) => c.listId == null || c.listId === undefined,
      ).length;
      setUnassignedCount(count);
    } catch {
      setUnassignedCount(0);
    }
  }, [selectedListId, total]);

  const debouncedSetSearch = useMemo(
    () =>
      _.debounce((val: string) => {
        setPage(0);
        setSearch(val);
      }, 300),
    [],
  );
  useEffect(() => {
    return () => debouncedSetSearch.cancel();
  }, [debouncedSetSearch]);
  const onSearchChange = (val: string) => {
    setSearchInput(val);
    debouncedSetSearch(val);
  };

  const onDelete = async (c: Contact) => {
    if (deletingInProgress) return;
    setDeletingInProgress(true);
    try {
      await api.delete(`/contacts/${c.id}`);
      enqueue("Deleted", { variant: "success" });
      setDeleting(null);
      load();
    } catch {
      enqueue("Failed to delete contact", { variant: "error" });
    } finally {
      setDeletingInProgress(false);
    }
  };

  const onDeleteAll = async () => {
    if (deletingAll) return;
    setDeletingAll(true);
    try {
      await api.delete("/contacts/all-contacts");
      enqueue("All contacts deleted", { variant: "success" });
      setDeleteAllOpen(false);
      load();
    } catch {
      enqueue("Failed to delete all contacts", { variant: "error" });
    } finally {
      setDeletingAll(false);
    }
  };

  const onDeleteBulk = async () => {
    if (deletingBulk || selectedContactIds.length === 0) return;
    setDeletingBulk(true);
    try {
      await api.delete("/contacts/bulk", { data: { ids: selectedContactIds } });
      enqueue(`Deleted ${selectedContactIds.length} contact(s)`, {
        variant: "success",
      });
      setDeleteBulkOpen(false);
      setSelectedContactIds([]);
      load();
    } catch {
      enqueue("Failed to delete selected contacts", { variant: "error" });
    } finally {
      setDeletingBulk(false);
    }
  };

  const onCall = (c: Contact) => {
    navigate(`/campaign?contactId=${encodeURIComponent(c.id)}`, {
      state: {
        phone: getContactPhoneDisplayString(c),
        autoStart: false,
      },
    });
  };

  const openContactOnCampaign = (c: Contact) => {
    navigate(`/campaign?contactId=${encodeURIComponent(c.id)}`);
  };

  useEffect(() => {
    load();
    setSelectedContactIds([]);
  }, [load]);

  useEffect(() => {
    loadLists();
  }, []);

  useEffect(() => {
    loadUnassignedCount();
  }, [loadUnassignedCount]);

  useEffect(() => {
    loadNoPhoneStats();
  }, [loadNoPhoneStats]);

  return (
    <Container
      maxWidth={false}
      sx={{
        py: 3,
        px: { xs: 2, sm: 3 },
        bgcolor: campaignV2.pageBg,
        minHeight: "100%",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "flex-start" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography sx={campaignV2SectionTitleSx}>CRM</Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
            Contacts
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Manage your contacts
          </Typography>
        </Box>
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1}
          justifyContent={{ xs: "flex-start", md: "flex-end" }}
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          {unassignedCount > 0 && (
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                setAssignUnassignedTargetListId("");
                setAssignUnassignedOpen(true);
              }}
              sx={outlinedSecondarySx}
            >
              Assign Unassigned to List
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeleteAllOpen(true)}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Delete All Contacts
          </Button>
          <Button
            variant="contained"
            color="inherit"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(null);
              setDrawerOpen(true);
            }}
            sx={primaryButtonSx}
          >
            Create New Contact
          </Button>
        </Stack>
      </Stack>
      <Stack spacing={1} mb={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <TextField
            size="small"
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: loading ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} sx={{ color: campaignV2.accent }} />
                </InputAdornment>
              ) : null,
            }}
            sx={searchFieldSx}
          />
          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            {selectedContactIds.length > 0 && (
              <>
              {/*  NEW HUBSPOT BUTTON START*/}
                <Button
                  variant="outlined"
                  color="info"
                  onClick={onPushToHubspot}
                  disabled={pushingToHubspot}
                >
                  {pushingToHubspot 
                    ? <CircularProgress size={20} color="inherit" /> 
                    : `Push to HubSpot (${selectedContactIds.length})`
                  }
                </Button>
                {/* NEW HUBSPOT BUTTON END */}
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    setTargetListId("");
                    setMoveDialogOpen(true);
                  }}
                  sx={outlinedSecondarySx}
                >
                  Move to List
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setDeleteBulkOpen(true)}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Delete Selected ({selectedContactIds.length})
                </Button>
              </>
            )}
            <SelectField
              items={[
                { id: "__unassigned__", listName: "Unassigned from list" },
                {
                  id: "__no_phone__",
                  listName: "Contacts with no phone number",
                },
                ...lists,
              ]}
              label="Filter by"
              value={selectedListId}
              onChange={(val) => {
                setSelectedListId(val);
                setPage(0);
              }}
              getValue={(l) => l.id}
              getLabel={(l) => l.listName}
              placeholder="All lists"
            />
          </Box>
        </Stack>
        {noPhoneStats != null && noPhoneStats.total > 0 && (
          <Tooltip
            title={
              <Typography component="span">
                {noPhoneStats.withoutPhone} of {noPhoneStats.total} contacts (
                <strong>{noPhoneStats.percentage}%</strong>) have no phone number
              </Typography>
            }
          >
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight="bold"
              sx={{ cursor: "help", alignSelf: "flex-start" }}
            >
              Contacts with no phone number: {noPhoneStats.withoutPhone} (
              {noPhoneStats.percentage}%)
            </Typography>
          </Tooltip>
        )}
      </Stack>

      {loading ? (
        <Paper
          variant="outlined"
          sx={{
            ...campaignV2CardSx,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 120,
          }}
        >
          <Loading />
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            ...campaignV2CardSx,
            width: "100%",
            "& .MuiTable-root": { minWidth: 650 },
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell padding="checkbox">
                  <CheckboxField
                    label=""
                    checked={
                      contacts.length > 0 &&
                      selectedContactIds.length === contacts.length
                    }
                    indeterminate={
                      selectedContactIds.length > 0 &&
                      selectedContactIds.length < contacts.length
                    }
                    onChange={(checked) => {
                      if (checked) {
                        setSelectedContactIds(contacts.map((c) => c.id));
                      } else {
                        setSelectedContactIds([]);
                      }
                    }}
                  />
                </TableCell>
                {["Name", "Company", "Email", "Number", "Actions"].map(
                  (header) => (
                    <TableCell
                      key={header}
                      sx={{
                        fontWeight: 600,
                        textTransform: "uppercase",
                        py: 1.5,
                      }}
                    >
                      {header}
                    </TableCell>
                  ),
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {contacts.map((c) => (
                <TableRow
                  key={c.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => openContactOnCampaign(c)}
                >
                  <TableCell
                    padding="checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CheckboxField
                      label=""
                      checked={selectedContactIds.includes(c.id)}
                      onChange={(checked) => {
                        if (checked) {
                          setSelectedContactIds((prev) => [...prev, c.id]);
                        } else {
                          setSelectedContactIds((prev) =>
                            prev.filter((id) => id !== c.id),
                          );
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    {c.first_name} {c.last_name}
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    {c.account?.companyName}
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>{c.email}</TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    {getContactPhoneDisplayString(c) || "—"}
                  </TableCell>
                  <TableCell
                    sx={{ py: 1.5 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(c);
                            setDrawerOpen(true);
                          }}
                          sx={accentIconButtonSx}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Call">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCall(c);
                          }}
                          sx={accentIconButtonSx}
                        >
                          <CallIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleting(c);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  count={total}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  component="td"
                  onPageChange={(_, p) => setPage(p)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(+e.target.value);
                    setPage(0);
                  }}
                  sx={{
                    "& .MuiTablePagination-toolbar": {
                      px: 2,
                      py: 1,
                    },
                  }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
      <ContactDrawer
        open={drawerOpen}
        contact={editing}
        lists={lists}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false);
          load();
        }}
      />
      <DeleteDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => onDelete(deleting!)}
        title="Delete Contact?"
        text={`Are you sure you want to delete ${deleting?.first_name} ${deleting?.last_name}?`}
        confirmDisabled={deletingInProgress}
      />
      <DeleteDialog
        open={deleteAllOpen}
        onClose={() => !deletingAll && setDeleteAllOpen(false)}
        onConfirm={onDeleteAll}
        title="Delete All Contacts?"
        text="Are you sure you want to delete all contacts? This action cannot be undone."
        confirmDisabled={deletingAll}
      />
      <DeleteDialog
        open={deleteBulkOpen}
        onClose={() => !deletingBulk && setDeleteBulkOpen(false)}
        onConfirm={onDeleteBulk}
        title="Delete Selected Contacts?"
        text={`Are you sure you want to delete ${selectedContactIds.length} selected contact(s)? This action cannot be undone.`}
        confirmDisabled={deletingBulk}
      />
      <MoveContactsDialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        onConfirm={onMoveConfirmHandler}
        lists={lists}
        selectedListId={selectedListId}
        targetListId={targetListId}
        setTargetListId={setTargetListId}
      />
      <AssignUnassignedDialog
        open={assignUnassignedOpen}
        onClose={() => !assigningUnassigned && setAssignUnassignedOpen(false)}
        onConfirm={onAssignUnassignedConfirm}
        lists={lists}
        targetListId={assignUnassignedTargetListId}
        setTargetListId={setAssignUnassignedTargetListId}
        loading={assigningUnassigned}
      />
    </Container>
  );
};

export default ContactsPage;
