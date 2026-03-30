import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableContainer,
  Typography,
  CircularProgress,
  TableHead,
  TableRow,
  TableCell,
  TableFooter,
  TablePagination,
  Stack,
  Tooltip,
  useTheme,
  IconButton,
} from "@mui/material";
import {
  Call as CallIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

import { SimpleButton } from "../../../components/UI/SimpleButton";
import useAppStore from "../../../store/useAppStore";
import { useSnackbar } from "../../../hooks/useSnackbar";
import useListManager from "./useListManager";
import ListCard from "./components/ListCard";
import { DeleteDialog } from "../../../components/DeleteDialog";
import { Contact } from "../../../types/contact";
import { getContactPhoneDisplayString } from "../../../utils/getContactPrimaryPhone";

import api from "../../../utils/axiosInstance";

const MAX_LISTS_PER_USER = 10;

const Lists = () => {
  const navigate = useNavigate();
  const lists = useAppStore((state) => state.lists);
  const fetchLists = useAppStore((state) => state.fetchLists);
  const { enqueue } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [showDropped, setShowDropped] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const theme = useTheme();

  const {
    selectedCalls,
    expandedListId,
    eligibleContacts,
    loadingContactsForListId,
    handleExpand,
    handleConnectionChange,
    anchorEl,
    menuListId,
    openMenu,
    closeMenu,
    openDialog,
    setOpenDialog,
    handleDeleteClick,
    handleDelete,
    handleClone,
    cloningId,
    handleRefreshContactsForList,
    listToDelete,
    atListLimit,
  } = useListManager();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      fetchLists();
    } catch {
      enqueue("Failed to load lists", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/contacts?status=dropped", {
        params: { search, page: page + 1, limit: rowsPerPage },
      });
      setContacts(res.data.data);
      setTotal(res.data.total);
    } catch {
      enqueue("Failed to load lists", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadContacts();
  }, [load, loadContacts]);

  const onCall = (c: Contact) => {
    navigate("/campaign", {
      state: { contactId: c.id, autoStart: false },
    });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Lists
          </Typography>
          <Typography color="text.secondary">
            Manage your prospect lists for outreach campaigns
          </Typography>
        </Box>
        <Box>
          <SimpleButton
            label="Import New Contacts"
            onClick={() => navigate("/import-contacts")}
            color="info"
          />
          <Tooltip
            title={
              atListLimit
                ? `Maximum ${MAX_LISTS_PER_USER} lists per user. Delete a list to create a new one.`
                : "Create New List"
            }
          >
            <span>
              <SimpleButton
                label="Create New List"
                onClick={() => !atListLimit && navigate("/create-new-list")}
                color="info"
                disabled={atListLimit}
              />
            </span>
          </Tooltip>
          <SimpleButton
            label={`${!showDropped ? "Show" : "Hide"} Dropped Calls`}
            onClick={() => setShowDropped(!showDropped)}
            color="warning"
          />
        </Box>
      </Box>

      <Box>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 6,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            {!showDropped ? (
              <TableContainer sx={{ width: "100%", mb: 1 }}>
                <Table size="medium" sx={{ width: "100%" }}>
                  <TableBody>
                    {lists &&
                      lists.map((list) => (
                        <ListCard
                          key={list.id}
                          list={list}
                          selectedCall={selectedCalls[list.id]}
                          expanded={expandedListId === list.id}
                          eligibleContacts={eligibleContacts[list.id]}
                          loadingContacts={loadingContactsForListId === list.id}
                          onExpand={handleExpand}
                          onConnectionClick={openMenu}
                          onConnectionChange={handleConnectionChange}
                          anchorEl={anchorEl}
                          menuListId={menuListId}
                          closeMenu={closeMenu}
                          onDeleteClick={handleDeleteClick}
                          onCloneClick={handleClone}
                          cloningId={cloningId}
                          atListLimit={atListLimit}
                          onContactRemoved={handleRefreshContactsForList}
                        />
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
                    <TableRow
                      sx={{ backgroundColor: theme.palette.action.hover }}
                    >
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
                      <TableRow key={c.id} hover sx={{ cursor: "pointer" }}>
                        <TableCell sx={{ py: 1.5 }}>
                          {c.first_name} {c.last_name}
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>{c.company}</TableCell>
                        <TableCell sx={{ py: 1.5 }}>{c.email}</TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          {getContactPhoneDisplayString(c) || "—"}
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
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
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>

                  <TableFooter>
                    <TableRow>
                      <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
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
          </>
        )}
      </Box>

      <DeleteDialog
        open={openDialog}
        title="Confirm Deletion"
        text="Are you sure you want to delete this list?"
        onClose={() => setOpenDialog(false)}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

export default Lists;
