import { HashRouter as Router, Routes, Route } from "react-router-dom";

import { useAuth } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

// Pages
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import TwilioDevice from "./pages/TwilioDevice";
import Settings from "./pages/Settings";

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
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
