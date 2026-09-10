import { useEffect, useState } from "react";
import API from "./api";

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [timeline, setTimeline] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(
        "/applications/my",
        {
          headers: getAuthHeaders(),
        }
      );

      setApplications(response.data);
    } catch (err) {
      console.error(err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Unable to load your applications.");
      }
    } finally {
      setLoading(false);
    }
  };

  const viewTimeline = async (application) => {
    try {
      setSelectedApplication(application);
      setTimeline([]);
      setLoadingTimeline(true);
      setError("");

      const response = await API.get(
        `/applications/${application.application_id}/timeline`,
        {
          headers: getAuthHeaders(),
        }
      );

      setTimeline(response.data);
    } catch (err) {
      console.error(err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Unable to load application timeline.");
      }
    } finally {
      setLoadingTimeline(false);
    }
  };

  const closeTimeline = () => {
    setSelectedApplication(null);
    setTimeline([]);
  };

  const getStatusClass = (status) => {
    const normalized = status?.toLowerCase();

    if (normalized === "selected") {
      return "status-selected";
    }

    if (normalized === "shortlisted") {
      return "status-shortlisted";
    }

    if (normalized === "interview") {
      return "status-interview";
    }

    if (normalized === "rejected") {
      return "status-rejected";
    }

    return "status-applied";
  };

  if (loading) {
    return (
      <div className="applications-page">
        <div className="loading-card">
          <h2>Loading applications...</h2>
          <p>Fetching your latest application updates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-page">

      {/* Header */}

      <div className="applications-header">

        <div>
          <span className="dashboard-label">
            INTELLIHIRE AI
          </span>

          <h1>My Applications</h1>

          <p>
            Track all the jobs you have applied for and
            follow your recruitment progress.
          </p>
        </div>

        <div className="application-count">
          {applications.length}{" "}
          {applications.length === 1
            ? "Application"
            : "Applications"}
        </div>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Empty state */}

      {applications.length === 0 ? (

        <div className="applications-empty">

          <div className="empty-applications-icon">
            📋
          </div>

          <h2>No applications yet</h2>

          <p>
            You haven't applied for any jobs yet.
            Explore available jobs and start your
            recruitment journey.
          </p>

        </div>

      ) : (

        <div className="applications-list">

          {applications.map((application) => (

            <div
              className="application-card"
              key={application.application_id}
            >

              <div className="application-main">

                <div>

                  <h2>
                    {application.job_title}
                  </h2>

                  <h3>
                    {application.company}
                  </h3>

                </div>

                <span
                  className={`application-status ${getStatusClass(
                    application.status
                  )}`}
                >
                  {application.status}
                </span>

              </div>

              <div className="application-details">

                <span>
                  📍 {application.location}
                </span>

                <span>
                  📄 {application.resume_filename}
                </span>

                <span>
                  🆔 Application #{application.application_id}
                </span>

                <span>
                  📅{" "}
                  {new Date(
                    application.applied_at
                  ).toLocaleDateString()}
                </span>

              </div>

              <div className="application-actions">

                <button
                  className="analysis-button"
                  onClick={() =>
                    viewTimeline(application)
                  }
                >
                  View Application Timeline
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

      {/* Timeline Modal */}

      {selectedApplication && (

        <div
          className="modal-overlay"
          onClick={closeTimeline}
        >

          <div
            className="timeline-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={closeTimeline}
              aria-label="Close"
            >
              ×
            </button>

            <span className="dashboard-label">
              APPLICATION TIMELINE
            </span>

            <h2>
              {selectedApplication.job_title}
            </h2>

            <p className="timeline-company">
              {selectedApplication.company}
            </p>

            {loadingTimeline ? (

              <div className="analysis-loading">
                <h3>Loading timeline...</h3>
                <p>
                  Fetching your application history.
                </p>
              </div>

            ) : timeline.length === 0 ? (

              <div className="timeline-empty">
                <p>
                  No timeline events are available yet.
                </p>
              </div>

            ) : (

              <div className="timeline">

                {timeline.map((event, index) => (

                  <div
                    className="timeline-item"
                    key={event.id || index}
                  >

                    <div className="timeline-dot" />

                    <div className="timeline-content">

                      <div className="timeline-status">
                        {event.status}
                      </div>

                      {event.created_at && (
                        <div className="timeline-date">
                          {new Date(
                            event.created_at
                          ).toLocaleString()}
                        </div>
                      )}

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

export default MyApplications;