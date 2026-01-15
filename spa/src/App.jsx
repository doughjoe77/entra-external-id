import { Routes, Route } from "react-router-dom";
import RequireAuth from "./RequireAuth";
import Home from "./components/Home";
import Logout from "./components/Logout";

export default function App() {
  return (
    <Routes>
      {/* Protected route */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />

      {/* Public logout page */}
      <Route path="/logout" element={<Logout />} />
    </Routes>
  );
}
