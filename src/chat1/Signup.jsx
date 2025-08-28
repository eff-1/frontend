import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css"; // same style pattern as Login.css

export const Signup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const signupData = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Field cannot be empty!!!");
      return;
    }

    try {
      await axios.post("https://chat-backend-9ujd.onrender.com", { username, password });
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1 className="signup-title">Create Account</h1>
          <p className="signup-subtitle">Join us and start chatting!</p>
        </div>

        <form onSubmit={signupData} className="signup-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="signup-input"
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="signup-input"
            />
          </div>

          <button type="submit" className="signup-button">
            Sign Up
          </button>
        </form>

        <div className="signup-footer">
          <p className="login-text">
            Already have an account?{" "}
            <Link to="/login" className="login-link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
