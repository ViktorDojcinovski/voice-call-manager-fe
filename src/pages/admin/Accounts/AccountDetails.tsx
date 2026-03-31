import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Divider,
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
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Call as CallIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import api from "../../../utils/axiosInstance";
import { useSnackbar } from "../../../hooks/useSnackbar";
import Loading from "../../../components/UI/Loading";
import { Contact } from "../../../types/contact";
import { getContactPhoneDisplayString } from "../../../utils/getContactPrimaryPhone";
import { Account } from "../../../types/account";

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
    return <Loading />;
  }

  if (!account) {
    return (
      <Box p={3}>
        <Typography variant="h6">Account not found</Typography>
        <Button
          onClick={() => navigate("/accounts")}
          startIcon={<ArrowBackIcon />}
        >
          Back to Accounts
        </Button>
      </Box>
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
    <Box p={3}>
      <Box mb={3} display="flex" alignItems="center" gap={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/accounts")}
          variant="outlined"
        >
          Back to Accounts
        </Button>
        <Typography variant="h5" fontWeight="bold">
          {account.companyName || "Account Details"}
        </Typography>
      </Box>

      <Paper elevation={1}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
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
                  <Card variant="outlined">
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
                <CircularProgress />
              </Box>
            ) : deals.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                No deals found for this account.
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Deal nameName</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Stage</TableCell>
                      <TableCell>Pipeline</TableCell>
                      <TableCell>Done for contact</TableCell>
                      <TableCell>Done by</TableCell>
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
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {loadingContacts ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : contacts.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                No contacts found for this account.
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Company</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
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
            )}
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default AccountDetails;
