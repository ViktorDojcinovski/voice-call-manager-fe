import { HashRouter as Router, Routes, Route } from "react-router-dom";

import { useAuth } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import WithHeader from "./hocs/WithHeader";

// Pages
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import TwilioDevice from "./pages/TwilioDevice";
import Settings from "./pages/Settings";
import Lists from "./pages/Lists";
import ImportContacts from "./pages/ImportContacts";
import CreateNewList from "./pages/CreateNewList";

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
            <Route path="device" element={<TwilioDevice />} />
            <Route
              path="settings"
              element={<WithHeader component={Settings} />}
            />
            <Route path="lists" element={<WithHeader component={Lists} />} />
            <Route
              path="import-contacts"
              element={<WithHeader component={ImportContacts} />}
            />
            <Route
              path="create-new-list/:id?"
              element={<WithHeader component={CreateNewList} />}
            />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
