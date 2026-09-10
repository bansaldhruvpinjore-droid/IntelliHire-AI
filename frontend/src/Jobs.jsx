import { useEffect, useMemo, useState } from "react";
import API from "./api";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);

  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedResume, setSelectedResume] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

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
      setError("");

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

      if (!token) {
        return;
      }

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
    setError("");
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

  const filteredJobs = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) {
      return jobs;
    }

    return jobs.filter((job) => {
      const searchableText = [
        job.title,
        job.company,
        job.location,
        job.description,
        job.required_skills,
        job.experience,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [jobs, searchTerm]);

  if (loading) {
    return (
      <div className="jobs-page">
        <div className="loading-card">
          <h2>Loading jobs...</h2>
          <p>Finding the latest opportunities for you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="jobs-page">

      {/* Header */}
      <div className="jobs-header">

        <div>
          <span className="dashboard-label">INTELLIHIRE AI</span>

          <h1>Find Your Next Opportunity</h1>

          <p>
            Explore available jobs and apply using your professional resume.
          </p>
        </div>

        <div className="job-count">
          {filteredJobs.length}{" "}
          {filteredJobs.length === 1 ? "Job" : "Jobs"}
        </div>

      </div>

      {/* Search */}
      <div className="job-search-container">
        <input
          type="text"
          className="job-search"
          placeholder="Search by job title, company, skill or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Success message */}
      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {/* Error message */}
      {error && !selectedJob && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* No jobs */}
      {jobs.length === 0 ? (
        <div className="empty-jobs">

          <div className="empty-jobs-icon">💼</div>

          <h2>No jobs available</h2>

          <p>
            Recruiters haven't posted any jobs yet.
            Check back later for new opportunities.
          </p>

        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="empty-jobs">

          <div className="empty-jobs-icon">🔎</div>

          <h2>No matching jobs</h2>

          <p>
            Try searching with a different job title, skill,
            company or location.
          </p>

        </div>
      ) : (

        <div className="jobs-grid">

          {filteredJobs.map((job) => (

            <div
              className="job-card"
              key={job.id}
            >

              <div className="job-card-top">

                <div>
                  <h2>{job.title}</h2>
                  <h3>{job.company}</h3>
                </div>

                <span className="job-badge">
                  Open
                </span>

              </div>

              <div className="job-meta">

                <span>
                  📍 {job.location}
                </span>

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

              <p className="job-description">
                {job.description}
              </p>

              {job.required_skills && (
                <div className="skills">

                  <strong>Required Skills</strong>

                  <div className="skill-list">

                    {job.required_skills
                      .split(",")
                      .map((skill, index) => (
                        <span
                          className="skill-tag"
                          key={index}
                        >
                          {skill.trim()}
                        </span>
                      ))}

                  </div>

                </div>
              )}

              <button
                className="primary-button job-apply-button"
                onClick={() => openApplyWindow(job)}
              >
                Apply Now
              </button>

            </div>

          ))}

        </div>

      )}

      {/* Application Modal */}
      {selectedJob && (

        <div
          className="modal-overlay"
          onClick={closeApplyWindow}
        >

          <div
            className="apply-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="modal-close"
              onClick={closeApplyWindow}
              aria-label="Close"
            >
              ×
            </button>

            <span className="dashboard-label">
              APPLICATION
            </span>

            <h2>
              Apply for {selectedJob.title}
            </h2>

            <p className="modal-company">
              {selectedJob.company}
            </p>

            <div className="modal-job-info">

              <span>
                📍 {selectedJob.location}
              </span>

              {selectedJob.experience && (
                <span>
                  💼 {selectedJob.experience}
                </span>
              )}

            </div>

            <label>
              Select Resume
            </label>

            {resumes.length === 0 ? (

              <div className="no-resume">

                <h3>No resume uploaded</h3>

                <p>
                  Please upload a resume before applying
                  for this position.
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
                    ? "Submitting Application..."
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