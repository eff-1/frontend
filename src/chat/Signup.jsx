import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css"; // reuse same CSS for spinner + form styles

export const Signup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // 🔹 spinner state
  const navigate = useNavigate();

  const signupData = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Field cannot be empty!!!");
      return;
    }

    setLoading(true); // show spinner

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/signup`, { username, password });
      alert("Signed up Successfully");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false); // hide spinner
    }
  };

  return (
    <div className="signup-container">
      {/* 🔹 Full screen spinner */}
      {loading && (
        <div className="screen-spinner">
          <div className="loader"></div>
          <p className="loader-text">Creating your account...</p>
        </div>
      )}

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
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="signup-input"
              disabled={loading}
            />
          </div>

          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up"}
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
