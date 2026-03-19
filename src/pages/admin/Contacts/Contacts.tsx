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
  useTheme,
  Button,
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
import { getContactPrimaryPhone } from "../../../utils/getContactPrimaryPhone";
import ContactDrawer from "./components/ContactDrawer";
import { DeleteDialog } from "../../../components/DeleteDialog";
import SelectField from "../../../components/UI/SelectField";
import { useSnackbar } from "../../../hooks/useSnackbar";
import { MoveContactsDialog } from "../../../components/MoveContactsDialog";
import { AssignUnassignedDialog } from "../../../components/AssignUnassignedDialog";
import { useMoveContacts } from "../../../hooks/useMoveContacts";
import Loading from "../../../components/UI/Loading";
import CheckboxField from "../../../components/UI/CheckboxField";

const ContactsPage = () => {
  const theme = useTheme();
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
          (c: Contact) => c.listId == null || c.listId === undefined
        );
        totalCount = data.length;
        data = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
      }

      if (isNoPhone) {
        data = data.filter(
          (c: Contact) => !getContactPrimaryPhone(c) && !c.primaryPhone,
        );
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
        (c: Contact) => c.listId == null || c.listId === undefined
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

  const onSearch = _.debounce((val: string) => {
    setPage(0);
    setSearch(val);
  }, 300);

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
    navigate("/campaign", {
      state: {
        contactId: c.id,
        phone: getContactPrimaryPhone(c) ?? c.primaryPhone ?? "",
        autoStart: false,
      },
    });
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
    <Box p={3}>
      <Box mb={3} display="flex" justifyContent="space-between">
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Contacts
          </Typography>
          <Typography color="text.secondary">Manage your contacts</Typography>
        </Box>
        <Box display="flex" gap={2}>
          {unassignedCount > 0 && (
            <Button
              variant="outlined"
              onClick={() => {
                setAssignUnassignedTargetListId("");
                setAssignUnassignedOpen(true);
              }}
            >
              Assign Unassigned to List
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeleteAllOpen(true)}
          >
            Delete All Contacts
          </Button>
          <Button
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            Create New Contact
          </Button>
        </Box>
      </Box>
      <Stack spacing={1} mb={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
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
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : null,
            }}
            sx={{ width: 300 }}
          />
          <Box display="flex" gap={2}>
            {selectedContactIds.length > 0 && (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    setTargetListId("");
                    setMoveDialogOpen(true);
                  }}
                >
                  Move to List
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setDeleteBulkOpen(true)}
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
        <Loading />
      ) : (
        <TableContainer
          component={Paper}
          elevation={1}
          sx={{
            width: "100%",
            "& .MuiTable-root": { minWidth: 650 },
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
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
                  onClick={() => navigate(`/contacts/${c.id}`)}
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
                    {getContactPrimaryPhone(c) ?? c.primaryPhone ?? "—"}
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
    </Box>
  );
};

export default ContactsPage;
