import { useEffect, useState } from "react";
import API from "./api";

function RecruiterDashboard({ onViewApplicants }) {
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobAnalytics, setJobAnalytics] = useState([]);
  const [jobPipelineAnalytics, setJobPipelineAnalytics] = useState({});

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
        jobAnalyticsResponse,
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
        API.get("/applications/job-analytics", {
          headers,
        }),
      ]);

      setDashboard(dashboardResponse.data);
      setAnalytics(analyticsResponse.data);
      setJobs(jobsResponse.data);
      setJobAnalytics(jobAnalyticsResponse.data);

      /*
       * Load detailed pipeline analytics
       * for every recruiter-owned job.
       */
      const pipelineResults = await Promise.all(
        jobsResponse.data.map(async (job) => {
          try {
            const response = await API.get(
              `/applications/job-analytics/${job.id}`,
              {
                headers,
              }
            );

            return {
              jobId: job.id,
              data: response.data,
            };
          } catch (err) {
            console.error(
              `Unable to load pipeline analytics for job ${job.id}`,
              err
            );

            return {
              jobId: job.id,
              data: null,
            };
          }
        })
      );

      const pipelineMap = {};

      pipelineResults.forEach((item) => {
        pipelineMap[item.jobId] = item.data;
      });

      setJobPipelineAnalytics(pipelineMap);
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

  const totalApplications =
    dashboard?.total_applications || 0;

  const totalJobs =
    dashboard?.total_jobs || jobs.length || 0;

  const applied =
    dashboard?.applied || 0;

  const shortlisted =
    dashboard?.shortlisted || 0;

  const interview =
    dashboard?.interview || 0;

  const selected =
    dashboard?.selected || 0;

  const rejected =
    dashboard?.rejected || 0;

  const strongMatches =
    analytics?.strong_matches || 0;

  const goodMatches =
    analytics?.good_matches || 0;

  const partialMatches =
    analytics?.partial_matches || 0;

  const lowMatches =
    analytics?.low_matches || 0;

  const selectionRate =
    totalApplications > 0
      ? Math.round(
          (selected / totalApplications) * 100
        )
      : 0;

  const interviewRate =
    totalApplications > 0
      ? Math.round(
          (interview / totalApplications) * 100
        )
      : 0;

  const shortlistRate =
    totalApplications > 0
      ? Math.round(
          (shortlisted / totalApplications) * 100
        )
      : 0;

  const strongMatchRate =
    totalApplications > 0
      ? Math.round(
          (strongMatches / totalApplications) * 100
        )
      : 0;

  const getMatchPercentage = (value) => {
    const analyticsTotal =
      strongMatches +
      goodMatches +
      partialMatches +
      lowMatches;

    if (analyticsTotal === 0) {
      return 0;
    }

    return Math.round(
      (value / analyticsTotal) * 100
    );
  };

  const getJobApplicationCount = (jobId) => {
    const job = jobAnalytics.find(
      (item) => item.job_id === jobId
    );

    return job?.application_count || 0;
  };

  const getJobPipeline = (jobId) => {
    return jobPipelineAnalytics[jobId] || {
      total_applications: 0,
      applied: 0,
      shortlisted: 0,
      interview: 0,
      selected: 0,
      rejected: 0,
    };
  };

  const getPipelinePercentage = (value, total) => {
    if (!total || total === 0) {
      return 0;
    }

    return Math.round(
      (value / total) * 100
    );
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

          <button
            className="refresh-button"
            onClick={loadRecruiterData}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recruiter-page">

      <style>{`
        .recruiter-performance-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-top: 20px;
        }

        .recruiter-performance-card {
          padding: 20px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
        }

        .recruiter-performance-card span {
          display: block;
          margin-bottom: 8px;
          color: #6b7280;
          font-size: 13px;
        }

        .recruiter-performance-card strong {
          display: block;
          margin-bottom: 5px;
          color: #111827;
          font-size: 28px;
        }

        .recruiter-performance-card p {
          margin: 0;
          color: #6b7280;
          font-size: 12px;
        }

        .analytics-overview {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
          gap: 24px;
          margin-top: 20px;
        }

        .analytics-bars {
          padding: 22px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
        }

        .analytics-bar-row {
          margin-bottom: 20px;
        }

        .analytics-bar-row:last-child {
          margin-bottom: 0;
        }

        .analytics-bar-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .analytics-bar-header span:first-child {
          color: #374151;
          font-weight: 600;
        }

        .analytics-bar-header span:last-child {
          color: #6b7280;
        }

        .analytics-bar-background {
          width: 100%;
          height: 10px;
          overflow: hidden;
          background: #e5e7eb;
          border-radius: 999px;
        }

        .analytics-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: #111827;
          transition: width 0.5s ease;
        }

        .analytics-score-card {
          padding: 24px;
          background: #111827;
          border-radius: 14px;
          color: #ffffff;
        }

        .analytics-score-card span {
          display: block;
          margin-bottom: 10px;
          color: #d1d5db;
          font-size: 13px;
        }

        .analytics-score-card strong {
          display: block;
          margin-bottom: 8px;
          font-size: 42px;
        }

        .analytics-score-card p {
          margin: 0;
          color: #d1d5db;
          line-height: 1.5;
          font-size: 13px;
        }

        .recruiter-job-analytics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 20px;
        }

        .job-analytics-card {
          padding: 20px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
        }

        .job-analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }

        .job-analytics-header h3 {
          margin: 6px 0;
          color: #111827;
          font-size: 17px;
        }

        .job-analytics-header p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
        }

        .job-analytics-count {
          min-width: 58px;
          padding: 9px 10px;
          border-radius: 10px;
          background: #f3f4f6;
          color: #111827;
          text-align: center;
        }

        .job-analytics-count strong {
          display: block;
          font-size: 20px;
        }

        .job-analytics-count span {
          display: block;
          margin-top: 2px;
          color: #6b7280;
          font-size: 10px;
        }

        .recruiter-job-details {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .recruiter-job-details span {
          padding: 6px 9px;
          background: #f3f4f6;
          border-radius: 8px;
          color: #4b5563;
          font-size: 12px;
        }

        .job-pipeline {
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #e5e7eb;
        }

        .job-pipeline-title {
          margin-bottom: 12px;
          color: #374151;
          font-size: 13px;
          font-weight: 700;
        }

        .job-pipeline-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
        }

        .job-pipeline-item {
          min-width: 0;
          padding: 10px 6px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          text-align: center;
        }

        .job-pipeline-item strong {
          display: block;
          color: #111827;
          font-size: 18px;
          line-height: 1.2;
        }

        .job-pipeline-item span {
          display: block;
          margin-top: 4px;
          color: #6b7280;
          font-size: 10px;
          line-height: 1.2;
        }

        .job-pipeline-progress {
          margin-top: 14px;
        }

        .job-pipeline-progress-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 6px;
          color: #6b7280;
          font-size: 11px;
        }

        .job-pipeline-progress-background {
          width: 100%;
          height: 7px;
          overflow: hidden;
          background: #e5e7eb;
          border-radius: 999px;
        }

        .job-pipeline-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: #111827;
          transition: width 0.4s ease;
        }

        .job-pipeline-loading {
          padding: 12px;
          background: #f8fafc;
          border-radius: 10px;
          color: #6b7280;
          font-size: 12px;
          text-align: center;
        }

        .job-analytics-action {
          display: flex;
          justify-content: flex-end;
          margin-top: 16px;
        }

        .dashboard-insight {
          margin-top: 20px;
          padding: 18px 20px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
        }

        .dashboard-insight strong {
          display: block;
          margin-bottom: 6px;
          color: #111827;
        }

        .dashboard-insight p {
          margin: 0;
          color: #6b7280;
          line-height: 1.6;
          font-size: 13px;
        }

        @media (max-width: 1000px) {
          .recruiter-performance-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .analytics-overview {
            grid-template-columns: 1fr;
          }

          .job-pipeline-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .recruiter-performance-grid {
            grid-template-columns: 1fr;
          }

          .recruiter-job-analytics {
            grid-template-columns: 1fr;
          }

          .job-pipeline-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>

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
            {totalJobs}
          </strong>

          <p>Jobs posted by you</p>
        </div>

        <div className="recruiter-stat-card">
          <span className="recruiter-stat-icon">
            👥
          </span>

          <h3>Total Applications</h3>

          <strong>
            {totalApplications}
          </strong>

          <p>Candidate applications</p>
        </div>

        <div className="recruiter-stat-card">
          <span className="recruiter-stat-icon">
            ⭐
          </span>

          <h3>Shortlisted</h3>

          <strong>
            {shortlisted}
          </strong>

          <p>Candidates shortlisted</p>
        </div>

        <div className="recruiter-stat-card">
          <span className="recruiter-stat-icon">
            🎯
          </span>

          <h3>Interviews</h3>

          <strong>
            {interview}
          </strong>

          <p>Candidates in interview</p>
        </div>

        <div className="recruiter-stat-card">
          <span className="recruiter-stat-icon">
            🏆
          </span>

          <h3>Selected</h3>

          <strong>
            {selected}
          </strong>

          <p>Successful candidates</p>
        </div>

      </div>

      {/* Hiring Performance */}

      <div className="recruiter-section">

        <div className="section-header">
          <div>
            <h2>Hiring Performance</h2>

            <p>
              Key recruitment metrics calculated from your
              current applications.
            </p>
          </div>

          <span className="application-count">
            {totalApplications} Applications
          </span>
        </div>

        <div className="recruiter-performance-grid">

          <div className="recruiter-performance-card">
            <span>Shortlist Rate</span>

            <strong>
              {shortlistRate}%
            </strong>

            <p>
              Applications shortlisted
            </p>
          </div>

          <div className="recruiter-performance-card">
            <span>Interview Rate</span>

            <strong>
              {interviewRate}%
            </strong>

            <p>
              Applications reaching interview
            </p>
          </div>

          <div className="recruiter-performance-card">
            <span>Selection Rate</span>

            <strong>
              {selectionRate}%
            </strong>

            <p>
              Applications successfully selected
            </p>
          </div>

          <div className="recruiter-performance-card">
            <span>Strong Match Rate</span>

            <strong>
              {strongMatchRate}%
            </strong>

            <p>
              Candidates with 80%+ AI match
            </p>
          </div>

        </div>

      </div>

      {/* AI Match Analytics */}

      <div className="recruiter-section">

        <div className="section-header">

          <div>
            <h2>AI Match Analytics</h2>

            <p>
              Candidate quality based on resume-to-job
              skill matching.
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
              {strongMatches}
            </strong>

            <p>Strong Match</p>

            <small>80% - 100%</small>
          </div>

          <div className="match-card">
            <span>👍</span>

            <strong>
              {goodMatches}
            </strong>

            <p>Good Match</p>

            <small>60% - 79%</small>
          </div>

          <div className="match-card">
            <span>⚡</span>

            <strong>
              {partialMatches}
            </strong>

            <p>Partial Match</p>

            <small>40% - 59%</small>
          </div>

          <div className="match-card">
            <span>📉</span>

            <strong>
              {lowMatches}
            </strong>

            <p>Low Match</p>

            <small>Below 40%</small>
          </div>

        </div>

        <div className="analytics-overview">

          <div className="analytics-bars">

            <div className="analytics-bar-row">

              <div className="analytics-bar-header">
                <span>Strong Match</span>

                <span>
                  {strongMatches} (
                  {getMatchPercentage(
                    strongMatches
                  )}%)
                </span>
              </div>

              <div className="analytics-bar-background">

                <div
                  className="analytics-bar-fill"
                  style={{
                    width: `${getMatchPercentage(
                      strongMatches
                    )}%`,
                  }}
                />

              </div>

            </div>

            <div className="analytics-bar-row">

              <div className="analytics-bar-header">
                <span>Good Match</span>

                <span>
                  {goodMatches} (
                  {getMatchPercentage(
                    goodMatches
                  )}%)
                </span>
              </div>

              <div className="analytics-bar-background">

                <div
                  className="analytics-bar-fill"
                  style={{
                    width: `${getMatchPercentage(
                      goodMatches
                    )}%`,
                  }}
                />

              </div>

            </div>

            <div className="analytics-bar-row">

              <div className="analytics-bar-header">
                <span>Partial Match</span>

                <span>
                  {partialMatches} (
                  {getMatchPercentage(
                    partialMatches
                  )}%)
                </span>
              </div>

              <div className="analytics-bar-background">

                <div
                  className="analytics-bar-fill"
                  style={{
                    width: `${getMatchPercentage(
                      partialMatches
                    )}%`,
                  }}
                />

              </div>

            </div>

            <div className="analytics-bar-row">

              <div className="analytics-bar-header">
                <span>Low Match</span>

                <span>
                  {lowMatches} (
                  {getMatchPercentage(
                    lowMatches
                  )}%)
                </span>
              </div>

              <div className="analytics-bar-background">

                <div
                  className="analytics-bar-fill"
                  style={{
                    width: `${getMatchPercentage(
                      lowMatches
                    )}%`,
                  }}
                />

              </div>

            </div>

          </div>

          <div className="analytics-score-card">

            <span>
              CANDIDATE QUALITY
            </span>

            <strong>
              {strongMatchRate}%
            </strong>

            <p>
              of your applications currently have
              an AI match score of 80% or higher.
            </p>

          </div>

        </div>

      </div>

      {/* Overall Application Pipeline */}

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
              {applied}
            </strong>
          </div>

          <div className="pipeline-item">
            <span>Shortlisted</span>

            <strong>
              {shortlisted}
            </strong>
          </div>

          <div className="pipeline-item">
            <span>Interview</span>

            <strong>
              {interview}
            </strong>
          </div>

          <div className="pipeline-item">
            <span>Selected</span>

            <strong>
              {selected}
            </strong>
          </div>

          <div className="pipeline-item">
            <span>Rejected</span>

            <strong>
              {rejected}
            </strong>
          </div>

        </div>

        <div className="dashboard-insight">

          <strong>
            Hiring Pipeline Insight
          </strong>

          <p>
            {totalApplications === 0
              ? "Once candidates start applying, IntelliHire AI will show your recruitment pipeline here."
              : `${shortlisted} candidate${
                  shortlisted === 1 ? "" : "s"
                } shortlisted, ${interview} candidate${
                  interview === 1 ? "" : "s"
                } in interview and ${selected} candidate${
                  selected === 1 ? "" : "s"
                } selected from ${totalApplications} total application${
                  totalApplications === 1 ? "" : "s"
                }.`}
          </p>

        </div>

      </div>

      {/* Job-wise Overview */}

      <div className="recruiter-section">

        <div className="section-header">

          <div>
            <h2>Job-wise Overview</h2>

            <p>
              Review each job's applicants and recruitment
              pipeline.
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
              Create your first job opening to start
              receiving candidate applications.
            </p>

          </div>

        ) : (

          <div className="recruiter-job-analytics">

            {jobs.map((job) => {

              const applicationCount =
                getJobApplicationCount(job.id);

              const pipeline =
                getJobPipeline(job.id);

              const pipelineTotal =
                pipeline.total_applications ||
                applicationCount ||
                0;

              const selectedPercentage =
                getPipelinePercentage(
                  pipeline.selected,
                  pipelineTotal
                );

              return (

                <div
                  className="job-analytics-card"
                  key={job.id}
                >

                  <div className="job-analytics-header">

                    <div>

                      <span className="job-badge">
                        JOB #{job.id}
                      </span>

                      <h3>
                        {job.title}
                      </h3>

                      <p>
                        {job.company} • {job.location}
                      </p>

                    </div>

                    <div className="job-analytics-count">

                      <strong>
                        {applicationCount}
                      </strong>

                      <span>
                        APPLICANTS
                      </span>

                    </div>

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

                  {/* Job-specific pipeline */}

                  <div className="job-pipeline">

                    <div className="job-pipeline-title">
                      Application Pipeline
                    </div>

                    {jobPipelineAnalytics[job.id] ===
                    undefined ? (

                      <div className="job-pipeline-loading">
                        Loading pipeline analytics...
                      </div>

                    ) : pipeline ? (

                      <>
                        <div className="job-pipeline-grid">

                          <div className="job-pipeline-item">
                            <strong>
                              {pipeline.applied || 0}
                            </strong>

                            <span>
                              Applied
                            </span>
                          </div>

                          <div className="job-pipeline-item">
                            <strong>
                              {pipeline.shortlisted || 0}
                            </strong>

                            <span>
                              Shortlisted
                            </span>
                          </div>

                          <div className="job-pipeline-item">
                            <strong>
                              {pipeline.interview || 0}
                            </strong>

                            <span>
                              Interview
                            </span>
                          </div>

                          <div className="job-pipeline-item">
                            <strong>
                              {pipeline.selected || 0}
                            </strong>

                            <span>
                              Selected
                            </span>
                          </div>

                          <div className="job-pipeline-item">
                            <strong>
                              {pipeline.rejected || 0}
                            </strong>

                            <span>
                              Rejected
                            </span>
                          </div>

                        </div>

                        <div className="job-pipeline-progress">

                          <div className="job-pipeline-progress-header">

                            <span>
                              Selection Progress
                            </span>

                            <span>
                              {selectedPercentage}%
                            </span>

                          </div>

                          <div className="job-pipeline-progress-background">

                            <div
                              className="job-pipeline-progress-fill"
                              style={{
                                width: `${selectedPercentage}%`,
                              }}
                            />

                          </div>

                        </div>
                      </>

                    ) : (

                      <div className="job-pipeline-loading">
                        Pipeline analytics unavailable.
                      </div>

                    )}

                  </div>

                  <div className="job-analytics-action">

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

              );
            })}

          </div>

        )}

      </div>

    </div>
  );
}

export default RecruiterDashboard;