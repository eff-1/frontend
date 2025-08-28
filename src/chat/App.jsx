import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Signup } from "./Signup";
import { Login } from "./Login";
import { Dashboard } from "./Dashboard";

export const App = () => {
  const [currentUser, setCurrentUser] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            currentUser ? <Dashboard currentUser={currentUser} /> : <Navigate to="/login" />
          }
        />
        <Route path="/signup" element={<Signup setCurrentUser={setCurrentUser} />} />
        <Route path="/login" element={<Login setCurrentUser={setCurrentUser} />} />
        <Route path="/dashboard" element={<Dashboard setCurrentUser={setCurrentUser} />} />
      </Routes>
    </Router>
  );
};
