import { useState } from "react";
import "./App.css";
import API from "./api";

import CandidateDashboard from "./CandidateDashboard";
import Jobs from "./Jobs";
import ResumeUpload from "./ResumeUpload";
import MyApplications from "./MyApplications";
import RecruiterDashboard from "./RecruiterDashboard";
import RecruiterApplications from "./RecruiterApplications";
import CreateJob from "./CreateJob";
import RecruiterJobs from "./RecruiterJobs";

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

  const [activePage, setActivePage] = useState(
    localStorage.getItem("user_role") === "recruiter"
      ? "recruiter-dashboard"
      : "dashboard"
  );

  const [userRole, setUserRole] = useState(
    localStorage.getItem("user_role") || "candidate"
  );

  const [recruiterSelectedJobId, setRecruiterSelectedJobId] =
    useState(null);

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

        const loggedInRole = response.data.role || "candidate";

        localStorage.setItem("user_role", loggedInRole);

        setUserRole(loggedInRole);
        setLoggedIn(true);

        setMessage("Login successful!");
        setPassword("");

        if (loggedInRole === "recruiter") {
          setActivePage("recruiter-dashboard");
        } else {
          setActivePage("dashboard");
        }
      }
    } catch (err) {
      console.error(err);

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

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user_role");

    setLoggedIn(false);
    setUserRole("candidate");
    setRecruiterSelectedJobId(null);
    setActivePage("dashboard");

    setMessage("");
    setError("");
  };

  const openRecruiterApplications = (jobId) => {
    setRecruiterSelectedJobId(jobId);
    setActivePage("recruiter-applications");
  };

  const renderPage = () => {
    switch (activePage) {
      case "jobs":
        return <Jobs />;

      case "resume":
        return <ResumeUpload />;

      case "applications":
        return <MyApplications />;

      case "recruiter-dashboard":
        return (
          <RecruiterDashboard
            onViewApplicants={openRecruiterApplications}
          />
        );

      case "recruiter-applications":
        return (
          <RecruiterApplications
            initialJobId={recruiterSelectedJobId}
          />
        );

      case "create-job":
        return <CreateJob />;
      
      case "recruiter-jobs":
       return (
         <RecruiterJobs
           onViewApplicants={openRecruiterApplications}
         />
       );

      case "dashboard":
      default:
        return <CandidateDashboard />;
    }
  };

  if (loggedIn) {
    return (
      <div className="app-shell">
        <header className="main-navbar">

          <div
            className="navbar-brand"
            onClick={() =>
              setActivePage(
                userRole === "recruiter"
                  ? "recruiter-dashboard"
                  : "dashboard"
              )
            }
          >
            <div className="brand-logo">
              IH
            </div>

            <div>
              <h2>IntelliHire AI</h2>
              <span>Smart Recruitment Platform</span>
            </div>
          </div>

          <nav className="navbar-links">
            {userRole === "candidate" ? (
              <>
                <button
                  className={
                    activePage === "dashboard"
                      ? "nav-link active"
                      : "nav-link"
                  }
                  onClick={() => setActivePage("dashboard")}
                >
                  Dashboard
                </button>

                <button
                  className={
                    activePage === "jobs"
                      ? "nav-link active"
                      : "nav-link"
                  }
                  onClick={() => setActivePage("jobs")}
                >
                  Find Jobs
                </button>

                <button
                  className={
                    activePage === "resume"
                      ? "nav-link active"
                      : "nav-link"
                  }
                  onClick={() => setActivePage("resume")}
                >
                  Resume Center
                </button>

                <button
                  className={
                    activePage === "applications"
                      ? "nav-link active"
                      : "nav-link"
                  }
                  onClick={() =>
                    setActivePage("applications")
                  }
                >
                  My Applications
                </button>
              </>
            ) : (
              <>
                <button
                  className={
                    activePage === "recruiter-dashboard"
                      ? "nav-link active"
                      : "nav-link"
                  }
                  onClick={() =>
                    setActivePage("recruiter-dashboard")
                  }
                >
                  Recruiter Dashboard
                </button>

                <button
                  className={
                    activePage === "create-job"
                      ? "nav-link active"
                      : "nav-link"
                  }
                  onClick={() =>
                    setActivePage("create-job")
                  }
                >
                  Create Job
                </button>
                <button
                  className={
                    activePage === "recruiter-jobs"
                      ? "nav-link active"
                      : "nav-link"
                  } 
                  onClick={() =>
                    setActivePage("recruiter-jobs")
                  }
                >
                  My Jobs
                </button>

                <button
                  className={
                    activePage === "recruiter-applications"
                      ? "nav-link active"
                      : "nav-link"
                  }
                  onClick={() =>
                    setActivePage("recruiter-applications")
                  }
                >
                  Applicants
                </button>
              </>
            )}
          </nav>

          <button
            className="navbar-logout"
            onClick={handleLogout}
          >
            Logout
          </button>

        </header>

        <main className="main-content">
          {renderPage()}
        </main>
      </div>
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
              {isRegister
                ? "Create Account"
                : "Welcome Back"}
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
                  onChange={(e) =>
                    setName(e.target.value)
                  }
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
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />

            </div>

            <div className="form-group">

              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

            </div>

            {isRegister && (
              <div className="form-group">

                <label>Role</label>

                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value)
                  }
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
              {isRegister
                ? "Login"
                : "Create account"}
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

export default App;