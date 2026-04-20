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
  IconButton,
  Container,
} from "@mui/material";
import { Call as CallIcon } from "@mui/icons-material";

import { SimpleButton } from "../../../components/UI/SimpleButton";
import useAppStore from "../../../store/useAppStore";
import { useSnackbar } from "../../../hooks/useSnackbar";
import useListManager from "./useListManager";
import ListCard from "./components/ListCard";
import DeleteListDialog from "./components/DeleteListDialog";
import { Contact } from "../../../types/contact";
import { getContactPhoneDisplayString } from "../../../utils/getContactPrimaryPhone";
import {
  campaignV2,
  campaignV2CardSx,
  campaignV2SectionTitleSx,
} from "../Campaign/components/campaignV2Tokens";

import api from "../../../utils/axiosInstance";

const MAX_LISTS_PER_USER = 10;

const primaryButtonSx = {
  mt: 0,
  mr: 0,
  px: 2.5,
  textTransform: "none" as const,
  fontWeight: 700,
  color: "#fff",
  background: campaignV2.gradient,
  boxShadow: "0 2px 8px rgba(91, 33, 182, 0.35)",
  "&:hover": {
    background: campaignV2.accentDark,
    color: "#fff",
  },
  "&.Mui-disabled": {
    color: "rgba(255, 255, 255, 0.65)",
  },
};

const outlinedToggleSx = {
  mt: 0,
  mr: 0,
  px: 2.5,
  textTransform: "none" as const,
  fontWeight: 700,
  borderColor: campaignV2.accent,
  color: campaignV2.accent,
  "&:hover": {
    borderColor: campaignV2.accentDark,
    bgcolor: "rgba(107, 70, 193, 0.06)",
  },
};

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
    deletingList,
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
          <Typography sx={campaignV2SectionTitleSx}>Prospect lists</Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
            Lists
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Manage your prospect lists for outreach campaigns
          </Typography>
        </Box>
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1}
          alignItems="center"
          justifyContent={{ xs: "flex-start", md: "flex-end" }}
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          <SimpleButton
            label="Import New Contacts"
            onClick={() => navigate("/import-contacts")}
            color="inherit"
            sx={primaryButtonSx}
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
                color="inherit"
                disabled={atListLimit}
                sx={primaryButtonSx}
              />
            </span>
          </Tooltip>
          <SimpleButton
            label={`${!showDropped ? "Show" : "Hide"} Dropped Calls`}
            onClick={() => setShowDropped(!showDropped)}
            color="inherit"
            variant="outlined"
            sx={outlinedToggleSx}
          />
        </Stack>
      </Stack>

      <Box>
        {loading ? (
          <Paper
            variant="outlined"
            sx={{
              ...campaignV2CardSx,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 6,
            }}
          >
            <CircularProgress sx={{ color: campaignV2.accent }} />
          </Paper>
        ) : (
          <>
            {!showDropped ? (
              <Paper
                variant="outlined"
                sx={{ ...campaignV2CardSx, overflow: "hidden", mb: 1 }}
              >
                <TableContainer sx={{ width: "100%" }}>
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
                            loadingContacts={
                              loadingContactsForListId === list.id
                            }
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
                    <TableRow
                      sx={{
                        bgcolor: "rgba(107, 70, 193, 0.08)",
                        borderBottom: "1px solid rgba(107, 70, 193, 0.12)",
                      }}
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
                                sx={{
                                  color: campaignV2.accent,
                                  "&:hover": {
                                    color: campaignV2.accentDark,
                                    bgcolor: "rgba(107, 70, 193, 0.08)",
                                  },
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

      <DeleteListDialog
        open={openDialog}
        onClose={() => !deletingList && setOpenDialog(false)}
        onConfirm={handleDelete}
        deleting={deletingList}
      />
    </Container>
  );
};

export default Lists;
