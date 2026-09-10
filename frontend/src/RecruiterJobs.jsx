import { useEffect, useState } from "react";
import API from "./api";

function RecruiterJobs({ onViewApplicants }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/jobs/mine", {
        headers: getAuthHeaders(),
      });

      setJobs(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load your job openings."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="recruiter-page">
        <div className="loading-message">
          Loading your job openings...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recruiter-page">
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="recruiter-page">

      <div className="recruiter-header">
        <div>
          <span className="dashboard-label">
            INTELLIHIRE AI
          </span>

          <h1>My Job Openings</h1>

          <p>
            Manage your published jobs and review
            candidate applications.
          </p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <h3>No job openings yet</h3>

          <p>
            Create your first job opening to start
            receiving applications.
          </p>
        </div>
      ) : (
        <div className="jobs-management-grid">

          {jobs.map((job) => (
            <div
              className="job-management-card"
              key={job.id}
            >

              <div className="job-management-header">

                <div>
                  <span className="job-id">
                    JOB #{job.id}
                  </span>

                  <h2>{job.title}</h2>

                  <p>
                    {job.company} • {job.location}
                  </p>
                </div>

              </div>

              <div className="job-management-details">

                {job.experience && (
                  <span>
                    Experience: {job.experience}
                  </span>
                )}

                {job.salary && (
                  <span>
                    Salary: {job.salary}
                  </span>
                )}

              </div>

              {job.required_skills && (
                <div className="job-skills">

                  <strong>
                    Required Skills:
                  </strong>

                  <p>
                    {job.required_skills}
                  </p>

                </div>
              )}

              <div className="job-management-actions">

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
  );
}

export default RecruiterJobs;