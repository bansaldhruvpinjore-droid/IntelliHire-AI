import { useEffect, useState } from "react";
import API from "./api";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // JOB MATCH ANALYSIS STATE
  // ============================================================

  const [selectedJob, setSelectedJob] = useState(null);

  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");

  const [resumeId, setResumeId] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState("");

  // ============================================================
  // APPLICATION STATE
  // ============================================================

  const [applicationJob, setApplicationJob] = useState(null);

  const [applicationResumes, setApplicationResumes] = useState([]);
  const [applicationResumeId, setApplicationResumeId] =
    useState("");

  const [applicationStep, setApplicationStep] =
    useState("selection");

  const [applicationLoading, setApplicationLoading] =
    useState(false);

  const [applicationError, setApplicationError] =
    useState("");

  const [applicationSuccess, setApplicationSuccess] =
    useState(false);

  // ============================================================
  // AUTH HEADERS
  // ============================================================

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  });

  // ============================================================
  // LOAD JOBS
  // ============================================================

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/jobs/");
      setJobs(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load available jobs."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // JOB MATCH ANALYSIS
  // ============================================================

  const analyzeJobMatch = async (job) => {
    try {
      setSelectedJob(job);

      setResumes([]);
      setSelectedResumeId("");
      setResumeId("");

      setResumeError("");
      setMatchResult(null);
      setMatchError("");

      setResumeLoading(true);

      const response = await API.get("/resumes/", {
        headers: getAuthHeaders(),
      });

      const uploadedResumes = response.data || [];

      if (uploadedResumes.length === 0) {
        setResumeError(
          "Please upload a resume first before analyzing your job match."
        );
        return;
      }

      setResumes(uploadedResumes);
    } catch (err) {
      console.error(err);

      setResumeError(
        err.response?.data?.detail ||
          "Unable to load your uploaded resumes."
      );
    } finally {
      setResumeLoading(false);
    }
  };

  const analyzeSelectedResume = async () => {
    if (!selectedJob || !selectedResumeId) {
      setMatchError(
        "Please select a resume before continuing."
      );
      return;
    }

    try {
      setMatchError("");
      setMatchResult(null);
      setResumeId(selectedResumeId);
      setMatchLoading(true);

      const response = await API.get(
        `/jobs/${selectedJob.id}/match/${selectedResumeId}`,
        {
          headers: getAuthHeaders(),
        }
      );

      setMatchResult(response.data);
    } catch (err) {
      console.error(err);

      setMatchError(
        err.response?.data?.detail ||
          "Unable to analyze your match for this job."
      );
    } finally {
      setMatchLoading(false);
    }
  };

  const backToResumeSelection = () => {
    setMatchResult(null);
    setMatchError("");
    setResumeId("");
  };

  const closeMatchAnalysis = () => {
    setSelectedJob(null);
    setResumes([]);
    setSelectedResumeId("");
    setResumeId("");
    setMatchResult(null);
    setResumeError("");
    setMatchError("");
    setResumeLoading(false);
    setMatchLoading(false);
  };

  // ============================================================
  // APPLICATION FLOW
  // ============================================================

  const openApplicationFlow = async (job) => {
    try {
      setApplicationJob(job);

      setApplicationResumes([]);
      setApplicationResumeId("");

      setApplicationStep("selection");
      setApplicationError("");
      setApplicationSuccess(false);

      setApplicationLoading(true);

      const response = await API.get("/resumes/", {
        headers: getAuthHeaders(),
      });

      const uploadedResumes = response.data || [];

      if (uploadedResumes.length === 0) {
        setApplicationError(
          "Please upload a resume first before applying for this job."
        );
        return;
      }

      setApplicationResumes(uploadedResumes);
    } catch (err) {
      console.error(err);

      setApplicationError(
        err.response?.data?.detail ||
          "Unable to load your uploaded resumes."
      );
    } finally {
      setApplicationLoading(false);
    }
  };

  const continueToApplicationConfirmation = () => {
    if (!applicationResumeId) {
      setApplicationError(
        "Please select a resume before continuing."
      );
      return;
    }

    setApplicationError("");
    setApplicationStep("confirmation");
  };

  const submitApplication = async () => {
    if (!applicationJob || !applicationResumeId) {
      setApplicationError(
        "Please select a resume before submitting your application."
      );
      return;
    }

    try {
      setApplicationLoading(true);
      setApplicationError("");

      const response = await API.post(
        "/applications/",
        {
          job_id: applicationJob.id,
          resume_id: Number(applicationResumeId),
        },
        {
          headers: getAuthHeaders(),
        }
      );

      console.log(
        "Application submitted successfully:",
        response.data
      );

      setApplicationSuccess(true);
      setApplicationStep("success");
    } catch (err) {
      console.error(err);

      const statusCode = err.response?.status;
      const detail = err.response?.data?.detail;

      if (statusCode === 409) {
        setApplicationError(
          detail ||
            "You have already applied for this job."
        );
      } else {
        setApplicationError(
          detail ||
            "Unable to submit your application. Please try again."
        );
      }
    } finally {
      setApplicationLoading(false);
    }
  };

  const closeApplicationFlow = () => {
    setApplicationJob(null);
    setApplicationResumes([]);
    setApplicationResumeId("");
    setApplicationStep("selection");
    setApplicationLoading(false);
    setApplicationError("");
    setApplicationSuccess(false);
  };

  const getSelectedApplicationResume = () => {
    return applicationResumes.find(
      (resume) =>
        String(resume.id) ===
        String(applicationResumeId)
    );
  };

  // ============================================================
  // MATCH UI HELPERS
  // ============================================================

  const getScoreClass = (score) => {
    if (score >= 70) {
      return "match-score-high";
    }

    if (score >= 40) {
      return "match-score-medium";
    }

    return "match-score-low";
  };

  const getRecommendationClass = (recommendation) => {
    if (recommendation === "Good Match") {
      return "recommendation-good";
    }

    if (recommendation === "Partial Match") {
      return "recommendation-partial";
    }

    return "recommendation-low";
  };

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {
    return (
      <div className="jobs-page">
        <div className="loading-message">
          Loading available jobs...
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================

  if (error) {
    return (
      <div className="jobs-page">
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <div>
          <span className="dashboard-label">
            INTELLIHIRE AI
          </span>

          <h1>Find Your Next Opportunity</h1>

          <p>
            Explore available jobs and analyze how well
            your resume matches each opportunity.
          </p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <h3>No jobs available</h3>

          <p>
            There are currently no published job openings.
          </p>
        </div>
      ) : (
        <div className="jobs-grid">
          {jobs.map((job) => (
            <div
              className="job-card"
              key={job.id}
            >
              <div className="job-card-header">
                <div>
                  <span className="job-id">
                    JOB #{job.id}
                  </span>

                  <h2>{job.title}</h2>

                  <p className="job-company">
                    {job.company}
                  </p>
                </div>
              </div>

              <div className="job-meta">
                <span>📍 {job.location}</span>

                {job.experience && (
                  <span>
                    💼 {job.experience}
                  </span>
                )}

                {job.salary && (
                  <span>
                    💰 {job.salary}
                  </span>
                )}
              </div>

              <div className="job-description">
                <p>{job.description}</p>
              </div>

              {job.required_skills && (
                <div className="job-skills">
                  <strong>Required Skills</strong>

                  <p>
                    {job.required_skills}
                  </p>
                </div>
              )}

              <div
                className="job-actions"
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="analysis-button"
                  onClick={() =>
                    analyzeJobMatch(job)
                  }
                >
                  Analyze My Match
                </button>

                <button
                  className="analysis-button"
                  onClick={() =>
                    openApplicationFlow(job)
                  }
                  style={{
                    background:
                      "linear-gradient(135deg, #111827, #374151)",
                    color: "#ffffff",
                  }}
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          JOB MATCH ANALYSIS MODAL
          ======================================================== */}

      {selectedJob && (
        <div className="match-modal-overlay">
          <div className="match-modal">
            <div className="match-modal-header">
              <div>
                <span className="dashboard-label">
                  AI JOB MATCH ANALYSIS
                </span>

                <h2>
                  {selectedJob.title}
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

            {/* STEP 1: Resume Selection */}

            {!matchResult && !matchLoading && (
              <div className="match-analysis-content">
                <div
                  style={{
                    padding: "10px 0 20px",
                  }}
                >
                  <h3
                    style={{
                      marginBottom: "8px",
                    }}
                  >
                    Select a Resume
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      opacity: 0.75,
                    }}
                  >
                    Choose which uploaded resume you want
                    IntelliHire AI to analyze for this job.
                  </p>
                </div>

                {resumeLoading && (
                  <div className="match-loading">
                    <div className="loading-message">
                      Loading your uploaded resumes...
                    </div>
                  </div>
                )}

                {!resumeLoading && resumeError && (
                  <div className="match-error">
                    <p
                      style={{
                        marginBottom: "16px",
                      }}
                    >
                      {resumeError}
                    </p>

                    <button
                      className="analysis-button"
                      onClick={() =>
                        analyzeJobMatch(selectedJob)
                      }
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {!resumeLoading &&
                  !resumeError &&
                  resumes.length > 0 && (
                    <>
                      <div
                        style={{
                          display: "grid",
                          gap: "12px",
                          marginTop: "10px",
                        }}
                      >
                        {resumes.map((resume) => {
                          const isSelected =
                            String(selectedResumeId) ===
                            String(resume.id);

                          return (
                            <button
                              key={resume.id}
                              type="button"
                              onClick={() =>
                                setSelectedResumeId(
                                  String(resume.id)
                                )
                              }
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "16px",
                                borderRadius: "12px",
                                border: isSelected
                                  ? "2px solid #2563eb"
                                  : "1px solid #d1d5db",
                                background: isSelected
                                  ? "#eff6ff"
                                  : "#ffffff",
                                cursor: "pointer",
                                transition:
                                  "all 0.2s ease",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent:
                                    "space-between",
                                  alignItems: "center",
                                  gap: "12px",
                                }}
                              >
                                <div>
                                  <strong
                                    style={{
                                      display: "block",
                                      marginBottom: "5px",
                                    }}
                                  >
                                    {resume.filename ||
                                      `Resume #${resume.id}`}
                                  </strong>

                                  <span
                                    style={{
                                      fontSize: "13px",
                                      opacity: 0.7,
                                    }}
                                  >
                                    Resume ID: {resume.id}
                                  </span>
                                </div>

                                <span
                                  style={{
                                    minWidth: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "center",
                                    border: isSelected
                                      ? "2px solid #2563eb"
                                      : "2px solid #9ca3af",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                  }}
                                >
                                  {isSelected ? "✓" : ""}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginTop: "24px",
                        }}
                      >
                        <button
                          className="analysis-button"
                          disabled={!selectedResumeId}
                          onClick={
                            analyzeSelectedResume
                          }
                          style={{
                            opacity: selectedResumeId
                              ? 1
                              : 0.5,
                            cursor: selectedResumeId
                              ? "pointer"
                              : "not-allowed",
                          }}
                        >
                          Analyze Selected Resume
                        </button>
                      </div>
                    </>
                  )}
              </div>
            )}

            {/* STEP 2: Match Analysis Loading */}

            {matchLoading && (
              <div className="match-loading">
                <div className="loading-message">
                  Analyzing your selected resume against
                  this job...
                </div>
              </div>
            )}

            {/* Match Error */}

            {!matchLoading && matchError && (
              <div className="match-error">
                <p
                  style={{
                    marginBottom: "16px",
                  }}
                >
                  {matchError}
                </p>

                <button
                  className="analysis-button"
                  onClick={backToResumeSelection}
                >
                  Back to Resume Selection
                </button>
              </div>
            )}

            {/* STEP 3: Detailed Match Analysis */}

            {!matchLoading && matchResult && (
              <div className="match-analysis-content">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    marginBottom: "18px",
                  }}
                >
                  <button
                    type="button"
                    onClick={backToResumeSelection}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: "600",
                    }}
                  >
                    ← Choose Another Resume
                  </button>
                </div>

                <div className="match-score-section">
                  <div
                    className={`match-score-circle ${getScoreClass(
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
                      className={`recommendation-badge ${getRecommendationClass(
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

                  {matchResult.exact_matches?.length > 0 ? (
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
                      {matchResult.related_match_count} related
                    </span>
                  </div>

                  {matchResult.related_matches?.length > 0 ? (
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
                      {matchResult.missing_match_count} missing
                    </span>
                  </div>

                  {matchResult.missing_skills?.length > 0 ? (
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
                    Resume ID: {resumeId}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          JOB APPLICATION MODAL
          ======================================================== */}

      {applicationJob && (
        <div className="match-modal-overlay">
          <div
            className="match-modal"
            style={{
              maxWidth: "700px",
            }}
          >
            <div className="match-modal-header">
              <div>
                <span className="dashboard-label">
                  JOB APPLICATION
                </span>

                <h2>
                  {applicationJob.title}
                </h2>

                <p>
                  {applicationJob.company} •{" "}
                  {applicationJob.location}
                </p>
              </div>

              {!applicationSuccess && (
                <button
                  className="modal-close-button"
                  onClick={closeApplicationFlow}
                >
                  ×
                </button>
              )}
            </div>

            {/* APPLICATION STEP 1: RESUME SELECTION */}

            {applicationStep === "selection" && (
              <div className="match-analysis-content">
                <div
                  style={{
                    padding: "10px 0 20px",
                  }}
                >
                  <h3
                    style={{
                      marginBottom: "8px",
                    }}
                  >
                    Choose Your Resume
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      opacity: 0.75,
                    }}
                  >
                    Select the resume you want to submit
                    for this job application.
                  </p>
                </div>

                {applicationLoading && (
                  <div className="match-loading">
                    <div className="loading-message">
                      Loading your uploaded resumes...
                    </div>
                  </div>
                )}

                {!applicationLoading &&
                  applicationError && (
                    <div className="match-error">
                      <p
                        style={{
                          marginBottom: "16px",
                        }}
                      >
                        {applicationError}
                      </p>

                      <button
                        className="analysis-button"
                        onClick={() =>
                          openApplicationFlow(
                            applicationJob
                          )
                        }
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                {!applicationLoading &&
                  !applicationError &&
                  applicationResumes.length > 0 && (
                    <>
                      <div
                        style={{
                          display: "grid",
                          gap: "12px",
                          marginTop: "10px",
                        }}
                      >
                        {applicationResumes.map(
                          (resume) => {
                            const isSelected =
                              String(
                                applicationResumeId
                              ) ===
                              String(resume.id);

                            return (
                              <button
                                key={resume.id}
                                type="button"
                                onClick={() =>
                                  setApplicationResumeId(
                                    String(resume.id)
                                  )
                                }
                                style={{
                                  width: "100%",
                                  textAlign: "left",
                                  padding: "16px",
                                  borderRadius: "12px",
                                  border: isSelected
                                    ? "2px solid #111827"
                                    : "1px solid #d1d5db",
                                  background:
                                    isSelected
                                      ? "#f3f4f6"
                                      : "#ffffff",
                                  cursor: "pointer",
                                  transition:
                                    "all 0.2s ease",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent:
                                      "space-between",
                                    alignItems:
                                      "center",
                                    gap: "12px",
                                  }}
                                >
                                  <div>
                                    <strong
                                      style={{
                                        display:
                                          "block",
                                        marginBottom:
                                          "5px",
                                      }}
                                    >
                                      {resume.filename ||
                                        `Resume #${resume.id}`}
                                    </strong>

                                    <span
                                      style={{
                                        fontSize:
                                          "13px",
                                        opacity: 0.7,
                                      }}
                                    >
                                      Resume ID:{" "}
                                      {resume.id}
                                    </span>
                                  </div>

                                  <span
                                    style={{
                                      minWidth: "24px",
                                      height: "24px",
                                      borderRadius:
                                        "50%",
                                      display: "flex",
                                      alignItems:
                                        "center",
                                      justifyContent:
                                        "center",
                                      border:
                                        isSelected
                                          ? "2px solid #111827"
                                          : "2px solid #9ca3af",
                                      fontSize:
                                        "13px",
                                      fontWeight: "700",
                                    }}
                                  >
                                    {isSelected
                                      ? "✓"
                                      : ""}
                                  </span>
                                </div>
                              </button>
                            );
                          }
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "flex-end",
                          marginTop: "24px",
                        }}
                      >
                        <button
                          className="analysis-button"
                          disabled={
                            !applicationResumeId
                          }
                          onClick={
                            continueToApplicationConfirmation
                          }
                          style={{
                            opacity:
                              applicationResumeId
                                ? 1
                                : 0.5,
                            cursor:
                              applicationResumeId
                                ? "pointer"
                                : "not-allowed",
                          }}
                        >
                          Continue
                        </button>
                      </div>
                    </>
                  )}
              </div>
            )}

            {/* APPLICATION STEP 2: CONFIRMATION */}

            {applicationStep === "confirmation" && (
              <div className="match-analysis-content">
                <div
                  style={{
                    textAlign: "center",
                    padding: "10px 0 24px",
                  }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      margin: "0 auto 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#f3f4f6",
                      fontSize: "28px",
                    }}
                  >
                    📄
                  </div>

                  <h3
                    style={{
                      marginBottom: "8px",
                    }}
                  >
                    Review Your Application
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      opacity: 0.75,
                    }}
                  >
                    Please confirm the details before
                    submitting your application.
                  </p>
                </div>

                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "14px",
                    padding: "18px",
                    display: "grid",
                    gap: "14px",
                    background: "#fafafa",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "700",
                        opacity: 0.6,
                        marginBottom: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      Position
                    </span>

                    <strong>
                      {applicationJob.title}
                    </strong>
                  </div>

                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "700",
                        opacity: 0.6,
                        marginBottom: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      Company
                    </span>

                    <strong>
                      {applicationJob.company}
                    </strong>
                  </div>

                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "700",
                        opacity: 0.6,
                        marginBottom: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      Resume
                    </span>

                    <strong>
                      {getSelectedApplicationResume()
                        ?.filename ||
                        `Resume #${applicationResumeId}`}
                    </strong>

                    <span
                      style={{
                        display: "block",
                        fontSize: "13px",
                        opacity: 0.65,
                        marginTop: "3px",
                      }}
                    >
                      Resume ID:{" "}
                      {applicationResumeId}
                    </span>
                  </div>
                </div>

                {applicationError && (
                  <div
                    className="match-error"
                    style={{
                      marginTop: "18px",
                    }}
                  >
                    {applicationError}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginTop: "24px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setApplicationError("");
                      setApplicationStep(
                        "selection"
                      );
                    }}
                    style={{
                      border: "1px solid #d1d5db",
                      background: "#ffffff",
                      borderRadius: "10px",
                      padding: "11px 18px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    ← Change Resume
                  </button>

                  <button
                    type="button"
                    className="analysis-button"
                    onClick={submitApplication}
                    disabled={applicationLoading}
                    style={{
                      opacity: applicationLoading
                        ? 0.6
                        : 1,
                      cursor: applicationLoading
                        ? "not-allowed"
                        : "pointer",
                      background:
                        "linear-gradient(135deg, #111827, #374151)",
                      color: "#ffffff",
                    }}
                  >
                    {applicationLoading
                      ? "Submitting..."
                      : "Submit Application"}
                  </button>
                </div>
              </div>
            )}

            {/* APPLICATION STEP 3: SUCCESS */}

            {applicationStep === "success" && (
              <div className="match-analysis-content">
                <div
                  style={{
                    textAlign: "center",
                    padding: "25px 10px 10px",
                  }}
                >
                  <div
                    style={{
                      width: "76px",
                      height: "76px",
                      borderRadius: "50%",
                      margin: "0 auto 18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#ecfdf5",
                      border: "2px solid #10b981",
                      color: "#047857",
                      fontSize: "34px",
                      fontWeight: "700",
                    }}
                  >
                    ✓
                  </div>

                  <h2
                    style={{
                      marginBottom: "10px",
                    }}
                  >
                    Application Submitted!
                  </h2>

                  <p
                    style={{
                      opacity: 0.75,
                      maxWidth: "500px",
                      margin: "0 auto",
                      lineHeight: "1.6",
                    }}
                  >
                    Your application has been successfully
                    submitted for this position.
                  </p>
                </div>

                <div
                  style={{
                    marginTop: "24px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "14px",
                    padding: "18px",
                    background: "#fafafa",
                    display: "grid",
                    gap: "14px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "700",
                        opacity: 0.6,
                        marginBottom: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      Applied For
                    </span>

                    <strong>
                      {applicationJob.title}
                    </strong>
                  </div>

                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "700",
                        opacity: 0.6,
                        marginBottom: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      Company
                    </span>

                    <strong>
                      {applicationJob.company}
                    </strong>
                  </div>

                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "700",
                        opacity: 0.6,
                        marginBottom: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      Resume Submitted
                    </span>

                    <strong>
                      {getSelectedApplicationResume()
                        ?.filename ||
                        `Resume #${applicationResumeId}`}
                    </strong>

                    <span
                      style={{
                        display: "block",
                        fontSize: "13px",
                        opacity: 0.65,
                        marginTop: "3px",
                      }}
                    >
                      Resume ID:{" "}
                      {applicationResumeId}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "28px",
                  }}
                >
                  <button
                    type="button"
                    className="analysis-button"
                    onClick={closeApplicationFlow}
                    style={{
                      background:
                        "linear-gradient(135deg, #111827, #374151)",
                      color: "#ffffff",
                      minWidth: "180px",
                    }}
                  >
                    Continue Exploring Jobs
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Jobs;