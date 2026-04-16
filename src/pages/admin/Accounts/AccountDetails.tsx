import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  Stack,
  Container,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import api from "../../../utils/axiosInstance";
import { useSnackbar } from "../../../hooks/useSnackbar";
import Loading from "../../../components/UI/Loading";
import { Contact } from "../../../types/contact";
import { getContactPhoneDisplayString } from "../../../utils/getContactPrimaryPhone";
import { Account } from "../../../types/account";
import {
  campaignV2,
  campaignV2CardSx,
  campaignV2SectionTitleSx,
} from "../Campaign/components/campaignV2Tokens";

const pageShellSx = {
  py: 3,
  px: { xs: 2, sm: 3 },
  bgcolor: campaignV2.pageBg,
  minHeight: "100%",
} as const;

const backButtonSx = {
  textTransform: "none" as const,
  fontWeight: 700,
  borderColor: campaignV2.accent,
  color: campaignV2.accent,
  "&:hover": {
    borderColor: campaignV2.accentDark,
    bgcolor: "rgba(107, 70, 193, 0.06)",
  },
};

const tableHeadRowSx = {
  bgcolor: "rgba(107, 70, 193, 0.08)",
  borderBottom: "1px solid rgba(107, 70, 193, 0.12)",
};

const detailCardSx = {
  borderColor: "rgba(107, 70, 193, 0.12)",
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const AccountDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueue } = useSnackbar();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [deals, setDeals] = useState<any[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    if (id) {
      loadAccount();
      loadDeals();
      loadContacts();
    }
  }, [id]);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/accounts/${id}`);
      setAccount(res.data);
    } catch (error) {
      enqueue("Failed to load account details", { variant: "error" });
      navigate("/accounts");
    } finally {
      setLoading(false);
    }
  };

  const loadDeals = async () => {
    if (!id) return;
    try {
      setLoadingDeals(true);
      const res = await api.get(`/deals/account/${id}`, {});
      setDeals(res.data.data || res.data || []);
    } catch (error) {
      console.error("Failed to load deals", error);
      setDeals([]);
    } finally {
      setLoadingDeals(false);
    }
  };

  const loadContacts = async () => {
    if (!id) return;
    try {
      setLoadingContacts(true);
      const res = await api.get("/contacts", {
        params: { accountId: id },
      });
      setContacts(res.data.data || res.data.contacts || res.data || []);
    } catch (error) {
      console.error("Failed to load contacts", error);
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={pageShellSx}>
        <Paper
          variant="outlined"
          sx={{
            ...campaignV2CardSx,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 8,
          }}
        >
          <Loading />
        </Paper>
      </Container>
    );
  }

  if (!account) {
    return (
      <Container maxWidth="xl" sx={pageShellSx}>
        <Paper variant="outlined" sx={{ ...campaignV2CardSx, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Account not found
          </Typography>
          <Button
            onClick={() => navigate("/accounts")}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            color="inherit"
            sx={backButtonSx}
          >
            Back to Accounts
          </Button>
        </Paper>
      </Container>
    );
  }

  const displayFields = [
    { label: "Account Name", value: account.companyName },
    { label: "Industry", value: account.industry },
    { label: "Website", value: account.website },
    { label: "Phone", value: account.phone },
    { label: "Address", value: account.address },
    { label: "City", value: account.city },
    { label: "State", value: account.state },
    { label: "Zip Code", value: account.zipCode },
    { label: "Country", value: account.country },
  ].filter((field) => field.value);

  return (
    <Container maxWidth="xl" sx={pageShellSx}>
      <Box mb={3} display="flex" alignItems="center" gap={2} flexWrap="wrap">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/accounts")}
          variant="outlined"
          color="inherit"
          sx={backButtonSx}
        >
          Back to Accounts
        </Button>
        <Box>
          <Typography sx={campaignV2SectionTitleSx}>Account</Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
            {account.companyName || "Account Details"}
          </Typography>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ ...campaignV2CardSx, overflow: "hidden" }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
            "& .Mui-selected": { color: `${campaignV2.accent} !important` },
            "& .MuiTabs-indicator": { bgcolor: campaignV2.tabIndicator },
          }}
        >
          <Tab label="Details" />
          <Tab label="Deals" />
          <Tab label="Contacts" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {displayFields.map((field, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined" sx={detailCardSx}>
                    <CardContent>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        gutterBottom
                      >
                        {field.label}
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {field.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}

              {displayFields.length === 0 && (
                <Grid item xs={12}>
                  <Typography color="text.secondary" align="center" py={4}>
                    No additional details available for this account.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {loadingDeals ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress sx={{ color: campaignV2.accent }} />
              </Box>
            ) : deals.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                No deals found for this account.
              </Typography>
            ) : (
              <Paper variant="outlined" sx={{ ...campaignV2CardSx, overflow: "auto" }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={tableHeadRowSx}>
                        <TableCell sx={{ fontWeight: 600 }}>Deal name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Stage</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Pipeline</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Done for contact</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Done by</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deals.map((deal: any) => (
                        <TableRow key={deal.id}>
                          <TableCell>{deal.dealname}</TableCell>
                          <TableCell>
                            {deal.amount
                              ? new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "USD",
                                }).format(deal.amount)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {deal.dealstage ? (
                              <Chip label={deal.dealstage} size="small" />
                            ) : (
                              "-"
                            )}
                          </TableCell>

                          <TableCell>
                            {deal.pipeline ? (
                              <Chip label={deal.pipeline} size="small" />
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {deal.userId ? (
                              deal.userId.first_name && deal.userId.last_name ? (
                                <Chip
                                  label={
                                    deal.userId.first_name +
                                    " " +
                                    deal.userId.last_name
                                  }
                                  size="small"
                                />
                              ) : (
                                <Chip label={deal.userId.email} size="small" />
                              )
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {deal &&
                            deal.contactId &&
                            deal.contactId.first_name &&
                            deal.contactId.last_name ? (
                              <Chip
                                label={
                                  deal.contactId.first_name +
                                  " " +
                                  deal.contactId.last_name
                                }
                                size="small"
                              />
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {loadingContacts ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress sx={{ color: campaignV2.accent }} />
              </Box>
            ) : contacts.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                No contacts found for this account.
              </Typography>
            ) : (
              <Paper variant="outlined" sx={{ ...campaignV2CardSx, overflow: "auto" }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={tableHeadRowSx}>
                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow key={contact.id} hover>
                          <TableCell>
                            {contact.first_name} {contact.last_name}
                          </TableCell>
                          <TableCell>{contact.company || "-"}</TableCell>
                          <TableCell>{contact.email || "-"}</TableCell>
                          <TableCell>
                            {getContactPhoneDisplayString(contact) || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default AccountDetails;
