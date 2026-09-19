import { useEffect, useState } from "react";
import API from "./api";

function CandidateDashboard() {
  const [notifications, setNotifications] = useState([]);
  const [resume, setResume] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [recommendationsError, setRecommendationsError] =
    useState("");

  // Match analysis state
  const [selectedJob, setSelectedJob] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState("");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = getAuthHeaders();

      const [resumeResponse, notificationResponse] =
        await Promise.all([
          API.get("/resumes/", {
            headers,
          }),
          API.get("/notifications/", {
            headers,
          }),
        ]);

      const resumes = resumeResponse.data || [];

      setResume(resumes.length > 0 ? resumes[0] : null);
      setNotifications(notificationResponse.data || []);

      if (resumes.length > 0) {
        await loadRecommendations(resumes[0].id);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load your candidate dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async (resumeId) => {
    try {
      setRecommendationsLoading(true);
      setRecommendationsError("");

      const response = await API.get(
        `/jobs/recommended/${resumeId}`,
        {
          headers: getAuthHeaders(),
        }
      );

      setRecommendations(response.data || []);
    } catch (err) {
      console.error(err);

      setRecommendationsError(
        err.response?.data?.detail ||
          "Unable to load job recommendations."
      );
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await API.patch(
        `/notifications/${notificationId}/read`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await API.patch(
        "/notifications/read-all",
        {},
        {
          headers: getAuthHeaders(),
        }
      );

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Recommendation styling
  const getRecommendationClass = (recommendation) => {
    if (recommendation === "Good Match") {
      return "recommendation-good";
    }

    if (recommendation === "Partial Match") {
      return "recommendation-partial";
    }

    return "recommendation-low";
  };

  const getMatchScoreClass = (score) => {
    if (score >= 70) {
      return "recommended-score-high";
    }

    if (score >= 40) {
      return "recommended-score-medium";
    }

    return "recommended-score-low";
  };

  const getMatchQualityText = (score) => {
    if (score >= 80) {
      return "Strong alignment with your current resume skills.";
    }

    if (score >= 70) {
      return "Good alignment with the skills required for this role.";
    }

    if (score >= 40) {
      return "Some important skills match, but there are areas to improve.";
    }

    return "Several required skills are missing from your current resume.";
  };

  // Analyze recommendation in detail
  const analyzeRecommendation = async (job) => {
    if (!resume) {
      return;
    }

    try {
      setSelectedJob(job);
      setMatchResult(null);
      setMatchError("");
      setMatchLoading(true);

      const response = await API.get(
        `/jobs/${job.job_id}/match/${resume.id}`,
        {
          headers: getAuthHeaders(),
        }
      );

      setMatchResult(response.data);
    } catch (err) {
      console.error(err);

      setMatchError(
        err.response?.data?.detail ||
          "Unable to analyze this job match."
      );
    } finally {
      setMatchLoading(false);
    }
  };

  const closeMatchAnalysis = () => {
    setSelectedJob(null);
    setMatchResult(null);
    setMatchError("");
    setMatchLoading(false);
  };

  const getAnalysisScoreClass = (score) => {
    if (score >= 70) {
      return "match-score-high";
    }

    if (score >= 40) {
      return "match-score-medium";
    }

    return "match-score-low";
  };

  const getAnalysisRecommendationClass = (recommendation) => {
    if (recommendation === "Good Match") {
      return "recommendation-good";
    }

    if (recommendation === "Partial Match") {
      return "recommendation-partial";
    }

    return "recommendation-low";
  };

  if (loading) {
    return (
      <div className="candidate-page">
        <div className="loading-message">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candidate-page">
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  const unreadNotifications = notifications.filter(
    (notification) => !notification.is_read
  );

  return (
    <div className="candidate-page">
      <div className="candidate-header">
        <div>
          <span className="dashboard-label">
            INTELLIHIRE AI
          </span>

          <h1>Candidate Dashboard</h1>

          <p>
            Track your recruitment progress and discover
            opportunities matched to your profile.
          </p>
        </div>
      </div>

      <div className="candidate-dashboard-grid">
        <div className="candidate-main-content">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <span className="card-label">
                  RESUME STATUS
                </span>

                <h2>
                  {resume
                    ? "Resume Available"
                    : "No Resume Uploaded"}
                </h2>
              </div>
            </div>

            {resume ? (
              <div className="resume-status-content">
                <div>
                  <strong>
                    {resume.filename}
                  </strong>

                  <p>
                    Your resume is ready for job matching.
                  </p>
                </div>

                <span className="status-badge success">
                  Ready
                </span>
              </div>
            ) : (
              <div className="resume-status-content">
                <div>
                  <strong>
                    Upload your resume
                  </strong>

                  <p>
                    Upload a resume to unlock AI job
                    recommendations and matching.
                  </p>
                </div>

                <span className="status-badge warning">
                  Action Needed
                </span>
              </div>
            )}
          </div>

          {/* AI RECOMMENDATIONS */}
          <div className="dashboard-card recommendations-card">
            <div className="dashboard-card-header">
              <div>
                <span className="card-label">
                  AI RECOMMENDATIONS
                </span>

                <h2>
                  Recommended Jobs
                </h2>

                <p>
                  Jobs ranked according to your resume
                  skills and compatibility.
                </p>
              </div>
            </div>

            {!resume && (
              <div className="recommendations-empty">
                <h3>
                  Upload a resume first
                </h3>

                <p>
                  IntelliHire AI needs your resume to
                  calculate personalized job matches.
                </p>
              </div>
            )}

            {resume && recommendationsLoading && (
              <div className="loading-message">
                Analyzing available jobs...
              </div>
            )}

            {resume &&
              !recommendationsLoading &&
              recommendationsError && (
                <div className="error-message">
                  {recommendationsError}
                </div>
              )}

            {resume &&
              !recommendationsLoading &&
              !recommendationsError &&
              recommendations.length === 0 && (
                <div className="recommendations-empty">
                  <h3>
                    No recommendations available
                  </h3>

                  <p>
                    There are currently no job openings
                    available for matching.
                  </p>
                </div>
              )}

            {resume &&
              !recommendationsLoading &&
              !recommendationsError &&
              recommendations.length > 0 && (
                <div className="recommendations-list">
                  {recommendations
                    .slice(0, 5)
                    .map((job, index) => (
                      <div
                        className="recommendation-card"
                        key={job.job_id}
                      >
                        {/* Card Header */}
                        <div className="recommendation-main">
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "6px",
                              }}
                            >
                              <span className="job-id">
                                JOB #{job.job_id}
                              </span>

                              {index === 0 && (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    padding: "4px 8px",
                                    borderRadius: "999px",
                                    background:
                                      "#eef2ff",
                                    color:
                                      "#4338ca",
                                  }}
                                >
                                  TOP MATCH
                                </span>
                              )}
                            </div>

                            <h3>
                              {job.job_title}
                            </h3>

                            <p className="recommendation-company">
                              {job.company}
                            </p>

                            <p className="recommendation-location">
                              📍 {job.location}
                            </p>
                          </div>

                          {/* Match Score */}
                          <div className="recommendation-score">
                            <div
                              className={`recommended-score ${getMatchScoreClass(
                                job.match_score
                              )}`}
                            >
                              {job.match_score}%
                            </div>

                            <span>
                              Match
                            </span>
                          </div>
                        </div>

                        {/* Match Progress */}
                        <div
                          style={{
                            marginTop: "14px",
                            marginBottom: "16px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              fontSize: "12px",
                              marginBottom: "6px",
                            }}
                          >
                            <span>
                              Resume compatibility
                            </span>

                            <strong>
                              {job.match_score}%
                            </strong>
                          </div>

                          <div
                            style={{
                              height: "7px",
                              width: "100%",
                              background:
                                "#e5e7eb",
                              borderRadius: "999px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.min(
                                  Math.max(
                                    job.match_score,
                                    0
                                  ),
                                  100
                                )}%`,
                                background:
                                  job.match_score >= 70
                                    ? "#16a34a"
                                    : job.match_score >=
                                      40
                                    ? "#d97706"
                                    : "#dc2626",
                                borderRadius:
                                  "999px",
                                transition:
                                  "width 0.3s ease",
                              }}
                            />
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="recommendation-details">
                          <div>
                            <span className="recommendation-label">
                              Matched Skills
                            </span>

                            {job.matched_skills?.length >
                            0 ? (
                              <div className="recommendation-skills">
                                {job.matched_skills
                                  .slice(0, 6)
                                  .map((skill) => (
                                    <span
                                      className="recommendation-skill matched"
                                      key={skill}
                                    >
                                      ✓ {skill}
                                    </span>
                                  ))}
                              </div>
                            ) : (
                              <p className="recommendation-muted">
                                No matching skills identified.
                              </p>
                            )}
                          </div>

                          {job.missing_skills?.length >
                            0 && (
                            <div>
                              <span className="recommendation-label">
                                Skills to Improve
                              </span>

                              <div className="recommendation-skills">
                                {job.missing_skills
                                  .slice(0, 4)
                                  .map((skill) => (
                                    <span
                                      className="recommendation-skill missing"
                                      key={skill}
                                    >
                                      + {skill}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Recommendation Summary */}
                        <div
                          style={{
                            marginTop: "16px",
                            padding: "12px 14px",
                            borderRadius: "10px",
                            background:
                              "rgba(0, 0, 0, 0.025)",
                          }}
                        >
                          <span
                            className="recommendation-label"
                          >
                            MATCH INSIGHT
                          </span>

                          <p
                            style={{
                              margin:
                                "6px 0 0",
                              fontSize: "13px",
                              lineHeight: "1.5",
                            }}
                          >
                            {getMatchQualityText(
                              job.match_score
                            )}
                          </p>
                        </div>

                        {/* Footer */}
                        <div className="recommendation-footer">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              className={`recommendation-badge ${getRecommendationClass(
                                job.recommendation
                              )}`}
                            >
                              {job.recommendation}
                            </span>

                            <span className="recommendation-note">
                              Based on your resume
                            </span>
                          </div>

                          <button
                            type="button"
                            className="analysis-button"
                            onClick={() =>
                              analyzeRecommendation(job)
                            }
                          >
                            Analyze Match
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="candidate-sidebar">
          <div className="dashboard-card notifications-card">
            <div className="dashboard-card-header">
              <div>
                <span className="card-label">
                  NOTIFICATIONS
                </span>

                <h2>
                  Updates
                </h2>
              </div>

              {unreadNotifications.length > 0 && (
                <button
                  className="text-button"
                  onClick={markAllNotificationsAsRead}
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="notifications-empty">
                <p>
                  No notifications yet.
                </p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications
                  .slice(0, 6)
                  .map((notification) => (
                    <div
                      className={`notification-item ${
                        notification.is_read
                          ? "read"
                          : "unread"
                      }`}
                      key={notification.id}
                      onClick={() =>
                        !notification.is_read &&
                        markNotificationAsRead(
                          notification.id
                        )
                      }
                    >
                      <div className="notification-indicator" />

                      <div>
                        <strong>
                          {notification.title}
                        </strong>

                        <p>
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* PROFILE PROGRESS */}
          <div className="dashboard-card candidate-progress-card">
            <div className="dashboard-card-header">
              <div>
                <span className="card-label">
                  PROFILE PROGRESS
                </span>

                <h2>
                  Recruitment Readiness
                </h2>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-item-header">
                <span>
                  Resume
                </span>

                <strong>
                  {resume ? "Complete" : "Pending"}
                </strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: resume
                      ? "100%"
                      : "20%",
                  }}
                />
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-item-header">
                <span>
                  Job Matching
                </span>

                <strong>
                  {resume &&
                  recommendations.length > 0
                    ? "Ready"
                    : "Pending"}
                </strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width:
                      resume &&
                      recommendations.length > 0
                        ? "100%"
                        : resume
                        ? "60%"
                        : "20%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MATCH ANALYSIS MODAL */}
      {selectedJob && (
        <div className="match-modal-overlay">
          <div className="match-modal">
            <div className="match-modal-header">
              <div>
                <span className="dashboard-label">
                  AI JOB MATCH ANALYSIS
                </span>

                <h2>
                  {selectedJob.job_title}
                </h2>

                <p>
                  {selectedJob.company} •{" "}
                  {selectedJob.location}
                </p>
              </div>

              <button
                className="modal-close-button"
                onClick={closeMatchAnalysis}
              >
                ×
              </button>
            </div>

            {matchLoading && (
              <div className="match-loading">
                <div className="loading-message">
                  Analyzing your resume against this
                  recommended job...
                </div>
              </div>
            )}

            {!matchLoading && matchError && (
              <div className="match-error">
                {matchError}
              </div>
            )}

            {!matchLoading && matchResult && (
              <div className="match-analysis-content">
                <div className="match-score-section">
                  <div
                    className={`match-score-circle ${getAnalysisScoreClass(
                      matchResult.match_score
                    )}`}
                  >
                    <strong>
                      {matchResult.match_score}%
                    </strong>

                    <span>
                      Match
                    </span>
                  </div>

                  <div className="match-score-summary">
                    <span className="analysis-label">
                      Recommendation
                    </span>

                    <div
                      className={`recommendation-badge ${getAnalysisRecommendationClass(
                        matchResult.recommendation
                      )}`}
                    >
                      {matchResult.recommendation}
                    </div>

                    <p>
                      Your resume currently matches{" "}
                      {matchResult.skill_coverage}% of
                      the required skills for this role.
                    </p>
                  </div>
                </div>

                <div className="match-stat-grid">
                  <div className="match-stat-card">
                    <span>
                      Required Skills
                    </span>

                    <strong>
                      {matchResult.total_required_skills}
                    </strong>
                  </div>

                  <div className="match-stat-card">
                    <span>
                      Exact Matches
                    </span>

                    <strong>
                      {matchResult.exact_match_count}
                    </strong>
                  </div>

                  <div className="match-stat-card">
                    <span>
                      Related Matches
                    </span>

                    <strong>
                      {matchResult.related_match_count}
                    </strong>
                  </div>

                  <div className="match-stat-card">
                    <span>
                      Missing Skills
                    </span>

                    <strong>
                      {matchResult.missing_match_count}
                    </strong>
                  </div>
                </div>

                <div className="match-section">
                  <div className="match-section-header">
                    <h3>
                      Skills You Match
                    </h3>

                    <span>
                      {matchResult.exact_match_count} exact
                    </span>
                  </div>

                  {matchResult.exact_matches?.length >
                  0 ? (
                    <div className="skill-tag-list">
                      {matchResult.exact_matches.map(
                        (skill) => (
                          <span
                            className="skill-tag matched"
                            key={skill}
                          >
                            ✓ {skill}
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="no-skills-message">
                      No exact skill matches found.
                    </p>
                  )}
                </div>

                <div className="match-section">
                  <div className="match-section-header">
                    <h3>
                      Related Skills
                    </h3>

                    <span>
                      {matchResult.related_match_count}{" "}
                      related
                    </span>
                  </div>

                  {matchResult.related_matches?.length >
                  0 ? (
                    <div className="skill-tag-list">
                      {matchResult.related_matches.map(
                        (skill) => (
                          <span
                            className="skill-tag related"
                            key={skill}
                          >
                            ◐ {skill}
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="no-skills-message">
                      No related skill matches found.
                    </p>
                  )}
                </div>

                <div className="match-section">
                  <div className="match-section-header">
                    <h3>
                      Skills to Improve
                    </h3>

                    <span>
                      {matchResult.missing_match_count}{" "}
                      missing
                    </span>
                  </div>

                  {matchResult.missing_skills?.length >
                  0 ? (
                    <div className="skill-tag-list">
                      {matchResult.missing_skills.map(
                        (skill) => (
                          <span
                            className="skill-tag missing"
                            key={skill}
                          >
                            + {skill}
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="no-skills-message">
                      No required skills are currently
                      missing.
                    </p>
                  )}
                </div>

                <div className="match-coverage-section">
                  <div className="match-section-header">
                    <h3>
                      Skill Coverage
                    </h3>

                    <strong>
                      {matchResult.skill_coverage}%
                    </strong>
                  </div>

                  <div className="coverage-bar">
                    <div
                      className="coverage-bar-fill"
                      style={{
                        width: `${matchResult.skill_coverage}%`,
                      }}
                    />
                  </div>

                  <p>
                    Based on the skills identified in your
                    resume compared with this job's
                    requirements.
                  </p>
                </div>

                <div className="match-analysis-footer">
                  <span>
                    Resume analyzed:{" "}
                    {matchResult.resume_filename}
                  </span>

                  <span>
                    Resume ID: {resume?.id}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidateDashboard;