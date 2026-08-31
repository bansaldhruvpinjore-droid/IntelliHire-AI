import { useState } from "react";
import "./App.css";
import API from "./api";
import CandidateDashboard from "./CandidateDashboard";
import Jobs from "./Jobs";

function App() {
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem("access_token"))
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const response = await API.post("/auth/register", {
          name,
          email,
          password,
          role,
        });

        setMessage(
          `Account created successfully for ${response.data.name}.`
        );

        setIsRegister(false);
        setPassword("");
      } else {
        const response = await API.post("/auth/login", {
          email,
          password,
        });

        localStorage.setItem(
          "access_token",
          response.data.access_token
        );

        localStorage.setItem(
          "token_type",
          response.data.token_type
        );

        setMessage("Login successful!");
        setPassword("");
        setLoggedIn(true);
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Unable to connect to the backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setMessage("");
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setRole("candidate");
  };
if (loggedIn) {
  return (
    <>
      <CandidateDashboard />
      <Jobs />
    </>
  );
}  
  return (
    <div className="app">
      <div className="auth-container">

        <div className="brand-section">
          <h1>IntelliHire AI</h1>
          <p>Smart Recruitment Platform</p>

          <span>
            Connect talent with opportunity using intelligent
            recruitment technology.
          </span>
        </div>

        <div className="auth-card">

          <div className="auth-header">
            <h2>
              {isRegister ? "Create Account" : "Welcome Back"}
            </h2>

            <p>
              {isRegister
                ? "Create your IntelliHire account"
                : "Login to your IntelliHire account"}
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {isRegister && (
              <div className="form-group">
                <label>Name</label>

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isRegister && (
              <div className="form-group">
                <label>Role</label>

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="candidate">
                    Candidate
                  </option>

                  <option value="recruiter">
                    Recruiter
                  </option>
                </select>
              </div>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isRegister
                ? "Create Account"
                : "Login"}
            </button>

          </form>

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="switch-auth">
            <span>
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}
            </span>

            <button
              className="link-button"
              onClick={switchMode}
              type="button"
            >
              {isRegister ? "Login" : "Create account"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;