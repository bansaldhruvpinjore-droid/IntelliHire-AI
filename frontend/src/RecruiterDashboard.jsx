import { useEffect, useState } from "react";
import API from "./api";

function RecruiterDashboard({ onViewApplicants }) {
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [jobs, setJobs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  });

  useEffect(() => {
    loadRecruiterData();
  }, []);

  const loadRecruiterData = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = getAuthHeaders();

      const [
        dashboardResponse,
        analyticsResponse,
        jobsResponse,
      ] = await Promise.all([
        API.get("/applications/dashboard", {
          headers,
        }),
        API.get("/applications/analytics/match", {
          headers,
        }),
        API.get("/jobs/mine", {
          headers,
        }),
      ]);

      setDashboard(dashboardResponse.data);
      setAnalytics(analyticsResponse.data);
      setJobs(jobsResponse.data);
    } catch (err) {
      console.error(err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Unable to load recruiter dashboard.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="recruiter-page">
        <div className="loading-card">
          <h2>Loading recruiter dashboard...</h2>
          <p>
            Fetching recruitment data and job information.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recruiter-page">
        <div className="error-message">
          <h2>Unable to Load Dashboard</h2>
          <p>{error}</p>
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

          <h1>Recruiter Dashboard</h1>

          <p>
            Manage your job openings, review candidates and
            make smarter hiring decisions.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadRecruiterData}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Main Statistics */}

      <div className="recruiter-stats-grid">

        <div className="recruiter-stat-card">
          <span className="recruiter-stat-icon">
            💼
          </span>

          <h3>Active Jobs</h3>

          <strong>
            {dashboard?.total_jobs || 0}
          </strong>

          <p>Jobs posted by you</p>
        </div>

        <div className="recruiter-stat-card">
          <span className="recruiter-stat-icon">
            👥
          </span>

          <h3>Total Applications</h3>

          <strong>
            {dashboard?.total_applications || 0}
          </strong>

          <p>Candidate applications</p>
        </div>

        <div className="recruiter-stat-card">
          <span className="recruiter-stat-icon">
            ⭐
          </span>

          <h3>Shortlisted</h3>

          <strong>
            {dashboard?.shortlisted || 0}
          </strong>

          <p>Candidates shortlisted</p>
        </div>

        <div className="recruiter-stat-card">
          <span className="recruiter-stat-icon">
            🎯
          </span>

          <h3>Interviews</h3>

          <strong>
            {dashboard?.interview || 0}
          </strong>

          <p>Candidates in interview</p>
        </div>

        <div className="recruiter-stat-card">
          <span className="recruiter-stat-icon">
            🏆
          </span>

          <h3>Selected</h3>

          <strong>
            {dashboard?.selected || 0}
          </strong>

          <p>Successful candidates</p>
        </div>

      </div>

      {/* Match Analytics */}

      <div className="recruiter-section">

        <div className="section-header">
          <div>
            <h2>AI Match Analytics</h2>

            <p>
              Candidate quality based on resume-to-job skill matching.
            </p>
          </div>

          <span className="application-count">
            {analytics?.total_applications || 0} Applications
          </span>
        </div>

        <div className="match-analytics-grid">

          <div className="match-card">
            <span>🔥</span>

            <strong>
              {analytics?.strong_matches || 0}
            </strong>

            <p>Strong Match</p>

            <small>80% - 100%</small>
          </div>

          <div className="match-card">
            <span>👍</span>

            <strong>
              {analytics?.good_matches || 0}
            </strong>

            <p>Good Match</p>

            <small>60% - 79%</small>
          </div>

          <div className="match-card">
            <span>⚡</span>

            <strong>
              {analytics?.partial_matches || 0}
            </strong>

            <p>Partial Match</p>

            <small>40% - 59%</small>
          </div>

          <div className="match-card">
            <span>📉</span>

            <strong>
              {analytics?.low_matches || 0}
            </strong>

            <p>Low Match</p>

            <small>Below 40%</small>
          </div>

        </div>
      </div>

      {/* Application Pipeline */}

      <div className="recruiter-section">

        <div className="section-header">
          <div>
            <h2>Application Pipeline</h2>

            <p>
              Current status of candidates across your jobs.
            </p>
          </div>
        </div>

        <div className="pipeline-grid">

          <div className="pipeline-item">
            <span>Applied</span>
            <strong>
              {dashboard?.applied || 0}
            </strong>
          </div>

          <div className="pipeline-item">
            <span>Shortlisted</span>
            <strong>
              {dashboard?.shortlisted || 0}
            </strong>
          </div>

          <div className="pipeline-item">
            <span>Interview</span>
            <strong>
              {dashboard?.interview || 0}
            </strong>
          </div>

          <div className="pipeline-item">
            <span>Selected</span>
            <strong>
              {dashboard?.selected || 0}
            </strong>
          </div>

          <div className="pipeline-item">
            <span>Rejected</span>
            <strong>
              {dashboard?.rejected || 0}
            </strong>
          </div>

        </div>
      </div>

      {/* My Jobs */}

      <div className="recruiter-section">

        <div className="section-header">

          <div>
            <h2>My Job Openings</h2>

            <p>
              Jobs currently managed by your recruiter account.
            </p>
          </div>

          <span className="application-count">
            {jobs.length}{" "}
            {jobs.length === 1 ? "Job" : "Jobs"}
          </span>

        </div>

        {jobs.length === 0 ? (
          <div className="recruiter-empty">

            <div className="empty-applications-icon">
              💼
            </div>

            <h3>No jobs posted yet</h3>

            <p>
              Create your first job opening to start receiving
              candidate applications.
            </p>

          </div>
        ) : (
          <div className="recruiter-jobs-grid">

            {jobs.map((job) => (
              <div
                className="recruiter-job-card"
                key={job.id}
              >

                <div className="recruiter-job-top">

                  <div>
                    <span className="job-badge">
                      JOB #{job.id}
                    </span>

                    <h3>{job.title}</h3>

                    <p>{job.company}</p>
                  </div>

                  <span className="job-location">
                    📍 {job.location}
                  </span>

                </div>

                <div className="recruiter-job-details">

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

                <div className="recruiter-job-actions">

                  <button
                    className="analysis-button"
                    onClick={() =>
                      onViewApplicants(job.id)
                    }
                  >
                    View Applicants
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}

export default RecruiterDashboard;