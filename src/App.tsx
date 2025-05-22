import { useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

import { useAuth } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import WithHeader from "./hocs/WithHeader";

// Pages
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import TwilioDevice from "./pages/TwilioDevice/TwilioDevice";
import Settings from "./pages/Settings/Settings";
import Lists from "./pages/Lists/Lists";
import Contacts from "./pages/Contacts/Contacts";
import ImportContacts from "./pages/ImportContacts";
import CreateNewList from "./pages/CreateNewList";
import ActiveDialing4 from "./pages/ActiveDialing4";
import "./App.css";

function App() {
  const { isAuthenticated } = useAuth();
  console.log("isAuthenticated: ", isAuthenticated);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        {/* Private routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard">
            <Route index element={<Dashboard />} />
            <Route
              path="device"
              element={<WithHeader component={TwilioDevice} />}
            />
            <Route
              path="settings"
              element={<WithHeader component={Settings} />}
            />
            <Route path="lists" element={<WithHeader component={Lists} />} />
            <Route
              path="contacts"
              element={<WithHeader component={Contacts} />}
            />
            <Route
              path="import-contacts"
              element={<WithHeader component={ImportContacts} />}
            />
            <Route
              path="create-new-list/:id?"
              element={<WithHeader component={CreateNewList} />}
            />
            <Route
              path="active-dialing"
              element={<WithHeader component={ActiveDialing4} />} // for testing
            />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
