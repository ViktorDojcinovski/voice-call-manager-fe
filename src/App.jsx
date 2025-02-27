import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import PrivateRoute from "./components/PrivateRoute";

import Login from "./pages/Login";
import TwilioDevice from "./pages/TwilioDevice";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Private routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/device" element={<TwilioDevice />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
