import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Button, Paper, Stack, CircularProgress, 
  FormControl, InputLabel, Select, MenuItem, Alert
} from "@mui/material";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import LockIcon from '@mui/icons-material/Lock';
import { HubSpotIcon } from "../../integrations/integrationIcons"; 
import api from "../../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import useAppStore from "../../../store/useAppStore";

const HubSpotImportSection: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAppStore();
  const auth: any = useAuth();
  
  const userId = user?.id;
  const userRole = (auth?.isAdmin || auth?.isSuperadmin) ? "admin" : "user";

  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true); 
  const [hubLists, setHubLists] = useState<any[]>([]);
  const [localLists, setLocalLists] = useState<any[]>([]);
  
  const [selectedHubList, setSelectedHubList] = useState<any>(null);
  const [selectedTargetListId, setSelectedTargetListId] = useState("");
  const [duplicateField, setDuplicateField] = useState("email"); 
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); 
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // ✅ INITIAL DATA LOAD: Handles Parent-Admin inheritance
 useEffect(() => {
  const initializeData = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      let targetAdminId = userId;
      let canRead = false;

      // 🛡️ BRANCHING LOGIC: Only use the new API for sub-users
      if (userRole !== "admin") {
        // Path for Sub-Users: Use the new HubSpot Status route to avoid 401/404 errors
        const statusRes = await api.get(`/hubspot/user-check/${userId}`);
        targetAdminId = statusRes.data.adminId;
        canRead = statusRes.data.canRead;
        
        if (!statusRes.data.isConnected) {
          setIsConnected(false);
          setLoading(false);
          return;
        }
      } else {
        // Path for Admins: KEEP YOUR ORIGINAL WORKING FLOW EXACTLY AS IS
        const userRes = await api.get(`/users/${userId}`);
        const freshUser = userRes.data;
        if (freshUser) setUser(freshUser);

        targetAdminId = userId;
        const adminIsConnected = freshUser.hubspot?.isConnected === true;
        canRead = freshUser.hubspotPermissions?.contacts.read === true;

        if (!adminIsConnected) {
          setIsConnected(false);
          setLoading(false);
          return;
        }
      }

      // 🚀 SHARED DATA FETCH: Once we have the right ID and permission
      if (canRead && targetAdminId) {
        const [hubRes, localRes] = await Promise.all([
          api.get(`/hubspot/lists?userId=${targetAdminId}`),
          api.get(`/lists`)
        ]);

        setIsConnected(true);
        const lists = (hubRes.data.lists || []).map((l: any) => ({
          id: l.listId || l.id,
          name: l.name,
          size: l.size || l.additionalProperties?.hs_list_size || 0
        }));
        setHubLists(lists);
        setLocalLists(localRes.data || []);
      } else {
        setPermissionError("Action Denied: HubSpot read permissions are disabled by your administrator.");
      }
    } catch (err: any) {
      console.error("Initial load failed:", err);
      // Only set disconnected on hard errors like 401/404
      if (err.response?.status === 401 || err.response?.status === 404) {
        setIsConnected(false);
      }
    } finally {
      setLoading(false);
    }
  };

  initializeData();
}, [userId, userRole, setUser]);

const handleImport = async () => {
  if (!selectedHubList || !selectedTargetListId) return;
  
  setPermissionError(null);
  setIsSyncing(true);

  try {
    let hasPermission = false;

    // 🛡️ ROLE BRANCHING: Only sub-users hit the new specific API
    if (userRole !== "admin") {
      // ✅ Use the new endpoint to bypass restricted /users route
      const statusRes = await api.get(`/hubspot/user-check/${userId}`);
      hasPermission = statusRes.data.canRead === true;
    } else {
      // 🔒 ADMIN PATH: Keep your original working logic exactly as is
      const userRes = await api.get(`/users/${userId}`);
      const freshUser = userRes.data;
      if (freshUser) setUser(freshUser);
      hasPermission = freshUser.hubspotPermissions?.contacts.read === true;
    }

    if (!hasPermission) {
      setPermissionError("Action Denied: HubSpot read permissions are disabled by your administrator.");
      setIsSyncing(false);
      setHubLists([]); 
      return;
    }

    // 🚀 4. PROCEED WITH IMPORT (The backend already knows how to find the Admin's token)
    await api.post(`/hubspot/sync/lists`, {
      userId,
      targetLocalListId: selectedTargetListId,
      hubspotListIds: [selectedHubList.id],
      duplicateField: duplicateField 
    });

    setIsSyncing(false);
    setShowSuccess(true);
  } catch (err: any) {
    setIsSyncing(true);
    // ✅ Extract the specific error from backend if available
    const msg = err.response?.data?.error || err.response?.data?.message || "Import failed. Please check connection.";
    setPermissionError(msg);
    setIsSyncing(false);
  }
};

  // --- RENDERING ---

  if (!isConnected && !loading) {
    return (
      <Paper elevation={3} sx={{ p: 4, mt: 4, borderTop: "4px solid #ff7a59", textAlign: 'center' }}>
        <Stack alignItems="center" spacing={2}>
          <LinkOffIcon sx={{ fontSize: 48, color: "text.secondary" }} />
          <Typography variant="h6">HubSpot Not Connected</Typography>
          {userRole === "admin" ? (
            <Button variant="contained" onClick={() => navigate('/integrations')} sx={{ bgcolor: "#ff7a59" }}>
              Connect HubSpot
            </Button>
          ) : (
            <Typography variant="body2" color="text.secondary">
              The HubSpot integration is not active. Please ask your administrator to reconnect.
            </Typography>
          )}
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 4, borderTop: "4px solid #ff7a59" }}>
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <HubSpotIcon fontSize="large" />
        <Typography variant="h6" fontWeight="bold">HubSpot Integration</Typography>
      </Stack>

      {permissionError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setPermissionError(null)}>
          {permissionError}
        </Alert>
      )}

      {loading ? (
        <Stack alignItems="center" py={4}><CircularProgress /></Stack>
      ) : showSuccess ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h5" color="success.main" fontWeight="bold">Import Completed</Typography>
          <Button variant="contained" size="large" onClick={() => setShowSuccess(false)} sx={{ mt: 4, px: 6 }}>
            Done
          </Button>
        </Box>
      ) : isSyncing ? (
        <Stack alignItems="center" spacing={3} py={6}>
          <CircularProgress size={60} sx={{ color: "#ff7a59" }} />
          <Typography variant="h6" fontWeight="bold">Sync in progress...</Typography>
        </Stack>
      ) : (
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Source (HubSpot)</InputLabel>
              <Select 
                value={selectedHubList?.id || ""} 
                label="Source (HubSpot)"
                onChange={(e) => setSelectedHubList(hubLists.find(l => l.id === e.target.value))}
              >
                {hubLists.map(l => <MenuItem key={l.id} value={l.id}>{l.name} ({l.size})</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Target (Local List)</InputLabel>
              <Select value={selectedTargetListId} label="Target (Local List)" onChange={(e) => setSelectedTargetListId(e.target.value)}>
                {localLists.map((l: any) => <MenuItem key={l.id} value={l.id}>{l.listName}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          <FormControl fullWidth>
            <InputLabel>Duplicate Filter Field</InputLabel>
            <Select value={duplicateField} label="Duplicate Filter Field" onChange={(e) => setDuplicateField(e.target.value)}>
              <MenuItem value="email">Email (Recommended)</MenuItem>
              <MenuItem value="phone">Phone</MenuItem>
            </Select>
          </FormControl>

          <Button 
            variant="contained" 
            disabled={!selectedHubList || !selectedTargetListId} 
            onClick={handleImport}
            sx={{ bgcolor: "#ff7a59", width: "fit-content" }}
          >
            Start Sync
          </Button>
        </Stack>
      )}
    </Paper>
  );
};

export default HubSpotImportSection;