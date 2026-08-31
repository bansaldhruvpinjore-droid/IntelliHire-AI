import { useEffect, useState } from "react";
import API from "./api";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);

  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedResume, setSelectedResume] = useState("");

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadJobs();
    loadResumes();
  }, []);

  const loadJobs = async () => {
    try {
      const response = await API.get("/jobs/");
      setJobs(response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load jobs.");
    } finally {
      setLoading(false);
    }
  };

  const loadResumes = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await API.get("/resumes/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setResumes(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openApplyWindow = (job) => {
    setSelectedJob(job);
    setSelectedResume("");
    setMessage("");
    setError("");
  };

  const closeApplyWindow = () => {
    setSelectedJob(null);
    setSelectedResume("");
  };

  const submitApplication = async () => {
    if (!selectedResume) {
      setError("Please select a resume.");
      return;
    }

    try {
      setApplying(true);
      setError("");
      setMessage("");

      const token = localStorage.getItem("access_token");

      await API.post(
        "/applications/",
        {
          job_id: selectedJob.id,
          resume_id: Number(selectedResume),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        `Application submitted successfully for ${selectedJob.title}!`
      );

      setSelectedJob(null);
      setSelectedResume("");
    } catch (err) {
      console.error(err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Unable to submit application.");
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="jobs-page">
        <h2>Loading jobs...</h2>
      </div>
    );
  }

  return (
    <div className="jobs-page">

      <div className="jobs-header">
        <div>
          <h1>Available Jobs</h1>
          <p>
            Find your next opportunity with IntelliHire AI.
          </p>
        </div>
      </div>

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {error && !selectedJob && (
        <div className="error-message">
          {error}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="empty-jobs">
          <h2>No jobs available</h2>
          <p>
            Recruiters haven't posted any jobs yet.
          </p>
        </div>
      ) : (
        <div className="jobs-grid">

          {jobs.map((job) => (
            <div
              className="job-card"
              key={job.id}
            >
              <h2>{job.title}</h2>

              <h3>{job.company}</h3>

              <p>
                📍 {job.location}
              </p>

              <p>
                💼 Experience: {job.experience}
              </p>

              {job.salary && (
                <p>
                  💰 Salary: {job.salary}
                </p>
              )}

              <p className="job-description">
                {job.description}
              </p>

              {job.required_skills && (
                <div className="skills">
                  <strong>Required Skills:</strong>
                  <p>{job.required_skills}</p>
                </div>
              )}

              <button
                className="primary-button"
                onClick={() => openApplyWindow(job)}
              >
                Apply Now
              </button>
            </div>
          ))}

        </div>
      )}

      {selectedJob && (
        <div className="modal-overlay">

          <div className="apply-modal">

            <button
              className="modal-close"
              onClick={closeApplyWindow}
            >
              ×
            </button>

            <h2>
              Apply for {selectedJob.title}
            </h2>

            <p>
              {selectedJob.company}
            </p>

            <label>
              Select Resume
            </label>

            {resumes.length === 0 ? (
              <div className="no-resume">
                <p>
                  You don't have any uploaded resumes.
                </p>

                <p>
                  Please upload a resume before applying.
                </p>
              </div>
            ) : (
              <>
                <select
                  value={selectedResume}
                  onChange={(e) =>
                    setSelectedResume(e.target.value)
                  }
                >
                  <option value="">
                    -- Select Resume --
                  </option>

                  {resumes.map((resume) => (
                    <option
                      key={resume.id}
                      value={resume.id}
                    >
                      {resume.filename}
                    </option>
                  ))}
                </select>

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                <button
                  className="primary-button apply-submit"
                  onClick={submitApplication}
                  disabled={applying}
                >
                  {applying
                    ? "Submitting..."
                    : "Submit Application"}
                </button>
              </>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default Jobs;