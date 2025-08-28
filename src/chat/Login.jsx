import { useState } from "react"; 
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css"; 

export const Login = ({ setCurrentUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loginData = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Field cannot be empty!!!");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/login`, {
        username,
        password,
      });

      const user = res.data.user;
      localStorage.setItem("user", JSON.stringify(user));
      setCurrentUser(user);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* 🔹 Full screen rolling spinner */}
      {loading && (
        <div className="screen-spinner">
          <div className="loader"></div>
          <p className="loader-text">Signing you in...</p>
        </div>
      )}

      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={loginData} className="login-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p className="signup-text">
            Don't have an account?{" "}
            <Link to="/signup" className="signup-link">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
