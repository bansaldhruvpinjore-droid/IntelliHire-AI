import { useEffect, useState } from "react";
import API from "./api";

function CandidateDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          setError("Please login to access your dashboard.");
          return;
        }

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

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    window.location.reload();
  };

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="error-message">
          <h2>Unable to Load Dashboard</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="dashboard-page">
        <div className="loading-card">
          <h2>Loading your dashboard...</h2>
          <p>
            Please wait while we fetch your latest information.
          </p>
        </div>
      </div>
    );
  }

  const totalApplications = dashboard.total_applications || 0;
  const applied = dashboard.applied || 0;
  const shortlisted = dashboard.shortlisted || 0;
  const interview = dashboard.interview || 0;
  const selected = dashboard.selected || 0;
  const rejected = dashboard.rejected || 0;
  const unreadNotifications =
    dashboard.unread_notifications || 0;

  const activeApplications =
    applied + shortlisted + interview;

  const selectionRate =
    totalApplications > 0
      ? Math.round((selected / totalApplications) * 100)
      : 0;

  const progressRate =
    totalApplications > 0
      ? Math.round(
          ((shortlisted + interview + selected) /
            totalApplications) *
            100
        )
      : 0;

  return (
    <div className="dashboard-page">

      {/* Header */}

      <div className="dashboard-header">

        <div>
          <span className="dashboard-label">
            INTELLIHIRE AI
          </span>

          <h1>Candidate Dashboard</h1>

          <p>
            Track your applications, hiring progress and
            notifications from one place.
          </p>
        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>

      </div>

      {/* Main Statistics */}

      <div className="stats-grid">

        <div className="stat-card">
          <span className="stat-icon">📋</span>

          <h3>Total Applications</h3>

          <strong>{totalApplications}</strong>

          <p>Applications submitted</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">📨</span>

          <h3>Applied</h3>

          <strong>{applied}</strong>

          <p>Currently under review</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">⭐</span>

          <h3>Shortlisted</h3>

          <strong>{shortlisted}</strong>

          <p>Selected for next stage</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">🎯</span>

          <h3>Interview</h3>

          <strong>{interview}</strong>

          <p>Interview stage</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">🏆</span>

          <h3>Selected</h3>

          <strong>{selected}</strong>

          <p>Successfully selected</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">❌</span>

          <h3>Rejected</h3>

          <strong>{rejected}</strong>

          <p>Applications rejected</p>
        </div>

      </div>

      {/* Recruitment Progress */}

      <div className="dashboard-section">

        <div className="section-header">

          <div>
            <h2>Recruitment Progress</h2>

            <p>
              Overview of your current application journey.
            </p>
          </div>

          <span className="application-count">
            {progressRate}% Progress
          </span>

        </div>

        <div className="candidate-progress-card">

          <div className="progress-summary">

            <div>
              <span>Active Applications</span>
              <strong>{activeApplications}</strong>
            </div>

            <div>
              <span>Selection Rate</span>
              <strong>{selectionRate}%</strong>
            </div>

            <div>
              <span>Unread Notifications</span>
              <strong>{unreadNotifications}</strong>
            </div>

          </div>

          <div className="progress-bar-wrapper">

            <div className="progress-bar-background">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${progressRate}%`,
                }}
              />
            </div>

            <div className="progress-labels">
              <span>Application Submitted</span>
              <span>Hiring Progress</span>
            </div>

          </div>

        </div>

      </div>

      {/* Application Overview */}

      <div className="dashboard-section">

        <div className="section-header">

          <div>
            <h2>Application Overview</h2>

            <p>
              Your current recruitment pipeline.
            </p>
          </div>

          <span className="application-count">
            {totalApplications} Total
          </span>

        </div>

        {totalApplications === 0 ? (

          <div className="empty-state">

            <h3>No applications yet</h3>

            <p>
              You haven't applied to any jobs yet.
              Explore available opportunities and
              submit your first application.
            </p>

          </div>

        ) : (

          <div className="application-overview">

            <div className="overview-item">
              <span>Applied</span>
              <strong>{applied}</strong>
            </div>

            <div className="overview-item">
              <span>Shortlisted</span>
              <strong>{shortlisted}</strong>
            </div>

            <div className="overview-item">
              <span>Interview</span>
              <strong>{interview}</strong>
            </div>

            <div className="overview-item">
              <span>Selected</span>
              <strong>{selected}</strong>
            </div>

            <div className="overview-item">
              <span>Rejected</span>
              <strong>{rejected}</strong>
            </div>

          </div>

        )}

      </div>

      {/* Notifications */}

      <div className="dashboard-section notification-section">

        <div>
          <h2>Notifications</h2>

          <p>
            Stay updated about your application status.
          </p>
        </div>

        <div className="notification-number">
          <strong>{unreadNotifications}</strong>

          <span>
            {unreadNotifications === 1
              ? "Unread"
              : "Unread"}
          </span>
        </div>

      </div>

      {/* Quick Actions */}

      <div className="dashboard-section">

        <div className="section-header">

          <div>
            <h2>Quick Actions</h2>

            <p>
              Continue your recruitment journey.
            </p>
          </div>

        </div>

        <div className="quick-actions">

          <button
            className="action-button primary-action"
            onClick={() => {
              window.location.hash = "jobs";
            }}
          >
            🔎 Find Jobs
          </button>

          <button
            className="action-button"
            onClick={() => {
              window.location.hash = "resume";
            }}
          >
            📄 Upload Resume
          </button>

          <button
            className="action-button"
            onClick={() => {
              window.location.hash = "applications";
            }}
          >
            📋 My Applications
          </button>

        </div>

      </div>

    </div>
  );
}

export default CandidateDashboard;