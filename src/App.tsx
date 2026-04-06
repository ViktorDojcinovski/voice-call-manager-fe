import { useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

import { useAuth } from "./contexts/AuthContext";

import { useInboundCall } from "./hooks/useInboundCall";
import SuperadminRoute from "./components/SuperadminRoute";
import WithHeader from "./hocs/WithHeader";
import AdminLayout from "./layouts/AdminLayout";
import PrivateRoute from "./components/PrivateRoute";
import { InboundCallDialog } from "./components/InboundCallDialog";

// Main Pages
import SignIn from "./pages/SignIn";
import MyProfile from "./pages/MyProfile";
// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import Campaign from "./pages/admin/Campaign/Campaign";
import Settings from "./pages/admin/Settings/Settings";
import Lists from "./pages/admin/Lists/Lists";
import Contacts from "./pages/admin/Contacts/Contacts";
import ContactDetails from "./pages/admin/Contacts/ContactDetails";
import Tasks from "./pages/admin/Tasks/Tasks";
import ImportContacts from "./pages/admin/ImportContacts";
import CreateNewList from "./pages/admin/CreateNewList";
import Coaching from "./pages/admin/Coaching/Coaching";
import MyPhoneNumbersList from "./pages/admin/MyNumbersList";
import Reports from "./pages/admin/Reports/Reports";
import IntegrationsGrid from "./pages/admin/Integrations/IntegrationsGrid";
import Integrations from "./pages/admin/Integrations/Integrations";
import AutomationApiSettings from "./pages/admin/Integrations/AutomationApiSettings";
import Accounts from "./pages/admin/Accounts/Accounts";
import AccountDetails from "./pages/admin/Accounts/AccountDetails";
import AccountContacts from "./pages/admin/Accounts/AccountContacts";
import DialerPopoverCall from "./pages/admin/Dialer/DialerPopoverCall";

// Superadmin pages
import SuperDashboard from "./pages/superadmin/SuperDashboard";
import NumberPoolSettings from "./pages/superadmin/NumberPoolSettings";
import DialRightScans from "./pages/superadmin/DialRightScans";
import UsersManagement from "./pages/superadmin/UserManagement";
import TenantManagement from "./pages/superadmin/TenantManagement";
import TenantDetails from "./pages/superadmin/TenantDetails";
import SuperadminAccountDetails from "./pages/superadmin/AccountDetails";

import "./App.css";


function App() {
  const { isAuthenticated, isSuperadmin, authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && isAuthenticated && location.pathname === "/") {
      if (isSuperadmin) {
        navigate("/superdashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, isSuperadmin, location.pathname, navigate]);

  const {
    isInboundCallDialogOpen,
    from,
    accepted,
    acceptCall,
    rejectCall,
    hangUp,
  } = useInboundCall();

  if (authLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<SignIn />} />
        {/* Private routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/campaign" element={<Campaign />} />
            <Route path="/lists" element={<Lists />} />
            <Route path="/contacts">
              <Route index element={<Contacts />} />
              <Route path=":id" element={<ContactDetails />} />
            </Route>
            <Route path="/accounts">
              <Route index element={<Accounts />} />
              <Route path=":id" element={<AccountDetails />} />
              <Route path="contacts/:id" element={<AccountContacts />} />
            </Route>
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/import-contacts" element={<ImportContacts />} />
            <Route path="/create-new-list/:id?" element={<CreateNewList />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/my-numbers" element={<MyPhoneNumbersList />} />
            <Route path="/coaching" element={<Coaching />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/integrations" element={<IntegrationsGrid />} />
            <Route path="/integrations/webhook" element={<Integrations />} />
            <Route path="/integrations/automation" element={<AutomationApiSettings />} />
            <Route path="/auth/me" element={<MyProfile />} />
            <Route path="/dialer-call/:phoneNumber" element={<DialerPopoverCall />} />
          </Route>
        </Route>
        <Route element={<SuperadminRoute />}>
          <Route path="/superdashboard">
            <Route index element={<WithHeader component={SuperDashboard} />} />
            <Route
              path="numbers-pool"
              element={<WithHeader component={NumberPoolSettings} />}
            />
            <Route
              path="dialright"
              element={<WithHeader component={DialRightScans} />}
            />
            <Route
              path="users"
              element={<WithHeader component={UsersManagement} />}
            />
            <Route path="tenants">
              <Route index element={<WithHeader component={TenantManagement} />} />
              <Route
                path=":id"
                element={<WithHeader component={TenantDetails} />}
              />
              <Route
                path=":tenantId/accounts/:accountId"
                element={<WithHeader component={SuperadminAccountDetails} />}
              />
            </Route>
          </Route>
        </Route>
      </Routes>
      <InboundCallDialog
        open={isInboundCallDialogOpen}
        from={from}
        accepted={accepted}
        onAccept={acceptCall}
        onReject={rejectCall}
        onHangUp={hangUp}
      />
    </>
  );
}

export default App;
