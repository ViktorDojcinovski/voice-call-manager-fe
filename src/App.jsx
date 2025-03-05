import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { useAuth } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Header from "./components/Header";

// Pages
import SignIn from "./pages/SignIn";
import TwilioDevice from "./pages/TwilioDevice";

import "./App.css";

function App() {
  const { isAuthenticated } = useAuth();

  console.log("isAuthenticated: ", isAuthenticated);
  return (
    <Router>
      {isAuthenticated && <Header />} {/* Show Header only if authenticated */}
      <Routes>
        <Route path="/" element={<SignIn />} />

        {/* Private routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/device" element={<TwilioDevice />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
