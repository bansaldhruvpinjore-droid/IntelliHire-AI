import { useEffect, useState } from "react";
import API from "./api";

function RecruiterApplications({ initialJobId }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [applications, setApplications] = useState([]);

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [updatingApplication, setUpdatingApplication] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  });

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (initialJobId && jobs.length > 0) {
      const job = jobs.find(
        (item) => String(item.id) === String(initialJobId)
      );

      if (job) {
        setSelectedJob(String(job.id));
        loadApplications(job.id);
      }
    }
  }, [initialJobId, jobs]);

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      setError("");

      const response = await API.get("/jobs/mine", {
        headers: getAuthHeaders(),
      });

      setJobs(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load your jobs."
      );
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadApplications = async (jobId) => {
    if (!jobId) {
      setApplications([]);
      return;
    }

    try {
      setLoadingApplications(true);
      setError("");
      setMessage("");

      const response = await API.get(
        `/applications/job/${jobId}/ranked`,
        {
          headers: getAuthHeaders(),
        }
      );

      setApplications(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load applicants."
      );

      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleJobChange = (event) => {
    const jobId = event.target.value;

    setSelectedJob(jobId);
    loadApplications(jobId);
  };

  const updateStatus = async (
    applicationId,
    newStatus
  ) => {
    try {
      setUpdatingApplication(applicationId);
      setError("");
      setMessage("");

      await API.patch(
        `/applications/${applicationId}/status`,
        {
          status: newStatus,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.application_id === applicationId
            ? {
                ...application,
                status: newStatus,
              }
            : application
        )
      );

      setMessage(
        `Application #${applicationId} updated to ${newStatus}.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to update application status."
      );
    } finally {
      setUpdatingApplication(null);
    }
  };

  const getScoreClass = (score) => {
    if (score >= 80) {
      return "score-strong";
    }

    if (score >= 60) {
      return "score-good";
    }

    if (score >= 40) {
      return "score-partial";
    }

    return "score-low";
  };

  const getRecommendationClass = (recommendation) => {
    if (recommendation === "Strong Match") {
      return "recommendation-strong";
    }

    if (recommendation === "Good Match") {
      return "recommendation-good";
    }

    if (recommendation === "Partial Match") {
      return "recommendation-partial";
    }

    return "recommendation-low";
  };

  const selectedJobData = jobs.find(
    (job) => String(job.id) === String(selectedJob)
  );

  if (loadingJobs) {
    return (
      <div className="recruiter-page">
        <div className="loading-card">
          <h2>Loading recruiter applications...</h2>
          <p>Fetching your job openings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recruiter-page">

      {/* Header */}

      <div className="recruiter-header">
        <div>
          <span className="dashboard-label">
            INTELLIHIRE AI
          </span>

          <h1>Candidate Applications</h1>

          <p>
            Review candidates ranked by AI-powered
            resume-to-job matching.
          </p>
        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Success */}

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {/* Job selector */}

      <div className="recruiter-section">

        <div className="section-header">
          <div>
            <h2>Select Job Opening</h2>

            <p>
              Choose a job to view its applicants.
            </p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="recruiter-empty">

            <div className="empty-applications-icon">
              💼
            </div>

            <h3>No job openings found</h3>

            <p>
              Create a job opening before reviewing
              candidate applications.
            </p>

          </div>
        ) : (
          <select
            className="recruiter-job-select"
            value={selectedJob}
            onChange={handleJobChange}
          >
            <option value="">
              Select a job opening
            </option>

            {jobs.map((job) => (
              <option
                key={job.id}
                value={job.id}
              >
                {job.title} — {job.company}
              </option>
            ))}
          </select>
        )}

      </div>

      {/* Selected job */}

      {selectedJobData && (
        <div className="selected-job-banner">

          <div>
            <span className="job-badge">
              SELECTED JOB
            </span>

            <h2>{selectedJobData.title}</h2>

            <p>
              {selectedJobData.company} ·{" "}
              {selectedJobData.location}
            </p>
          </div>

          <div className="selected-job-count">

            <strong>
              {applications.length}
            </strong>

            <span>Applicants</span>

          </div>

        </div>
      )}

      {/* Applications */}

      {selectedJob && (
        <div className="recruiter-section">

          <div className="section-header">

            <div>
              <h2>Ranked Candidates</h2>

              <p>
                Candidates are ordered from highest
                to lowest AI match score.
              </p>
            </div>

            <span className="application-count">
              {applications.length}{" "}
              {applications.length === 1
                ? "Candidate"
                : "Candidates"}
            </span>

          </div>

          {loadingApplications ? (
            <div className="loading-card">

              <h3>Analyzing candidates...</h3>

              <p>
                Calculating resume-to-job match scores.
              </p>

            </div>
          ) : applications.length === 0 ? (
            <div className="recruiter-empty">

              <div className="empty-applications-icon">
                👥
              </div>

              <h3>No applications yet</h3>

              <p>
                Candidates who apply for this job will
                appear here.
              </p>

            </div>
          ) : (
            <div className="recruiter-applications-list">

              {applications.map((application) => (

                <div
                  className="recruiter-application-card"
                  key={application.application_id}
                >

                  {/* Candidate header */}

                  <div className="candidate-card-header">

                    <div className="candidate-info">

                      <div className="candidate-avatar">
                        C
                      </div>

                      <div>

                        <h3>
                          Candidate #
                          {application.applicant_id}
                        </h3>

                        <p>
                          {application.resume_filename}
                        </p>

                      </div>

                    </div>

                    <div
                      className={`match-score ${getScoreClass(
                        application.match_score
                      )}`}
                    >

                      <strong>
                        {application.match_score}%
                      </strong>

                      <span>Match</span>

                    </div>

                  </div>

                  {/* Recommendation */}

                  <div className="candidate-recommendation">

                    <span
                      className={`recommendation-badge ${getRecommendationClass(
                        application.recommendation
                      )}`}
                    >
                      {application.recommendation}
                    </span>

                    <span
                      className={`application-status ${
                        application.status === "selected"
                          ? "status-selected"
                          : application.status === "shortlisted"
                          ? "status-shortlisted"
                          : application.status === "interview"
                          ? "status-interview"
                          : application.status === "rejected"
                          ? "status-rejected"
                          : "status-applied"
                      }`}
                    >
                      {application.status}
                    </span>

                  </div>

                  {/* Skills */}

                  <div className="candidate-skills-section">

                    <div>

                      <h4>Matched Skills</h4>

                      {application.matched_skills?.length > 0 ? (
                        <div className="skill-list">

                          {application.matched_skills.map(
                            (skill) => (
                              <span
                                className="skill-tag matched-skill"
                                key={skill}
                              >
                                ✓ {skill}
                              </span>
                            )
                          )}

                        </div>
                      ) : (
                        <p className="analysis-muted">
                          No matched skills found.
                        </p>
                      )}

                    </div>

                    <div>

                      <h4>Missing Skills</h4>

                      {application.missing_skills?.length > 0 ? (
                        <div className="skill-list">

                          {application.missing_skills.map(
                            (skill) => (
                              <span
                                className="skill-tag missing-skill"
                                key={skill}
                              >
                                {skill}
                              </span>
                            )
                          )}

                        </div>
                      ) : (
                        <p className="analysis-muted">
                          No missing skills.
                        </p>
                      )}

                    </div>

                  </div>

                  {/* Actions */}

                  <div className="candidate-actions">

                    <div className="candidate-date">
                      Applied{" "}
                      {new Date(
                        application.applied_at
                      ).toLocaleDateString()}
                    </div>

                    <div className="status-actions">

                      <button
                        className="status-action-button shortlist-button"
                        disabled={
                          updatingApplication ===
                          application.application_id
                        }
                        onClick={() =>
                          updateStatus(
                            application.application_id,
                            "shortlisted"
                          )
                        }
                      >
                        Shortlist
                      </button>

                      <button
                        className="status-action-button interview-button"
                        disabled={
                          updatingApplication ===
                          application.application_id
                        }
                        onClick={() =>
                          updateStatus(
                            application.application_id,
                            "interview"
                          )
                        }
                      >
                        Interview
                      </button>

                      <button
                        className="status-action-button select-button"
                        disabled={
                          updatingApplication ===
                          application.application_id
                        }
                        onClick={() =>
                          updateStatus(
                            application.application_id,
                            "selected"
                          )
                        }
                      >
                        Select
                      </button>

                      <button
                        className="status-action-button reject-button"
                        disabled={
                          updatingApplication ===
                          application.application_id
                        }
                        onClick={() =>
                          updateStatus(
                            application.application_id,
                            "rejected"
                          )
                        }
                      >
                        Reject
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default RecruiterApplications;