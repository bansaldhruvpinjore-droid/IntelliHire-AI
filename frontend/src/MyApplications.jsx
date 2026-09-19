import React, { useEffect, useMemo, useState } from "react";
import API from "./api";

const STATUS_ORDER = [
  "applied",
  "shortlisted",
  "interview",
  "selected",
  "rejected",
];

const STATUS_LABELS = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview: "Interview",
  selected: "Selected",
  rejected: "Rejected",
};

const STATUS_DESCRIPTIONS = {
  applied: "Your application has been submitted successfully.",
  shortlisted: "Your application has been shortlisted by the recruiter.",
  interview: "You have progressed to the interview stage.",
  selected: "Congratulations! Your application has been selected.",
  rejected: "This application is no longer active.",
};

const STATUS_STEPS = [
  "applied",
  "shortlisted",
  "interview",
  "selected",
];

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || "Unknown";
}

function getStatusDescription(status) {
  return (
    STATUS_DESCRIPTIONS[status] ||
    "Your application status has been updated."
  );
}

function getStatusIndex(status) {
  return STATUS_STEPS.indexOf(status);
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getApplicationDate(application) {
  return (
    application.applied_at ||
    application.created_at ||
    application.application_date ||
    application.updated_at ||
    0
  );
}

function getApplicationStatus(application) {
  return String(application.status || "applied").toLowerCase();
}

function getApplicationJobTitle(application) {
  return (
    application.job_title ||
    application.job?.title ||
    "Untitled Job"
  );
}

function getApplicationCompany(application) {
  return (
    application.company ||
    application.job?.company ||
    "Company not specified"
  );
}

function getApplicationLocation(application) {
  return (
    application.location ||
    application.job?.location ||
    "Location not specified"
  );
}

function getResumeFilename(application) {
  return (
    application.resume_filename ||
    application.resume?.filename ||
    "Resume not specified"
  );
}

function getMatchScore(application) {
  const score = Number(
    application.match_score ??
      application.ai_match_score ??
      application.matchScore ??
      0
  );

  if (Number.isNaN(score)) return 0;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getMatchedSkills(application) {
  return Array.isArray(application.matched_skills)
    ? application.matched_skills
    : [];
}

function getMissingSkills(application) {
  return Array.isArray(application.missing_skills)
    ? application.missing_skills
    : [];
}

function getProgressPercentage(status) {
  if (status === "rejected") {
    return 100;
  }

  const index = getStatusIndex(status);

  if (index === -1) {
    return 25;
  }

  return ((index + 1) / STATUS_STEPS.length) * 100;
}

function getProgressMessage(status) {
  switch (status) {
    case "shortlisted":
      return "Your profile has passed the initial screening.";
    case "interview":
      return "You are currently in the interview stage.";
    case "selected":
      return "Your application has reached the selected stage.";
    case "rejected":
      return "This application is closed.";
    default:
      return "Your application is currently under consideration.";
  }
}

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/applications/my");

      const data = Array.isArray(response.data) ? response.data : [];

      setApplications(data);
    } catch (err) {
      console.error("Failed to load applications:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load your applications."
      );
    } finally {
      setLoading(false);
    }
  }

  async function openTimeline(application) {
    setSelectedApplication(application);
    setTimeline([]);
    setTimelineError("");
    setTimelineLoading(true);

    try {
      const response = await API.get(
        `/applications/${application.id}/timeline`
      );

      setTimeline(
        Array.isArray(response.data)
          ? response.data
          : response.data?.timeline || []
      );
    } catch (err) {
      console.error("Failed to load timeline:", err);

      setTimelineError(
        err.response?.data?.detail ||
          "Unable to load application timeline."
      );
    } finally {
      setTimelineLoading(false);
    }
  }

  function closeTimeline() {
    setSelectedApplication(null);
    setTimeline([]);
    setTimelineError("");
  }

  const statusCounts = useMemo(() => {
    const counts = {
      all: applications.length,
      active: 0,
      shortlisted: 0,
      interview: 0,
      selected: 0,
      rejected: 0,
      applied: 0,
    };

    applications.forEach((application) => {
      const status = getApplicationStatus(application);

      if (counts[status] !== undefined) {
        counts[status] += 1;
      }

      if (status !== "rejected" && status !== "selected") {
        counts.active += 1;
      }
    });

    return counts;
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = applications.filter((application) => {
      const status = getApplicationStatus(application);

      let matchesFilter = true;

      if (activeFilter === "active") {
        matchesFilter =
          status !== "rejected" && status !== "selected";
      } else if (activeFilter !== "all") {
        matchesFilter = status === activeFilter;
      }

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const title = getApplicationJobTitle(application).toLowerCase();
      const company = getApplicationCompany(application).toLowerCase();

      return (
        title.includes(query) ||
        company.includes(query)
      );
    });

    return [...filtered].sort((a, b) => {
      const dateA = new Date(getApplicationDate(a)).getTime();
      const dateB = new Date(getApplicationDate(b)).getTime();

      const safeA = Number.isNaN(dateA) ? 0 : dateA;
      const safeB = Number.isNaN(dateB) ? 0 : dateB;

      return safeB - safeA;
    });
  }, [applications, activeFilter, searchQuery]);

  const summary = useMemo(() => {
    return {
      total: applications.length,
      active: statusCounts.active,
      selected: statusCounts.selected,
      rejected: statusCounts.rejected,
    };
  }, [applications.length, statusCounts]);

  function clearFilters() {
    setActiveFilter("all");
    setSearchQuery("");
  }

  if (loading) {
    return (
      <div className="applications-page">
        <div className="applications-loading">
          <div className="applications-spinner"></div>
          <p>Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-page">
      <div className="applications-header">
        <div>
          <p className="applications-eyebrow">
            CANDIDATE PORTAL
          </p>

          <h1>My Applications</h1>

          <p className="applications-subtitle">
            Track your job applications, AI match scores, and
            recruitment progress in one place.
          </p>
        </div>

        <button
          className="applications-refresh-btn"
          onClick={loadApplications}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="applications-error">
          <strong>Unable to load applications</strong>
          <span>{error}</span>
          <button onClick={loadApplications}>
            Try Again
          </button>
        </div>
      )}

      <div className="applications-summary-grid">
        <div className="application-summary-card">
          <div className="summary-icon">📋</div>

          <div>
            <span>Total Applications</span>
            <strong>{summary.total}</strong>
          </div>
        </div>

        <div className="application-summary-card">
          <div className="summary-icon">⚡</div>

          <div>
            <span>Active Applications</span>
            <strong>{summary.active}</strong>
          </div>
        </div>

        <div className="application-summary-card">
          <div className="summary-icon">🏆</div>

          <div>
            <span>Selected</span>
            <strong>{summary.selected}</strong>
          </div>
        </div>

        <div className="application-summary-card">
          <div className="summary-icon">📁</div>

          <div>
            <span>Closed</span>
            <strong>{summary.rejected}</strong>
          </div>
        </div>
      </div>

      <div className="applications-toolbar">
        <div className="applications-search-wrapper">
          <span className="applications-search-icon">
            🔍
          </span>

          <input
            type="text"
            placeholder="Search by job title or company..."
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
          />
        </div>

        <button
          className="applications-clear-btn"
          onClick={clearFilters}
          disabled={
            activeFilter === "all" && searchQuery === ""
          }
        >
          Clear Filters
        </button>
      </div>

      <div className="application-filter-section">
        <div className="application-filter-tabs">
          <button
            className={
              activeFilter === "all"
                ? "application-filter active"
                : "application-filter"
            }
            onClick={() => setActiveFilter("all")}
          >
            All
            <span>{statusCounts.all}</span>
          </button>

          <button
            className={
              activeFilter === "active"
                ? "application-filter active"
                : "application-filter"
            }
            onClick={() => setActiveFilter("active")}
          >
            Active
            <span>{statusCounts.active}</span>
          </button>

          <button
            className={
              activeFilter === "shortlisted"
                ? "application-filter active"
                : "application-filter"
            }
            onClick={() => setActiveFilter("shortlisted")}
          >
            Shortlisted
            <span>{statusCounts.shortlisted}</span>
          </button>

          <button
            className={
              activeFilter === "interview"
                ? "application-filter active"
                : "application-filter"
            }
            onClick={() => setActiveFilter("interview")}
          >
            Interview
            <span>{statusCounts.interview}</span>
          </button>

          <button
            className={
              activeFilter === "selected"
                ? "application-filter active"
                : "application-filter"
            }
            onClick={() => setActiveFilter("selected")}
          >
            Selected
            <span>{statusCounts.selected}</span>
          </button>

          <button
            className={
              activeFilter === "rejected"
                ? "application-filter active"
                : "application-filter"
            }
            onClick={() => setActiveFilter("rejected")}
          >
            Rejected
            <span>{statusCounts.rejected}</span>
          </button>
        </div>
      </div>

      <div className="applications-results-info">
        <span>
          Showing{" "}
          <strong>{filteredApplications.length}</strong>{" "}
          of{" "}
          <strong>{applications.length}</strong>{" "}
          applications
        </span>

        {(activeFilter !== "all" || searchQuery) && (
          <span className="applications-filter-active">
            Filters applied
          </span>
        )}
      </div>

      {filteredApplications.length === 0 ? (
        <div className="applications-empty">
          <div className="applications-empty-icon">
            {applications.length === 0 ? "📭" : "🔎"}
          </div>

          <h2>
            {applications.length === 0
              ? "No applications yet"
              : "No matching applications"}
          </h2>

          <p>
            {applications.length === 0
              ? "Once you apply for jobs, your applications will appear here."
              : "Try changing the status filter or search query."}
          </p>

          {applications.length > 0 && (
            <button
              className="applications-empty-btn"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="applications-list">
          {filteredApplications.map((application) => {
            const status = getApplicationStatus(application);
            const score = getMatchScore(application);
            const matchedSkills = getMatchedSkills(application);
            const missingSkills = getMissingSkills(application);
            const progress = getProgressPercentage(status);

            const jobTitle =
              getApplicationJobTitle(application);
            const company =
              getApplicationCompany(application);
            const location =
              getApplicationLocation(application);
            const resumeFilename =
              getResumeFilename(application);

            return (
              <div
                className="application-card"
                key={application.id}
              >
                <div className="application-card-header">
                  <div className="application-job-info">
                    <div className="application-job-icon">
                      💼
                    </div>

                    <div>
                      <h2>{jobTitle}</h2>

                      <p>
                        <strong>{company}</strong>
                        <span> • </span>
                        {location}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`application-status status-${status}`}
                  >
                    {getStatusLabel(status)}
                  </div>
                </div>

                <div className="application-card-meta">
                  <div>
                    <span>Applied On</span>
                    <strong>
                      {formatDate(
                        getApplicationDate(application)
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Resume Used</span>
                    <strong>{resumeFilename}</strong>
                  </div>

                  <div>
                    <span>Application ID</span>
                    <strong>#{application.id}</strong>
                  </div>
                </div>

                <div className="application-intelligence">
                  <div className="application-match-box">
                    <div className="application-match-header">
                      <span>AI Match Score</span>
                      <strong>{score}%</strong>
                    </div>

                    <div className="application-match-track">
                      <div
                        className="application-match-fill"
                        style={{
                          width: `${score}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="application-skills">
                    <div className="application-skill-group">
                      <span className="skill-group-title">
                        Matched Skills
                      </span>

                      <div className="application-skill-list">
                        {matchedSkills.length > 0 ? (
                          matchedSkills.map(
                            (skill, index) => (
                              <span
                                className="matched-skill"
                                key={`${skill}-${index}`}
                              >
                                ✓ {skill}
                              </span>
                            )
                          )
                        ) : (
                          <span className="no-skills">
                            No matched skills recorded
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="application-skill-group">
                      <span className="skill-group-title">
                        Missing Skills
                      </span>

                      <div className="application-skill-list">
                        {missingSkills.length > 0 ? (
                          missingSkills.map(
                            (skill, index) => (
                              <span
                                className="missing-skill"
                                key={`${skill}-${index}`}
                              >
                                + {skill}
                              </span>
                            )
                          )
                        ) : (
                          <span className="no-skills">
                            No missing skills recorded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="application-progress-section">
                  <div className="application-progress-header">
                    <div>
                      <span>Recruitment Progress</span>
                      <strong>
                        {getStatusLabel(status)}
                      </strong>
                    </div>

                    <span>{Math.round(progress)}%</span>
                  </div>

                  <div className="application-progress-track">
                    <div
                      className={`application-progress-fill progress-${status}`}
                      style={{
                        width: `${progress}%`,
                      }}
                    ></div>
                  </div>

                  <div className="application-progress-steps">
                    {STATUS_STEPS.map(
                      (step, index) => {
                        const currentIndex =
                          getStatusIndex(status);

                        const completed =
                          status !== "rejected" &&
                          currentIndex >= index;

                        return (
                          <div
                            className={
                              completed
                                ? "progress-step completed"
                                : "progress-step"
                            }
                            key={step}
                          >
                            <div className="progress-step-dot">
                              {completed ? "✓" : index + 1}
                            </div>

                            <span>
                              {getStatusLabel(step)}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="application-status-message">
                  <strong>
                    {getStatusLabel(status)}
                  </strong>

                  <span>
                    {getProgressMessage(status)}
                  </span>
                </div>

                <div className="application-card-footer">
                  <button
                    className="application-timeline-btn"
                    onClick={() =>
                      openTimeline(application)
                    }
                  >
                    View Application Timeline →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedApplication && (
        <div
          className="application-modal-overlay"
          onClick={closeTimeline}
        >
          <div
            className="application-timeline-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="timeline-modal-header">
              <div>
                <span>APPLICATION TIMELINE</span>

                <h2>
                  {getApplicationJobTitle(
                    selectedApplication
                  )}
                </h2>

                <p>
                  {getApplicationCompany(
                    selectedApplication
                  )}
                </p>
              </div>

              <button
                className="timeline-close-btn"
                onClick={closeTimeline}
              >
                ×
              </button>
            </div>

            <div className="timeline-modal-summary">
              <div>
                <span>Status</span>
                <strong>
                  {getStatusLabel(
                    getApplicationStatus(
                      selectedApplication
                    )
                  )}
                </strong>
              </div>

              <div>
                <span>Applied</span>
                <strong>
                  {formatDate(
                    getApplicationDate(
                      selectedApplication
                    )
                  )}
                </strong>
              </div>

              <div>
                <span>AI Match</span>
                <strong>
                  {getMatchScore(
                    selectedApplication
                  )}
                  %
                </strong>
              </div>
            </div>

            {timelineLoading && (
              <div className="timeline-loading">
                <div className="applications-spinner"></div>
                <p>Loading timeline...</p>
              </div>
            )}

            {timelineError && (
              <div className="timeline-error">
                {timelineError}
              </div>
            )}

            {!timelineLoading &&
              !timelineError &&
              timeline.length === 0 && (
                <div className="timeline-empty">
                  <div>🕒</div>
                  <p>
                    No timeline events are available yet.
                  </p>
                </div>
              )}

            {!timelineLoading &&
              !timelineError &&
              timeline.length > 0 && (
                <div className="timeline">
                  {timeline.map((event, index) => {
                    const eventStatus = String(
                      event.status ||
                        event.new_status ||
                        event.application_status ||
                        "applied"
                    ).toLowerCase();

                    return (
                      <div
                        className="timeline-item"
                        key={
                          event.id ||
                          `${eventStatus}-${index}`
                        }
                      >
                        <div className="timeline-marker">
                          <div className="timeline-dot">
                            ✓
                          </div>

                          {index <
                            timeline.length - 1 && (
                            <div className="timeline-line"></div>
                          )}
                        </div>

                        <div className="timeline-content">
                          <div className="timeline-content-header">
                            <h3>
                              {getStatusLabel(
                                eventStatus
                              )}
                            </h3>

                            <span>
                              {formatDate(
                                event.created_at ||
                                  event.changed_at ||
                                  event.timestamp
                              )}
                            </span>
                          </div>

                          <p>
                            {event.message ||
                              event.description ||
                              `Application status changed to ${getStatusLabel(
                                eventStatus
                              )}.`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            <div className="timeline-modal-footer">
              <span>
                {getStatusDescription(
                  getApplicationStatus(
                    selectedApplication
                  )
                )}
              </span>

              <button
                onClick={closeTimeline}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .applications-page {
          max-width: 1180px;
          margin: 0 auto;
          padding: 34px 24px 60px;
        }

        .applications-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }

        .applications-eyebrow {
          margin: 0 0 8px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
          opacity: 0.6;
        }

        .applications-header h1 {
          margin: 0;
          font-size: 34px;
          line-height: 1.15;
        }

        .applications-subtitle {
          margin: 10px 0 0;
          max-width: 700px;
          opacity: 0.72;
          line-height: 1.6;
        }

        .applications-refresh-btn,
        .applications-clear-btn,
        .applications-empty-btn {
          border: 1px solid rgba(127, 127, 127, 0.25);
          background: rgba(127, 127, 127, 0.08);
          border-radius: 10px;
          padding: 10px 15px;
          cursor: pointer;
          font-weight: 700;
        }

        .applications-refresh-btn:hover,
        .applications-clear-btn:hover,
        .applications-empty-btn:hover {
          transform: translateY(-1px);
        }

        .applications-refresh-btn {
          white-space: nowrap;
        }

        .applications-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .application-summary-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px;
          border: 1px solid rgba(127, 127, 127, 0.18);
          border-radius: 16px;
          background: rgba(127, 127, 127, 0.05);
        }

        .summary-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(127, 127, 127, 0.1);
          font-size: 20px;
        }

        .application-summary-card span {
          display: block;
          font-size: 12px;
          opacity: 0.62;
          margin-bottom: 5px;
        }

        .application-summary-card strong {
          display: block;
          font-size: 24px;
        }

        .applications-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .applications-search-wrapper {
          flex: 1;
          position: relative;
        }

        .applications-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.55;
        }

        .applications-search-wrapper input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(127, 127, 127, 0.25);
          border-radius: 11px;
          padding: 12px 15px 12px 42px;
          background: rgba(127, 127, 127, 0.05);
          color: inherit;
          outline: none;
          font-size: 14px;
        }

        .applications-search-wrapper input:focus {
          border-color: rgba(100, 120, 255, 0.55);
        }

        .applications-clear-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        .application-filter-section {
          margin-bottom: 16px;
          overflow-x: auto;
        }

        .application-filter-tabs {
          display: flex;
          gap: 8px;
          min-width: max-content;
          padding-bottom: 4px;
        }

        .application-filter {
          border: 1px solid rgba(127, 127, 127, 0.22);
          background: transparent;
          color: inherit;
          border-radius: 999px;
          padding: 9px 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 13px;
        }

        .application-filter span {
          min-width: 21px;
          height: 21px;
          padding: 0 5px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(127, 127, 127, 0.1);
          font-size: 11px;
        }

        .application-filter.active {
          background: rgba(100, 120, 255, 0.14);
          border-color: rgba(100, 120, 255, 0.42);
        }

        .applications-results-info {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin: 8px 0 16px;
          font-size: 13px;
          opacity: 0.68;
        }

        .applications-filter-active {
          font-weight: 700;
        }

        .applications-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .application-card {
          border: 1px solid rgba(127, 127, 127, 0.18);
          border-radius: 18px;
          padding: 22px;
          background: rgba(127, 127, 127, 0.045);
        }

        .application-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .application-job-info {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .application-job-icon {
          width: 46px;
          height: 46px;
          flex: 0 0 46px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(127, 127, 127, 0.1);
          font-size: 21px;
        }

        .application-job-info h2 {
          margin: 0 0 5px;
          font-size: 20px;
        }

        .application-job-info p {
          margin: 0;
          opacity: 0.68;
          font-size: 13px;
        }

        .application-status {
          flex: 0 0 auto;
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid rgba(127, 127, 127, 0.18);
        }

        .status-applied {
          background: rgba(80, 140, 255, 0.12);
        }

        .status-shortlisted {
          background: rgba(160, 100, 255, 0.12);
        }

        .status-interview {
          background: rgba(255, 180, 60, 0.14);
        }

        .status-selected {
          background: rgba(70, 190, 120, 0.14);
        }

        .status-rejected {
          background: rgba(230, 80, 80, 0.12);
        }

        .application-card-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin: 22px 0;
          padding: 15px;
          border-radius: 12px;
          background: rgba(127, 127, 127, 0.055);
        }

        .application-card-meta span {
          display: block;
          font-size: 11px;
          opacity: 0.55;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .application-card-meta strong {
          display: block;
          font-size: 13px;
          word-break: break-word;
        }

        .application-intelligence {
          display: grid;
          grid-template-columns: minmax(250px, 0.7fr) minmax(350px, 1.3fr);
          gap: 18px;
          margin-bottom: 20px;
        }

        .application-match-box,
        .application-skills {
          padding: 16px;
          border: 1px solid rgba(127, 127, 127, 0.15);
          border-radius: 13px;
        }

        .application-match-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .application-match-header span {
          font-size: 13px;
          opacity: 0.7;
        }

        .application-match-header strong {
          font-size: 24px;
        }

        .application-match-track,
        .application-progress-track {
          height: 8px;
          border-radius: 999px;
          background: rgba(127, 127, 127, 0.13);
          overflow: hidden;
        }

        .application-match-fill,
        .application-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: currentColor;
        }

        .application-skills {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .skill-group-title {
          display: block;
          margin-bottom: 9px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.62;
        }

        .application-skill-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .matched-skill,
        .missing-skill {
          display: inline-flex;
          padding: 5px 8px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
          background: rgba(127, 127, 127, 0.09);
        }

        .no-skills {
          font-size: 11px;
          opacity: 0.5;
        }

        .application-progress-section {
          padding: 17px;
          border-radius: 13px;
          background: rgba(127, 127, 127, 0.055);
          margin-bottom: 16px;
        }

        .application-progress-header {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 11px;
        }

        .application-progress-header div span,
        .application-progress-header div strong {
          display: block;
        }

        .application-progress-header div span {
          font-size: 11px;
          opacity: 0.55;
          margin-bottom: 4px;
          text-transform: uppercase;
        }

        .application-progress-header div strong {
          font-size: 14px;
        }

        .application-progress-header > span {
          font-weight: 800;
          font-size: 13px;
        }

        .progress-applied {
          background: currentColor;
        }

        .progress-shortlisted {
          background: currentColor;
        }

        .progress-interview {
          background: currentColor;
        }

        .progress-selected {
          background: currentColor;
        }

        .progress-rejected {
          background: currentColor;
        }

        .application-progress-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-top: 15px;
        }

        .progress-step {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          opacity: 0.45;
        }

        .progress-step.completed {
          opacity: 1;
          font-weight: 700;
        }

        .progress-step-dot {
          width: 23px;
          height: 23px;
          flex: 0 0 23px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(127, 127, 127, 0.12);
          font-size: 10px;
        }

        .progress-step.completed .progress-step-dot {
          background: rgba(80, 170, 120, 0.17);
        }

        .application-status-message {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 13px 15px;
          border-left: 3px solid currentColor;
          background: rgba(127, 127, 127, 0.045);
          margin-bottom: 17px;
        }

        .application-status-message strong {
          font-size: 13px;
        }

        .application-status-message span {
          font-size: 12px;
          opacity: 0.66;
        }

        .application-card-footer {
          display: flex;
          justify-content: flex-end;
        }

        .application-timeline-btn {
          border: none;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-weight: 800;
          font-size: 13px;
          padding: 8px 0;
        }

        .application-timeline-btn:hover {
          opacity: 0.7;
        }

        .applications-empty,
        .applications-error {
          border: 1px solid rgba(127, 127, 127, 0.18);
          border-radius: 18px;
          padding: 45px 25px;
          text-align: center;
          background: rgba(127, 127, 127, 0.045);
        }

        .applications-empty-icon {
          font-size: 38px;
          margin-bottom: 12px;
        }

        .applications-empty h2 {
          margin: 0 0 8px;
        }

        .applications-empty p {
          margin: 0 0 18px;
          opacity: 0.65;
        }

        .applications-empty-btn {
          display: inline-block;
        }

        .applications-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-bottom: 22px;
        }

        .applications-error span {
          opacity: 0.65;
          font-size: 13px;
        }

        .applications-error button {
          margin-top: 5px;
          border: none;
          border-radius: 9px;
          padding: 9px 14px;
          cursor: pointer;
          font-weight: 700;
        }

        .applications-loading,
        .timeline-loading {
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          opacity: 0.7;
        }

        .applications-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(127, 127, 127, 0.2);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: applicationSpin 0.8s linear infinite;
        }

        @keyframes applicationSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .application-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.48);
          backdrop-filter: blur(5px);
        }

        .application-timeline-modal {
          width: min(760px, 100%);
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 20px;
          padding: 24px;
          background: var(--background, #ffffff);
          color: var(--foreground, #111111);
          box-shadow: 0 20px 70px rgba(0, 0, 0, 0.3);
        }

        .timeline-modal-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .timeline-modal-header > div > span {
          font-size: 10px;
          letter-spacing: 1.2px;
          font-weight: 800;
          opacity: 0.55;
        }

        .timeline-modal-header h2 {
          margin: 7px 0 4px;
        }

        .timeline-modal-header p {
          margin: 0;
          opacity: 0.65;
        }

        .timeline-close-btn {
          width: 35px;
          height: 35px;
          border: none;
          border-radius: 50%;
          background: rgba(127, 127, 127, 0.1);
          cursor: pointer;
          font-size: 22px;
        }

        .timeline-modal-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 25px;
        }

        .timeline-modal-summary div {
          padding: 13px;
          border-radius: 11px;
          background: rgba(127, 127, 127, 0.07);
        }

        .timeline-modal-summary span,
        .timeline-modal-summary strong {
          display: block;
        }

        .timeline-modal-summary span {
          font-size: 10px;
          opacity: 0.55;
          margin-bottom: 5px;
          text-transform: uppercase;
        }

        .timeline-modal-summary strong {
          font-size: 13px;
        }

        .timeline {
          display: flex;
          flex-direction: column;
        }

        .timeline-item {
          display: flex;
          gap: 14px;
        }

        .timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .timeline-dot {
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(80, 170, 120, 0.16);
          font-size: 12px;
          font-weight: 800;
        }

        .timeline-line {
          width: 2px;
          flex: 1;
          min-height: 45px;
          background: rgba(127, 127, 127, 0.18);
        }

        .timeline-content {
          flex: 1;
          padding: 2px 0 25px;
        }

        .timeline-content-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .timeline-content-header h3 {
          margin: 0;
          font-size: 14px;
        }

        .timeline-content-header span {
          font-size: 11px;
          opacity: 0.55;
        }

        .timeline-content p {
          margin: 7px 0 0;
          font-size: 12px;
          opacity: 0.67;
          line-height: 1.5;
        }

        .timeline-empty,
        .timeline-error {
          text-align: center;
          padding: 35px 20px;
          opacity: 0.7;
        }

        .timeline-empty div {
          font-size: 30px;
          margin-bottom: 8px;
        }

        .timeline-modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding-top: 18px;
          border-top: 1px solid rgba(127, 127, 127, 0.15);
        }

        .timeline-modal-footer span {
          font-size: 12px;
          opacity: 0.65;
        }

        .timeline-modal-footer button {
          border: none;
          border-radius: 9px;
          padding: 9px 16px;
          cursor: pointer;
          font-weight: 700;
        }

        @media (max-width: 900px) {
          .applications-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .application-intelligence {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .applications-page {
            padding: 25px 15px 45px;
          }

          .applications-header {
            flex-direction: column;
          }

          .applications-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .applications-summary-grid {
            grid-template-columns: 1fr 1fr;
          }

          .application-card-header {
            flex-direction: column;
          }

          .application-card-meta {
            grid-template-columns: 1fr;
          }

          .application-skills {
            grid-template-columns: 1fr;
          }

          .application-progress-steps {
            grid-template-columns: 1fr 1fr;
          }

          .applications-results-info {
            flex-direction: column;
            gap: 5px;
          }

          .timeline-modal-summary {
            grid-template-columns: 1fr;
          }

          .timeline-modal-footer {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}