import { useEffect, useState } from "react";
import API from "./api";

function CandidateDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const response = await API.get(
          "/applications/candidate-dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setDashboard(response.data);
      } catch (err) {
        console.error(err);

        if (err.response?.data?.detail) {
          setError(err.response.data.detail);
        } else {
          setError("Unable to load candidate dashboard.");
        }
      }
    };

    loadDashboard();
  }, []);

  if (error) {
    return (
      <div className="dashboard-page">
        <h2>Candidate Dashboard</h2>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="dashboard-page">
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      <div className="dashboard-header">
        <div>
          <h1>Candidate Dashboard</h1>
          <p>Track your job applications and notifications.</p>
        </div>

        <button
          className="logout-button"
          onClick={() => {
            localStorage.removeItem("access_token");
            localStorage.removeItem("token_type");
            window.location.reload();
          }}
        >
          Logout
        </button>
      </div>

      <div className="stats-grid">

        <div className="stat-card">
          <h3>Total Applications</h3>
          <strong>{dashboard.total_applications}</strong>
        </div>

        <div className="stat-card">
          <h3>Applied</h3>
          <strong>{dashboard.applied}</strong>
        </div>

        <div className="stat-card">
          <h3>Shortlisted</h3>
          <strong>{dashboard.shortlisted}</strong>
        </div>

        <div className="stat-card">
          <h3>Interview</h3>
          <strong>{dashboard.interview}</strong>
        </div>

        <div className="stat-card">
          <h3>Selected</h3>
          <strong>{dashboard.selected}</strong>
        </div>

        <div className="stat-card">
          <h3>Rejected</h3>
          <strong>{dashboard.rejected}</strong>
        </div>

        <div className="stat-card">
          <h3>Unread Notifications</h3>
          <strong>{dashboard.unread_notifications}</strong>
        </div>

      </div>

    </div>
  );
}

export default CandidateDashboard;