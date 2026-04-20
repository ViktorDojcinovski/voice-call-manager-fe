import React, { useEffect, useState } from "react";
import {
  Box, Typography, Grid, Paper, Chip, Button, Stack,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  IconButton, FormControlLabel, Switch, Divider, TextField, MenuItem, Autocomplete,
  Container,
} from "@mui/material";
import { WebhookIcon, HubSpotIcon } from "../../../components/integrations/integrationIcons";
import { VpnKey } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate, useLocation } from "react-router-dom";
import { createFilterOptions } from "@mui/material/Autocomplete";
import axios from "axios";
import useAppStore from "../../../store/useAppStore";
import {
  campaignV2,
  campaignV2CardSx,
  campaignV2SectionTitleSx,
} from "../Campaign/components/campaignV2Tokens";

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

const primaryCtaSx = {
  textTransform: "none" as const,
  fontWeight: 700,
  color: "#fff",
  background: campaignV2.gradient,
  boxShadow: "0 2px 8px rgba(91, 33, 182, 0.35)",
  "&:hover": {
    background: campaignV2.accentDark,
    color: "#fff",
  },
};

const integrationIconCircleSx = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bgcolor: "common.white",
  color: campaignV2.accent,
  border: "1px solid rgba(107, 70, 193, 0.2)",
};

type MappingPair = { id: string; hubspot: string; kalliq: string };

const IntegrationsGrid = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppStore();
  const userId = user?.id;
 
  const [isHubSpotConnected, setIsHubSpotConnected] = useState(false);
  const [loading, setLoading] = useState(true);
 
  const [openDisconnectModal, setOpenDisconnectModal] = useState(false);
  const [openSettingsModal, setOpenSettingsModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [hubSpotSettings, setHubSpotSettings] = useState({
    contacts: { read: false, write: false, update: false },
    companies: { read: false, write: false, update: false },
    deals: { read: false, write: false, update: false }
  });
  
  // ✅ UPDATED: Dynamic row states for custom overrides
  const [contactMapPairs, setContactMapPairs] = useState<MappingPair[]>([{ id: 'init-c', hubspot: '', kalliq: '' }]);
  const [companyMapPairs, setCompanyMapPairs] = useState<MappingPair[]>([{ id: 'init-comp', hubspot: '', kalliq: '' }]);
  const [dealMapPairs, setDealMapPairs] = useState<MappingPair[]>([{ id: 'init-d', hubspot: '', kalliq: '' }]);
 
  const [hubspotProperties, setHubspotProperties] = useState<{
    contacts: {name: string, label: string}[];
    deals: {name: string, label: string}[];
    companies: {name: string, label: string}[];
  }>({ contacts: [], deals: [], companies: [] });
  
  const [mappableFields, setMappableFields] = useState<{ contacts: string[], deals: string[], companies: string[] }>({ contacts: [], deals: [], companies: [] });
  const [coreMappings, setCoreMappings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!userId) return;
    const checkConnection = async () => {
      try {
        const params = new URLSearchParams(location.search);
        if (params.get("success") === "true") {
           window.history.replaceState({}, document.title, window.location.pathname);
        }

        const res = await axios.get(`${API_BASE_URL}/hubspot/settings?userId=${userId}`);
        setIsHubSpotConnected(res.data.connected);
       
        if (res.data.permissions) {
          setHubSpotSettings(prev => ({
            contacts: { ...prev.contacts, ...(res.data.permissions.contacts || {}) },
            companies: { ...prev.companies, ...(res.data.permissions.companies || {}) },
            deals: { ...prev.deals, ...(res.data.permissions.deals || {}) },
          }));
        }

        // ✅ NEW: Automatically converts incoming backend objects into our dynamic array rows
        const mapToPairs = (mapObj: Record<string, string> | undefined, prefix: string) => {
          if (!mapObj || Object.keys(mapObj).length === 0) return [{ id: `${prefix}-${Date.now()}`, hubspot: '', kalliq: '' }];
          const existing = Object.entries(mapObj).map(([k, v], i) => ({ id: `${prefix}-${i}`, kalliq: k, hubspot: v }));
          return [...existing, { id: `${prefix}-empty-${Date.now()}`, hubspot: '', kalliq: '' }]; // Always add one empty row at bottom
        };

        if (res.data.contactMap) setContactMapPairs(mapToPairs(res.data.contactMap, 'c'));
        if (res.data.dealMap) setDealMapPairs(mapToPairs(res.data.dealMap, 'd'));
        if (res.data.companyMap) setCompanyMapPairs(mapToPairs(res.data.companyMap, 'comp'));

      } catch (err) {
        setIsHubSpotConnected(false);
      } finally {
        setLoading(false);
      }
    };
    checkConnection();
  }, [userId, location.search]);

  const handleOpenSettings = async () => {
    setOpenSettingsModal(true);
    try {
      const propsRes = await axios.get(`${API_BASE_URL}/hubspot/properties?userId=${userId}`);
      setHubspotProperties(propsRes.data); 
    } catch (err: any) { console.error("❌ Failed to fetch HubSpot properties:", err.response?.data || err.message); }

    try {
      const fieldsRes = await axios.get(`${API_BASE_URL}/hubspot/mappable-fields`);
      const safeCompanies = Array.isArray(fieldsRes.data.companies) ? fieldsRes.data.companies : Object.keys(fieldsRes.data.companies || {});
      setMappableFields({ contacts: fieldsRes.data.contacts || [], deals: fieldsRes.data.deals || [], companies: safeCompanies });
    } catch (err: any) { console.error("❌ Failed to fetch mappable fields:", err.response?.data || err.message); }

    try {
      const coreRes = await axios.get(`${API_BASE_URL}/hubspot/core-mappings`);
      setCoreMappings(coreRes.data);
    } catch (err: any) { console.error("❌ Failed to fetch core mappings:", err.response?.data || err.message); }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    
    // ✅ NEW: Converts UI array rows back into the `{ kalliqKey: hubspotValue }` object your backend expects
    const buildMap = (pairs: MappingPair[]) => {
      const result: Record<string, string> = {};
      pairs.forEach(p => { if (p.kalliq && p.hubspot) result[p.kalliq] = p.hubspot; });
      return result;
    };

    try {
      await axios.post(`${API_BASE_URL}/hubspot/settings`, {
        userId, 
        permissions: hubSpotSettings, 
        contactMap: buildMap(contactMapPairs), 
        dealMap: buildMap(dealMapPairs), 
        companyMap: buildMap(companyMapPairs)
      });
      setOpenSettingsModal(false);
    } catch (err) { alert("Failed to save settings."); } 
    finally { setSavingSettings(false); }
  };

  const confirmDisconnect = async () => {
    setDisconnecting(true);
    try {
      await axios.post(`${API_BASE_URL}/hubspot/disconnect`, { userId });
      setIsHubSpotConnected(false);
      setOpenDisconnectModal(false);
    } catch (err) { alert("Failed to disconnect."); } 
    finally { setDisconnecting(false); }
  };

  const handlePermissionChange = (category: 'contacts' | 'companies' | 'deals', type: 'read' | 'write' | 'update', value: boolean) => {
    setHubSpotSettings(prev => ({ ...prev, [category]: { ...prev[category], [type]: value } }));
  };

  // --- Dynamic Row Handlers ---
  const handlePairChange = (setter: any) => (id: string, field: 'hubspot' | 'kalliq', value: string) => {
    setter((prev: MappingPair[]) => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addPairRow = (setter: any) => () => {
    setter((prev: MappingPair[]) => [...prev, { id: Date.now().toString(), hubspot: '', kalliq: '' }]);
  };

  const removePairRow = (setter: any) => (id: string) => {
    setter((prev: MappingPair[]) => prev.filter(p => p.id !== id));
  };

  const formatKalliqOptions = (fields: string[] = []) => 
    fields.map(f => ({ name: f, label: f.replace(/_/g, ' ').toUpperCase() }));

  const dealCoreKeys = Object.keys(coreMappings).filter(key => 
    mappableFields.deals?.includes(key) || mappableFields.deals?.includes(coreMappings[key]) || key.toLowerCase().includes('deal') || key === 'amount' || key === 'stage' || key === 'pipeline'
  );
  
  const companyCoreKeys = Object.keys(coreMappings).filter(key => 
    mappableFields.companies?.includes(key) || mappableFields.companies?.includes(coreMappings[key]) || key.toLowerCase().includes('company') || key === 'accountWebsite' || key === 'domain'
  );

  const contactCoreKeys = Object.keys(coreMappings).filter(key => !dealCoreKeys.includes(key) && !companyCoreKeys.includes(key));

  /// --- COMPONENT: System Defaults ---
  const LockedMappingRow = ({ kalliqField, options }: any) => {
  const selectedValueString = coreMappings[kalliqField] || "";
  const selectedOptionObject = options.find((opt: any) => opt.name === selectedValueString) || { label: selectedValueString };

  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={1.5} sx={{ opacity: 0.6 }}>
      {/* Left Side: HubSpot Default */}
      <Box sx={{ flex: 1 }}>
        <Autocomplete
          disabled
          fullWidth
          size="small"
          options={[selectedOptionObject]}
          value={selectedOptionObject}
          getOptionLabel={(opt: any) => opt.label || ""}
          renderInput={(params) => (
            <TextField {...params} label="HubSpot Property" sx={{ bgcolor: '#f5f5f5' }} />
          )}
        />
      </Box>
      
      {/* Middle Column: Arrow */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5 }}>
        <Box sx={{ p: 0.5, border: '1px solid #ddd', borderRadius: 1, display: 'flex', bgcolor: '#eee' }}>
          <SyncAltIcon sx={{ color: '#999', fontSize: 18 }} />
        </Box>
      </Box>
      
      {/* Right Side: Kalliq Field */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Autocomplete
          disabled
          fullWidth
          size="small"
          options={[{ label: kalliqField.replace(/_/g, ' ').toUpperCase() }]}
          value={{ label: kalliqField.replace(/_/g, ' ').toUpperCase() }}
          getOptionLabel={(opt: any) => opt.label || ""}
          sx={{ flexGrow: 1 }}
          renderInput={(params) => (
            <TextField {...params} label="Kalliq Field" sx={{ bgcolor: '#f9f9f9' }} />
          )}
        />
        {/* Invisible button to reserve space so the right border aligns with the Trash icon rows */}
        <IconButton disabled sx={{ visibility: 'hidden', mt: 0.25 }}>
          <DeleteIcon fontSize="medium" />
        </IconButton>
      </Box>
    </Stack>
  );
};

  // --- COMPONENT: Dynamic Overrides ---
  const DynamicMappingRow = ({ pair, hubspotOptions, kalliqOptions, onChange, isLast, onAdd, onRemove }: any) => {
    const selectedHubspot = hubspotOptions.find((opt: any) => opt.name === pair.hubspot) || null;
    const selectedKalliq = kalliqOptions.find((opt: any) => opt.name === pair.kalliq) || null;

    // ✅ DIFFERENCE 1: This strict filter stops MUI from searching the hidden internal names
    const filterOptions = createFilterOptions({
      stringify: (option: any) => option.label,
    });

    return (
      <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={isLast ? 1 : 2.5}>
        <Box sx={{ flex: 1 }}>
          <Autocomplete
            fullWidth
            size="small"
            options={hubspotOptions}
            filterOptions={filterOptions} // <-- Applied the strict filter here
            getOptionLabel={(opt: any) => opt.label || ""}
            value={selectedHubspot}
            onChange={(e, newValue) => onChange(pair.id, 'hubspot', newValue ? newValue.name : '')}
            
            // ✅ DIFFERENCE 2: Custom dropdown layout to show the internal name under the label
            renderOption={(props, option) => (
              <li {...props} key={option.name}>
                <Box>
                  <Typography variant="body2" sx={{ display: 'block' }}>{option.label}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -0.5 }}>
                    {option.name}
                  </Typography>
                </Box>
              </li>
            )}
            
            renderInput={(params) => (
              <TextField {...params} label="HubSpot Property" sx={{ bgcolor: '#fff' }} />
            )}
          />
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5 }}>
          <Box sx={{ p: 0.5, border: '1px solid #ddd', borderRadius: 1, display: 'flex' }}>
            <SyncAltIcon sx={{ color: '#7b61ff', fontSize: 18 }} />
          </Box>
          {isLast && (
             <IconButton 
               size="small" 
               onClick={onAdd} 
               sx={{ mt: 2, bgcolor: '#e3f2fd', color: '#1976d2', p: '4px', '&:hover': { bgcolor: '#bbdefb' } }}
             >
               <AddIcon fontSize="small" />
             </IconButton>
          )}
        </Box>

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Autocomplete
            fullWidth
            size="small"
            options={kalliqOptions}
            getOptionLabel={(opt: any) => opt.label || ""}
            value={selectedKalliq}
            onChange={(e, newValue) => onChange(pair.id, 'kalliq', newValue ? newValue.name : '')}
            sx={{ flexGrow: 1 }}
            renderInput={(params) => (
              <TextField {...params} label="Kalliq Field" sx={{ bgcolor: '#fff' }} />
            )}
          />
          <IconButton 
            onClick={() => onRemove(pair.id)} 
            sx={{ mt: 0.25, color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: '#ffebee' } }}
          >
            <DeleteIcon fontSize="medium" />
          </IconButton>
        </Box>
      </Stack>
    );
  };

  const PermissionToggles = ({ category, state, onChange }: any) => (
    <Stack direction="row" spacing={3} mb={3} sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #eee' }}>
      <Typography variant="body2" fontWeight="bold" sx={{ alignSelf: 'center', mr: 2, color: 'text.secondary' }}>SYNC PERMISSIONS:</Typography>
      <FormControlLabel control={<Switch size="small" checked={state.read} onChange={(e) => onChange(category, 'read', e.target.checked)} />} label="Read" />
      <FormControlLabel control={<Switch size="small" checked={state.write} onChange={(e) => onChange(category, 'write', e.target.checked)} />} label="Create" />
      <FormControlLabel control={<Switch size="small" checked={state.update} onChange={(e) => onChange(category, 'update', e.target.checked)} />} label="Update" />
    </Stack>
  );

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
      <Box mb={3}>
        <Typography sx={campaignV2SectionTitleSx}>Connections</Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
          Integrations
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Connect Kalliq with your existing tools and workflows.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper variant="outlined" sx={{ ...campaignV2CardSx, p: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Box sx={integrationIconCircleSx}>
                <WebhookIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>Webhook</Typography>
                <Chip label="Connected" color="success" size="small" sx={{ mt: 0.5, height: 24 }} />
              </Box>
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Send outbound events from Kalliq to your own webhook endpoint.
            </Typography>
            <Box mt="auto" pt={2}>
              <Button variant="contained" color="inherit" fullWidth onClick={() => navigate("/integrations/webhook")} sx={primaryCtaSx}>
                Configure
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper variant="outlined" sx={{ ...campaignV2CardSx, p: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Box sx={integrationIconCircleSx}>
                <VpnKey fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>Automation API</Typography>
                <Chip label="API keys" color="primary" variant="outlined" size="small" sx={{ mt: 0.5, height: 24 }} />
              </Box>
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Machine-to-machine access for Zapier, Close, and custom integrations.
            </Typography>
            <Box mt="auto" pt={2}>
              <Button
                variant="contained"
                color="inherit"
                fullWidth
                onClick={() => navigate("/integrations/automation")}
                sx={primaryCtaSx}
              >
                Configure
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper variant="outlined" sx={{ ...campaignV2CardSx, p: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
              <Box sx={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#fff1ee", color: "#ff7a59", flexShrink: 0 }}>
                <HubSpotIcon fontSize="medium" />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                  <Typography variant="subtitle1" fontWeight={600}>HubSpot</Typography>
                  {isHubSpotConnected && !loading && (
                    <IconButton size="small" onClick={handleOpenSettings} sx={{ ml: 1, padding: 0.5 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
                <Chip
                  label={loading ? "Checking..." : isHubSpotConnected ? "Connected" : "Not Connected"}
                  color={isHubSpotConnected ? "success" : "default"}
                  size="small" sx={{ mt: 0.5, height: 24 }}
                />
              </Box>
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Sync contacts, deals, and stages directly from HubSpot.
            </Typography>
            <Box mt="auto" pt={2}>
              {isHubSpotConnected ? (
                <Button variant="outlined" color="error" fullWidth onClick={() => setOpenDisconnectModal(true)} sx={{ textTransform: "none", fontWeight: 700 }}>
                  Disconnect
                </Button>
              ) : (
                <Button variant="contained" fullWidth onClick={() => window.location.href = `${API_BASE_URL}/hubspot/install?userId=${userId}`} sx={{ bgcolor: "#ff7a59", textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#e86a4d" } }}>
                  Connect HubSpot
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openSettingsModal} onClose={() => setOpenSettingsModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>HubSpot Configuration</DialogTitle>
        <DialogContent dividers>
          
          {/* --- CONTACTS SECTION --- */}
          <Box mb={4}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: '#2c3e50', display: 'flex', alignItems: 'center' }}>CONTACT SETTINGS</Typography>
            <PermissionToggles category="contacts" state={hubSpotSettings.contacts} onChange={handlePermissionChange} />

            <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary', fontWeight: 600 }}>HubSpot Property</Typography>
            {contactCoreKeys.map(field => (
              <LockedMappingRow key={`core-contact-${field}`} kalliqField={field} options={hubspotProperties.contacts} />
            ))}

            <Typography variant="caption" sx={{ display: 'block', mt: 3, mb: 1, color: 'text.secondary', fontWeight: 600 }}>CUSTOM MAPPING</Typography>
            {contactMapPairs.map((pair, idx) => (
              <DynamicMappingRow
                key={pair.id} pair={pair} hubspotOptions={hubspotProperties.contacts} kalliqOptions={formatKalliqOptions(mappableFields.contacts)}
                onChange={handlePairChange(setContactMapPairs)} onAdd={addPairRow(setContactMapPairs)} onRemove={removePairRow(setContactMapPairs)} isLast={idx === contactMapPairs.length - 1}
              />
            ))}
          </Box>
          <Divider sx={{ my: 3 }} />

          {/* --- COMPANIES SECTION --- */}
          <Box mb={4}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: '#2c3e50', display: 'flex', alignItems: 'center' }}>COMPANY SETTINGS</Typography>
            <PermissionToggles category="companies" state={hubSpotSettings.companies} onChange={handlePermissionChange} />

            <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary', fontWeight: 600 }}>HubSpot Property</Typography>
            {companyCoreKeys.map(field => (
              <LockedMappingRow key={`core-company-${field}`} kalliqField={field} options={hubspotProperties.companies} />
            ))}

            <Typography variant="caption" sx={{ display: 'block', mt: 3, mb: 1, color: 'text.secondary', fontWeight: 600 }}>CUSTOM MAPPING</Typography>
            {companyMapPairs.map((pair, idx) => (
              <DynamicMappingRow
                key={pair.id} pair={pair} hubspotOptions={hubspotProperties.companies} kalliqOptions={formatKalliqOptions(mappableFields.companies)}
                onChange={handlePairChange(setCompanyMapPairs)} onAdd={addPairRow(setCompanyMapPairs)} onRemove={removePairRow(setCompanyMapPairs)} isLast={idx === companyMapPairs.length - 1}
              />
            ))}
          </Box>
          <Divider sx={{ my: 3 }} />

          {/* --- DEALS SECTION --- */}
          <Box mb={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: '#2c3e50', display: 'flex', alignItems: 'center' }}>DEAL SETTINGS</Typography>
            <PermissionToggles category="deals" state={hubSpotSettings.deals} onChange={handlePermissionChange} />

            <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary', fontWeight: 600 }}>HubSpot Property</Typography>
            {dealCoreKeys.map(field => (
              <LockedMappingRow key={`core-deal-${field}`} kalliqField={field} options={hubspotProperties.deals} />
            ))}

            <Typography variant="caption" sx={{ display: 'block', mt: 3, mb: 1, color: 'text.secondary', fontWeight: 600 }}>CUSTOM MAPPING</Typography>
            {dealMapPairs.map((pair, idx) => (
              <DynamicMappingRow
                key={pair.id} pair={pair} hubspotOptions={hubspotProperties.deals} kalliqOptions={formatKalliqOptions(mappableFields.deals)}
                onChange={handlePairChange(setDealMapPairs)} onAdd={addPairRow(setDealMapPairs)} onRemove={removePairRow(setDealMapPairs)} isLast={idx === dealMapPairs.length - 1}
              />
            ))}
          </Box>

        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenSettingsModal(false)} color="inherit">Cancel</Button>
          <Button onClick={saveSettings} variant="contained" color="inherit" disabled={savingSettings} sx={{ ...primaryCtaSx, px: 4 }}>
            {savingSettings ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDisconnectModal} onClose={() => !disconnecting && setOpenDisconnectModal(false)}>
        <DialogTitle>Disconnect HubSpot?</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to disconnect? This will stop all active syncs.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDisconnectModal(false)} color="inherit" disabled={disconnecting}>Cancel</Button>
          <Button onClick={confirmDisconnect} color="error" variant="contained" disabled={disconnecting}>
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default IntegrationsGrid;