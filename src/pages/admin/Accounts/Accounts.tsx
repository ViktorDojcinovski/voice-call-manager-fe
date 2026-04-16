import {
  Box,
  TableCell,
  TableHead,
  Table,
  TableContainer,
  Typography,
  TableRow,
  Paper,
  TableBody,
  TableFooter,
  TablePagination,
  TextField,
  Button,
  CircularProgress,
  Stack,
  IconButton,
  Tooltip,
  Container,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import { useSnackbar } from "../../../hooks/useSnackbar";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/axiosInstance";
import { useEffect, useState, useCallback } from "react";
import AccountDialog from "../../superadmin/modals/AccountDialog";
import { DeleteDialog } from "../../../components/DeleteDialog";
import useAppStore from "../../../store/useAppStore";
import { Account, AccountFormData } from "../../../types/account";
import {
  campaignV2,
  campaignV2CardSx,
  campaignV2SectionTitleSx,
} from "../Campaign/components/campaignV2Tokens";

const primaryButtonSx = {
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

const accentIconButtonSx = {
  color: campaignV2.accent,
  "&:hover": {
    color: campaignV2.accentDark,
    bgcolor: "rgba(107, 70, 193, 0.08)",
  },
};

const tableHeadRowSx = {
  bgcolor: "rgba(107, 70, 193, 0.08)",
  borderBottom: "1px solid rgba(107, 70, 193, 0.12)",
};

const searchFieldSx = {
  mt: 0,
  mb: 2,
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "rgba(107, 70, 193, 0.35)",
    },
  },
};

const AccountsPage = () => {
  const { enqueue } = useSnackbar();
  const navigate = useNavigate();
  const { user } = useAppStore();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [openAccountDialog, setOpenAccountDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountFormData | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/accounts/all", {
        params: {
          search,
          page: page + 1,
          limit: rowsPerPage,
        },
      });
      setAccounts(res.data.accounts);
      setTotal(res.data.total);
    } catch (error) {
      enqueue("Failed to load accounts", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, enqueue]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    try {
      await api.delete(`/accounts/${accountToDelete.id}`);
      enqueue("Account deleted", { variant: "success" });
      setAccountToDelete(null);
      await loadAccounts();
    } catch (err) {
      enqueue("Failed to delete account", { variant: "error" });
    }
  };

  const handleSaveAccount = async (accountData: AccountFormData) => {
    try {
      const payload = { ...accountData, tenantId: user?.tenantId };
      if (selectedAccount?.id) {
        await api.patch(
          `/accounts/tenant/update/${selectedAccount.id}`,
          payload,
        );
      } else {
        await api.post("/accounts/tenant/create", payload);
      }
      await loadAccounts();
      setSelectedAccount(null);
    } catch (err) {
      console.error("Failed to save account", err);
      throw err;
    }
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 3,
        px: { xs: 2, sm: 3 },
        bgcolor: campaignV2.pageBg,
        minHeight: "100%",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography sx={campaignV2SectionTitleSx}>Directory</Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
            Accounts
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedAccount(null);
            setOpenAccountDialog(true);
          }}
          sx={primaryButtonSx}
        >
          Create Account
        </Button>
      </Stack>
      <TextField
        label="Search"
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSearch(e.target.value)
        }
        fullWidth
        margin="dense"
        sx={searchFieldSx}
      />
      <Paper variant="outlined" sx={{ ...campaignV2CardSx, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                {[
                  "Name",
                  "Website",
                  "Industry",
                  "Phone",
                  "Address",
                  "Zip Code",
                  "Country",
                  "Location",
                  "Actions",
                ].map((label) => (
                  <TableCell
                    key={label}
                    sx={{
                      fontWeight: 600,
                      ...(label === "Actions" ? { width: 150 } : {}),
                    }}
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress sx={{ color: campaignV2.accent }} />
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow
                    key={account.id}
                    onClick={() => navigate(`/accounts/${account.id}`)}
                    hover
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>{account.companyName}</TableCell>
                    <TableCell>{account.website}</TableCell>
                    <TableCell>{account.industry}</TableCell>
                    <TableCell>{account.phone}</TableCell>
                    <TableCell>{account.address}</TableCell>
                    <TableCell>{account.zipCode}</TableCell>
                    <TableCell>{account.country}</TableCell>
                    <TableCell>{account.location}</TableCell>
                    <TableCell
                      sx={{ width: 150 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip title="View">
                        <IconButton
                          onClick={() => navigate(`/accounts/${account.id}`)}
                          sx={accentIconButtonSx}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Contacts">
                        <IconButton
                          onClick={() =>
                            navigate(`/accounts/contacts/${account.id}`)
                          }
                          sx={accentIconButtonSx}
                        >
                          <PeopleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          onClick={() => setAccountToDelete(account)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Paper>

      <AccountDialog
        open={openAccountDialog}
        onClose={() => {
          setOpenAccountDialog(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
        users={[]}
        onSave={handleSaveAccount}
      />

      <DeleteDialog
        open={!!accountToDelete}
        title="Delete Account"
        text={`Are you sure you want to delete "${accountToDelete?.companyName}"?`}
        onClose={() => setAccountToDelete(null)}
        onConfirm={handleDeleteAccount}
      />
    </Container>
  );
};

export default AccountsPage;
