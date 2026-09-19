import { useEffect, useMemo, useState } from "react";
import API from "./api";

function RecruiterApplications({ initialJobId, onBack }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId || "");
  const [applications, setApplications] = useState([]);
  const [minScore, setMinScore] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingApplications, setLoadingApplications] =
    useState(false);

  const [selectedApplicationIds, setSelectedApplicationIds] =
    useState([]);

  const [selectedCandidate, setSelectedCandidate] =
    useState(null);
  const [timeline, setTimeline] = useState([]);
  const [showTimeline, setShowTimeline] = useState(false);

  const [showComparison, setShowComparison] = useState(false);

  const [resumePreviewCandidate, setResumePreviewCandidate] =
    useState(null);
  const [resumePreviewLoading, setResumePreviewLoading] =
    useState(false);
  const [resumePreviewError, setResumePreviewError] =
    useState("");
  const [resumePreviewUrl, setResumePreviewUrl] = useState("");

  const [message, setMessage] = useState("");

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);

      const response = await API.get("/jobs/mine");

      setJobs(response.data || []);

      if (initialJobId) {
        const exists = (response.data || []).some(
          (job) => job.id === Number(initialJobId)
        );

        if (exists) {
          setSelectedJobId(Number(initialJobId));
        }
      } else if (
        response.data?.length > 0 &&
        !selectedJobId
      ) {
        setSelectedJobId(response.data[0].id);
      }
    } catch (error) {
      console.error(
        "Failed to load recruiter jobs:",
        error
      );

      setMessage(
        error.response?.data?.detail ||
          "Unable to load recruiter jobs."
      );
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadApplications = async (
    jobId = selectedJobId,
    score = minScore
  ) => {
    if (!jobId) {
      setApplications([]);
      return;
    }

    try {
      setLoadingApplications(true);
      setMessage("");

      let response;

      if (Number(score) > 0) {
        response = await API.get(
          `/applications/job/${jobId}/ranked/filter`,
          {
            params: {
              min_score: Number(score),
            },
          }
        );
      } else {
        response = await API.get(
          `/applications/job/${jobId}/ranked`
        );
      }

      setApplications(response.data || []);
      setSelectedApplicationIds([]);
    } catch (error) {
      console.error(
        "Failed to load applications:",
        error
      );

      setApplications([]);

      setMessage(
        error.response?.data?.detail ||
          "Unable to load applications."
      );
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadApplications(selectedJobId, 0);
      setMinScore(0);
      setStatusFilter("all");
      setSearchQuery("");
      setSelectedApplicationIds([]);
    }
  }, [selectedJobId]);

  const normalizeStatus = (status) => {
    return String(status || "applied").toLowerCase();
  };

  const getStatusLabel = (status) => {
    const normalized = normalizeStatus(status);

    const labels = {
      applied: "Applied",
      shortlisted: "Shortlisted",
      interview: "Interview",
      selected: "Selected",
      rejected: "Rejected",
    };

    return labels[normalized] || normalized;
  };

  const getRecommendationClass = (recommendation) => {
    const value = String(
      recommendation || ""
    ).toLowerCase();

    if (value.includes("strong")) {
      return "recommendation-strong";
    }

    if (value.includes("good")) {
      return "recommendation-good";
    }

    if (value.includes("partial")) {
      return "recommendation-partial";
    }

    return "recommendation-low";
  };

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return applications.filter((application) => {
      const status = normalizeStatus(
        application.status
      );

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        application.id,
        application.application_id,
        application.resume_id,
        application.resume_filename,
        application.candidate_id,
        application.candidate_name,
        application.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [
    applications,
    statusFilter,
    searchQuery,
  ]);

  const statistics = useMemo(() => {
    const total = applications.length;

    const strongMatches = applications.filter(
      (application) =>
        Number(application.match_score || 0) >= 80
    ).length;

    const selected = applications.filter(
      (application) =>
        normalizeStatus(application.status) ===
        "selected"
    ).length;

    const average =
      total > 0
        ? Math.round(
            applications.reduce(
              (sum, application) =>
                sum +
                Number(
                  application.match_score || 0
                ),
              0
            ) / total
          )
        : 0;

    return {
      total,
      strongMatches,
      selected,
      average,
    };
  }, [applications]);

  const statusCounts = useMemo(() => {
    const counts = {
      all: applications.length,
      applied: 0,
      shortlisted: 0,
      interview: 0,
      selected: 0,
      rejected: 0,
    };

    applications.forEach((application) => {
      const status = normalizeStatus(
        application.status
      );

      if (counts[status] !== undefined) {
        counts[status] += 1;
      }
    });

    return counts;
  }, [applications]);

  const comparisonCandidates = useMemo(() => {
    return applications.filter((application) =>
      selectedApplicationIds.includes(application.id)
    );
  }, [applications, selectedApplicationIds]);

  const bestComparisonCandidate = useMemo(() => {
    if (comparisonCandidates.length === 0) {
      return null;
    }

    return [...comparisonCandidates].sort(
      (a, b) =>
        Number(b.match_score || 0) -
        Number(a.match_score || 0)
    )[0];
  }, [comparisonCandidates]);

  const toggleCandidateSelection = (
    applicationId
  ) => {
    setSelectedApplicationIds((current) => {
      if (current.includes(applicationId)) {
        return current.filter(
          (id) => id !== applicationId
        );
      }

      if (current.length >= 4) {
        setMessage(
          "You can compare up to 4 candidates at a time."
        );
        return current;
      }

      setMessage("");

      return [...current, applicationId];
    });
  };

  const clearComparisonSelection = () => {
    setSelectedApplicationIds([]);
    setShowComparison(false);
  };

  const handleCompare = () => {
    if (selectedApplicationIds.length < 2) {
      setMessage(
        "Select at least 2 candidates to compare."
      );
      return;
    }

    setMessage("");
    setShowComparison(true);
  };

  const handleScoreFilter = async (event) => {
    const score = Number(event.target.value);

    setMinScore(score);
    setStatusFilter("all");
    setSearchQuery("");
    setSelectedApplicationIds([]);

    await loadApplications(
      selectedJobId,
      score
    );
  };

  const handleRefresh = async () => {
    setSelectedApplicationIds([]);

    await loadApplications(
      selectedJobId,
      minScore
    );
  };

  const resetFilters = async () => {
    setMinScore(0);
    setStatusFilter("all");
    setSearchQuery("");
    setSelectedApplicationIds([]);

    await loadApplications(
      selectedJobId,
      0
    );
  };

  const updateApplicationStatus = async (
    applicationId,
    status
  ) => {
    try {
      setMessage("");

      await API.patch(
        `/applications/${applicationId}/status`,
        {
          status,
        }
      );

      setMessage(
        `Application status updated to ${getStatusLabel(
          status
        )}.`
      );

      await loadApplications(
        selectedJobId,
        minScore
      );
    } catch (error) {
      console.error(
        "Failed to update application status:",
        error
      );

      setMessage(
        error.response?.data?.detail ||
          "Unable to update application status."
      );
    }
  };

  const openCandidateDetails = (application) => {
    setSelectedCandidate(application);
    setShowTimeline(false);
  };

  const openTimeline = async (applicationId) => {
    try {
      const response = await API.get(
        `/applications/${applicationId}/timeline`
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setTimeline(data);
      } else if (
        Array.isArray(data?.timeline)
      ) {
        setTimeline(data.timeline);
      } else if (
        Array.isArray(data?.history)
      ) {
        setTimeline(data.history);
      } else {
        setTimeline([]);
      }

      setShowTimeline(true);
    } catch (error) {
      console.error(
        "Failed to load application timeline:",
        error
      );

      setTimeline([]);
      setShowTimeline(true);
    }
  };

  const closeCandidateModal = () => {
    setSelectedCandidate(null);
    setShowTimeline(false);
    setTimeline([]);
  };

  const closeResumePreview = () => {
    if (resumePreviewUrl) {
      URL.revokeObjectURL(resumePreviewUrl);
    }

    setResumePreviewCandidate(null);
    setResumePreviewLoading(false);
    setResumePreviewError("");
    setResumePreviewUrl("");
  };

  const loadAuthenticatedResume = async (
    application
  ) => {
    if (!application?.resume_id) {
      setResumePreviewError(
        "This application does not have a resume ID."
      );
      setResumePreviewCandidate(application);
      return;
    }

    setResumePreviewCandidate(application);
    setResumePreviewLoading(true);
    setResumePreviewError("");

    if (resumePreviewUrl) {
      URL.revokeObjectURL(resumePreviewUrl);
      setResumePreviewUrl("");
    }

    try {
      const response = await API.get(
        `/resumes/${application.resume_id}/file`,
        {
          responseType: "blob",
        }
      );

      const contentType =
        response.headers?.["content-type"] || "";

      if (
        !contentType
          .toLowerCase()
          .includes("application/pdf")
      ) {
        throw new Error(
          "The server did not return a PDF file."
        );
      }

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      const objectUrl =
        URL.createObjectURL(blob);

      setResumePreviewUrl(objectUrl);
    } catch (error) {
      console.error(
        "Failed to load authenticated resume:",
        error
      );

      setResumePreviewError(
        error.response?.data?.detail ||
          error.message ||
          "The resume could not be loaded."
      );
    } finally {
      setResumePreviewLoading(false);
    }
  };

  const openResumePreview = (application) => {
    loadAuthenticatedResume(application);
  };

  const openResumeInNewTab = () => {
    if (!resumePreviewUrl) {
      setResumePreviewError(
        "The resume is not ready to open yet."
      );
      return;
    }

    const newWindow = window.open(
      resumePreviewUrl,
      "_blank",
      "noopener,noreferrer"
    );

    if (!newWindow) {
      setResumePreviewError(
        "The browser blocked the new tab. Please allow pop-ups for this site."
      );
    }
  };

  const renderSkillList = (
    skills,
    emptyText = "None"
  ) => {
    if (!skills || skills.length === 0) {
      return (
        <span className="skill-empty">
          {emptyText}
        </span>
      );
    }

    return (
      <div className="skill-list">
        {skills.map((skill, index) => (
          <span
            className="skill-chip"
            key={`${skill}-${index}`}
          >
            {skill}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container recruiter-applications-page">
      <div className="page-header">
        <div>
          <h1>Applicant Management</h1>
          <p>
            Review, rank, compare and manage candidates
            for your jobs.
          </p>
        </div>

        {onBack && (
          <button
            className="secondary-button"
            onClick={onBack}
          >
            Back
          </button>
        )}
      </div>

      {message && (
        <div className="info-message">
          {message}
        </div>
      )}

      <div className="applications-toolbar">
        <div className="toolbar-group">
          <label htmlFor="recruiter-job-select">
            Select Job
          </label>

          <select
            id="recruiter-job-select"
            value={selectedJobId}
            onChange={(event) =>
              setSelectedJobId(
                Number(event.target.value)
              )
            }
            disabled={loadingJobs}
          >
            <option value="">
              {loadingJobs
                ? "Loading jobs..."
                : "Select a job"}
            </option>

            {jobs.map((job) => (
              <option
                value={job.id}
                key={job.id}
              >
                {job.title} — {job.company}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-group">
          <label htmlFor="minimum-score">
            Minimum AI Match Score
          </label>

          <select
            id="minimum-score"
            value={minScore}
            onChange={handleScoreFilter}
            disabled={
              !selectedJobId ||
              loadingApplications
            }
          >
            <option value="0">
              All Scores
            </option>
            <option value="40">40%+</option>
            <option value="50">50%+</option>
            <option value="60">60%+</option>
            <option value="70">70%+</option>
            <option value="80">80%+</option>
            <option value="90">90%+</option>
          </select>
        </div>

        <div className="toolbar-actions">
          <button
            className="secondary-button"
            onClick={handleRefresh}
            disabled={
              !selectedJobId ||
              loadingApplications
            }
          >
            {loadingApplications
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            className="secondary-button"
            onClick={resetFilters}
            disabled={
              !selectedJobId ||
              loadingApplications
            }
          >
            Clear Filters
          </button>
        </div>
      </div>

      {selectedJobId && (
        <>
          <div className="applicant-stat-grid">
            <div className="applicant-stat-card">
              <span>Total Applicants</span>
              <strong>
                {statistics.total}
              </strong>
            </div>

            <div className="applicant-stat-card">
              <span>Strong Matches</span>
              <strong>
                {statistics.strongMatches}
              </strong>
            </div>

            <div className="applicant-stat-card">
              <span>Average Match</span>
              <strong>
                {statistics.average}%
              </strong>
            </div>

            <div className="applicant-stat-card">
              <span>Selected</span>
              <strong>
                {statistics.selected}
              </strong>
            </div>
          </div>

          <div className="applicant-controls-card">
            <div className="applicant-search-wrapper">
              <label htmlFor="candidate-search">
                Search Candidates
              </label>

              <input
                id="candidate-search"
                type="text"
                placeholder="Search by candidate ID, application ID or resume..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="status-filter-section">
              <span className="filter-label">
                Status
              </span>

              <div className="status-filter-tabs">
                {[
                  ["all", "All"],
                  ["applied", "Applied"],
                  [
                    "shortlisted",
                    "Shortlisted",
                  ],
                  [
                    "interview",
                    "Interview",
                  ],
                  ["selected", "Selected"],
                  ["rejected", "Rejected"],
                ].map(
                  ([value, label]) => (
                    <button
                      key={value}
                      className={`status-filter-tab ${
                        statusFilter === value
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setStatusFilter(
                          value
                        )
                      }
                    >
                      {label}

                      <span>
                        {statusCounts[
                          value
                        ] || 0}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="comparison-toolbar">
            <div>
              <strong>
                {
                  selectedApplicationIds.length
                }
              </strong>{" "}
              candidate
              {selectedApplicationIds.length ===
              1
                ? ""
                : "s"} selected

              <span className="comparison-limit">
                Maximum 4
              </span>
            </div>

            <div className="comparison-toolbar-actions">
              {selectedApplicationIds.length >
                0 && (
                <button
                  className="secondary-button"
                  onClick={
                    clearComparisonSelection
                  }
                >
                  Clear Selection
                </button>
              )}

              <button
                className="primary-button"
                onClick={handleCompare}
                disabled={
                  selectedApplicationIds.length <
                  2
                }
              >
                Compare Candidates
              </button>
            </div>
          </div>

          {loadingApplications ? (
            <div className="empty-state">
              Loading applicants...
            </div>
          ) : filteredApplications.length ===
            0 ? (
            <div className="empty-state">
              <h3>No applicants found</h3>
              <p>
                Try changing the score, status or
                search filters.
              </p>
            </div>
          ) : (
            <div className="recruiter-applications-list">
              {filteredApplications.map(
                (
                  application,
                  index
                ) => {
                  const score = Number(
                    application.match_score ||
                      0
                  );

                  const status =
                    normalizeStatus(
                      application.status
                    );

                  const isSelected =
                    selectedApplicationIds.includes(
                      application.id
                    );

                  const isTopCandidate =
                    index === 0 &&
                    minScore === 0 &&
                    statusFilter ===
                      "all" &&
                    !searchQuery.trim();

                  return (
                    <div
                      className={`recruiter-application-card ${
                        isSelected
                          ? "candidate-selected-card"
                          : ""
                      }`}
                      key={
                        application.id
                      }
                    >
                      <div className="candidate-selection">
                        <input
                          type="checkbox"
                          checked={
                            isSelected
                          }
                          onChange={() =>
                            toggleCandidateSelection(
                              application.id
                            )
                          }
                          aria-label={`Select candidate ${application.id} for comparison`}
                        />
                      </div>

                      <div className="candidate-rank">
                        #{index + 1}
                      </div>

                      <div className="candidate-main">
                        <div className="candidate-title-row">
                          <div>
                            <h3>
                              Candidate #
                              {application.candidate_id ||
                                application.user_id ||
                                application.resume_id ||
                                application.id}
                            </h3>

                            <p>
                              Resume:{" "}
                              {application.resume_filename ||
                                "Resume"}
                            </p>

                            <small>
                              Application ID:{" "}
                              {application.id}
                            </small>
                          </div>

                          {isTopCandidate && (
                            <span className="top-match-badge">
                              TOP MATCH
                            </span>
                          )}
                        </div>

                        <div className="candidate-score-row">
                          <div className="candidate-score">
                            <span>
                              AI Match
                            </span>

                            <strong>
                              {score}%
                            </strong>
                          </div>

                          <div className="score-progress">
                            <div
                              className="score-progress-fill"
                              style={{
                                width: `${Math.min(
                                  Math.max(
                                    score,
                                    0
                                  ),
                                  100
                                )}%`,
                              }}
                            />
                          </div>

                          <span
                            className={`recommendation-badge ${getRecommendationClass(
                              application.recommendation
                            )}`}
                          >
                            {application.recommendation ||
                              "Not Available"}
                          </span>
                        </div>

                        <div className="candidate-meta-grid">
                          <div>
                            <span>
                              Status
                            </span>

                            <strong
                              className={`status-badge status-${status}`}
                            >
                              {getStatusLabel(
                                status
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Matched Skills
                            </span>

                            <strong>
                              {
                                (
                                  application.matched_skills ||
                                  []
                                ).length
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Missing Skills
                            </span>

                            <strong>
                              {
                                (
                                  application.missing_skills ||
                                  []
                                ).length
                              }
                            </strong>
                          </div>
                        </div>

                        <div className="candidate-skills-preview">
                          <div>
                            <span>
                              Matched Skills
                            </span>

                            {renderSkillList(
                              application.matched_skills,
                              "No matched skills"
                            )}
                          </div>

                          <div>
                            <span>
                              Missing Skills
                            </span>

                            {renderSkillList(
                              application.missing_skills,
                              "No missing skills"
                            )}
                          </div>
                        </div>

                        <div className="candidate-actions">
                          <button
                            className="secondary-button"
                            onClick={() =>
                              openCandidateDetails(
                                application
                              )
                            }
                          >
                            View Details
                          </button>

                          <button
                            className="resume-button"
                            onClick={() =>
                              openResumePreview(
                                application
                              )
                            }
                          >
                            View Resume
                          </button>

                          <button
                            className="secondary-button"
                            onClick={() =>
                              openTimeline(
                                application.id
                              )
                            }
                          >
                            Timeline
                          </button>

                          {status !==
                            "shortlisted" &&
                            status !==
                              "selected" &&
                            status !==
                              "rejected" && (
                              <button
                                className="action-button"
                                onClick={() =>
                                  updateApplicationStatus(
                                    application.id,
                                    "shortlisted"
                                  )
                                }
                              >
                                Shortlist
                              </button>
                            )}

                          {status !==
                            "interview" &&
                            status !==
                              "selected" &&
                            status !==
                              "rejected" && (
                              <button
                                className="action-button"
                                onClick={() =>
                                  updateApplicationStatus(
                                    application.id,
                                    "interview"
                                  )
                                }
                              >
                                Interview
                              </button>
                            )}

                          {status !==
                            "selected" && (
                            <button
                              className="action-button"
                              onClick={() =>
                                updateApplicationStatus(
                                  application.id,
                                  "selected"
                                )
                              }
                            >
                              Select
                            </button>
                          )}

                          {status !==
                            "rejected" && (
                            <button
                              className="danger-button"
                              onClick={() =>
                                updateApplicationStatus(
                                  application.id,
                                  "rejected"
                                )
                              }
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </>
      )}

      {showComparison &&
        comparisonCandidates.length >= 2 && (
          <div
            className="modal-overlay"
            onClick={() =>
              setShowComparison(false)
            }
          >
            <div
              className="comparison-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="comparison-modal-header">
                <div>
                  <h2>
                    Candidate Comparison
                  </h2>

                  <p>
                    Compare selected candidates
                    using their AI match and
                    application data.
                  </p>
                </div>

                <button
                  className="modal-close-button"
                  onClick={() =>
                    setShowComparison(
                      false
                    )
                  }
                >
                  ×
                </button>
              </div>

              {bestComparisonCandidate && (
                <div className="best-candidate-banner">
                  <div>
                    <span>
                      Best Match
                    </span>

                    <strong>
                      Candidate #
                      {bestComparisonCandidate.candidate_id ||
                        bestComparisonCandidate.user_id ||
                        bestComparisonCandidate.resume_id ||
                        bestComparisonCandidate.id}
                    </strong>
                  </div>

                  <div className="best-candidate-score">
                    {
                      bestComparisonCandidate.match_score
                    }
                    %
                  </div>
                </div>
              )}

              <div className="comparison-table-wrapper">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>
                        Candidate
                      </th>

                      {comparisonCandidates.map(
                        (candidate) => (
                          <th
                            key={
                              candidate.id
                            }
                          >
                            Candidate #
                            {candidate.candidate_id ||
                              candidate.user_id ||
                              candidate.resume_id ||
                              candidate.id}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>
                        AI Match Score
                      </td>

                      {comparisonCandidates.map(
                        (candidate) => (
                          <td
                            key={
                              candidate.id
                            }
                            className="comparison-score-cell"
                          >
                            {
                              candidate.match_score
                            }
                            %
                          </td>
                        )
                      )}
                    </tr>

                    <tr>
                      <td>
                        Recommendation
                      </td>

                      {comparisonCandidates.map(
                        (candidate) => (
                          <td
                            key={
                              candidate.id
                            }
                          >
                            <span
                              className={`recommendation-badge ${getRecommendationClass(
                                candidate.recommendation
                              )}`}
                            >
                              {candidate.recommendation ||
                                "Not Available"}
                            </span>
                          </td>
                        )
                      )}
                    </tr>

                    <tr>
                      <td>Status</td>

                      {comparisonCandidates.map(
                        (candidate) => (
                          <td
                            key={
                              candidate.id
                            }
                          >
                            <span
                              className={`status-badge status-${normalizeStatus(
                                candidate.status
                              )}`}
                            >
                              {getStatusLabel(
                                candidate.status
                              )}
                            </span>
                          </td>
                        )
                      )}
                    </tr>

                    <tr>
                      <td>Resume</td>

                      {comparisonCandidates.map(
                        (candidate) => (
                          <td
                            key={
                              candidate.id
                            }
                          >
                            {candidate.resume_filename ||
                              "Resume"}
                          </td>
                        )
                      )}
                    </tr>

                    <tr>
                      <td>
                        Matched Skills
                      </td>

                      {comparisonCandidates.map(
                        (candidate) => (
                          <td
                            key={
                              candidate.id
                            }
                          >
                            {renderSkillList(
                              candidate.matched_skills,
                              "None"
                            )}
                          </td>
                        )
                      )}
                    </tr>

                    <tr>
                      <td>
                        Missing Skills
                      </td>

                      {comparisonCandidates.map(
                        (candidate) => (
                          <td
                            key={
                              candidate.id
                            }
                          >
                            {renderSkillList(
                              candidate.missing_skills,
                              "None"
                            )}
                          </td>
                        )
                      )}
                    </tr>

                    <tr>
                      <td>
                        Applicant ID
                      </td>

                      {comparisonCandidates.map(
                        (candidate) => (
                          <td
                            key={
                              candidate.id
                            }
                          >
                            {candidate.candidate_id ||
                              candidate.user_id ||
                              "N/A"}
                          </td>
                        )
                      )}
                    </tr>

                    <tr>
                      <td>
                        Application ID
                      </td>

                      {comparisonCandidates.map(
                        (candidate) => (
                          <td
                            key={
                              candidate.id
                            }
                          >
                            {candidate.id}
                          </td>
                        )
                      )}
                    </tr>

                    <tr>
                      <td>Action</td>

                      {comparisonCandidates.map(
                        (candidate) => (
                          <td
                            key={
                              candidate.id
                            }
                          >
                            <button
                              className="secondary-button"
                              onClick={() => {
                                setShowComparison(
                                  false
                                );

                                openCandidateDetails(
                                  candidate
                                );
                              }}
                            >
                              View Details
                            </button>
                          </td>
                        )
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {selectedCandidate && (
        <div
          className="modal-overlay"
          onClick={closeCandidateModal}
        >
          <div
            className="candidate-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>
                  Candidate #
                  {selectedCandidate.candidate_id ||
                    selectedCandidate.user_id ||
                    selectedCandidate.resume_id ||
                    selectedCandidate.id}
                </h2>

                <p>
                  Application ID:{" "}
                  {selectedCandidate.id}
                </p>
              </div>

              <button
                className="modal-close-button"
                onClick={
                  closeCandidateModal
                }
              >
                ×
              </button>
            </div>

            <div className="candidate-detail-grid">
              <div className="detail-card">
                <span>
                  AI Match Score
                </span>

                <strong>
                  {selectedCandidate.match_score ||
                    0}
                  %
                </strong>
              </div>

              <div className="detail-card">
                <span>Status</span>

                <strong>
                  {getStatusLabel(
                    selectedCandidate.status
                  )}
                </strong>
              </div>

              <div className="detail-card">
                <span>
                  Recommendation
                </span>

                <strong>
                  {selectedCandidate.recommendation ||
                    "Not Available"}
                </strong>
              </div>

              <div className="detail-card">
                <span>Resume</span>

                <strong>
                  {selectedCandidate.resume_filename ||
                    "Resume"}
                </strong>
              </div>
            </div>

            <div className="resume-preview-action">
              <button
                className="resume-button"
                onClick={() =>
                  openResumePreview(
                    selectedCandidate
                  )
                }
              >
                View Resume
              </button>
            </div>

            <div className="detail-section">
              <h3>
                Matched Skills
              </h3>

              {renderSkillList(
                selectedCandidate.matched_skills,
                "No matched skills"
              )}
            </div>

            <div className="detail-section">
              <h3>
                Missing Skills
              </h3>

              {renderSkillList(
                selectedCandidate.missing_skills,
                "No missing skills"
              )}
            </div>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  openTimeline(
                    selectedCandidate.id
                  )
                }
              >
                View Application Timeline
              </button>

              <button
                className="secondary-button"
                onClick={
                  closeCandidateModal
                }
              >
                Close
              </button>
            </div>

            {showTimeline && (
              <div className="timeline-section">
                <h3>
                  Application Timeline
                </h3>

                {timeline.length === 0 ? (
                  <p className="timeline-empty">
                    No timeline records
                    available.
                  </p>
                ) : (
                  <div className="timeline-list">
                    {timeline.map(
                      (
                        event,
                        index
                      ) => (
                        <div
                          className="timeline-item"
                          key={
                            event.id ||
                            `${event.status}-${index}`
                          }
                        >
                          <div className="timeline-dot" />

                          <div>
                            <strong>
                              {getStatusLabel(
                                event.status ||
                                  event.new_status
                              )}
                            </strong>

                            <p>
                              {event.created_at
                                ? new Date(
                                    event.created_at
                                  ).toLocaleString()
                                : "Date unavailable"}
                            </p>

                            {event.note && (
                              <small>
                                {event.note}
                              </small>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {resumePreviewCandidate && (
        <div
          className="modal-overlay resume-preview-overlay"
          onClick={
            closeResumePreview
          }
        >
          <div
            className="resume-preview-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="resume-preview-header">
              <div>
                <h2>
                  Resume Preview
                </h2>

                <p>
                  Candidate #
                  {resumePreviewCandidate.candidate_id ||
                    resumePreviewCandidate.user_id ||
                    resumePreviewCandidate.resume_id ||
                    resumePreviewCandidate.id}
                </p>

                <span>
                  {resumePreviewCandidate.resume_filename ||
                    "Resume"}
                </span>
              </div>

              <div className="resume-preview-header-actions">
                <button
                  className="secondary-button"
                  onClick={
                    openResumeInNewTab
                  }
                  disabled={
                    !resumePreviewUrl
                  }
                >
                  Open in New Tab
                </button>

                <button
                  className="modal-close-button"
                  onClick={
                    closeResumePreview
                  }
                >
                  ×
                </button>
              </div>
            </div>

            {resumePreviewError ? (
              <div className="resume-preview-error">
                <h3>
                  Unable to preview resume
                </h3>

                <p>
                  {resumePreviewError}
                </p>
              </div>
            ) : !resumePreviewCandidate.resume_id ? (
              <div className="resume-preview-error">
                <h3>
                  Resume unavailable
                </h3>

                <p>
                  No resume ID was provided
                  with this application.
                </p>
              </div>
            ) : (
              <div className="resume-viewer-container">
                {resumePreviewLoading && (
                  <div className="resume-loading">
                    Loading resume...
                  </div>
                )}

                {resumePreviewUrl && (
                  <iframe
                    title="Candidate Resume"
                    src={resumePreviewUrl}
                    className="resume-pdf-viewer"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .recruiter-applications-page {
          padding-bottom: 60px;
        }

        .applications-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          align-items: end;
          padding: 20px;
          margin-bottom: 20px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
        }

        .toolbar-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 220px;
        }

        .toolbar-group label,
        .applicant-search-wrapper label,
        .filter-label {
          font-size: 13px;
          font-weight: 700;
          color: #374151;
        }

        .toolbar-group select,
        .applicant-search-wrapper input {
          min-height: 42px;
          padding: 0 12px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          background: #ffffff;
          font-size: 14px;
          outline: none;
        }

        .toolbar-group select:focus,
        .applicant-search-wrapper input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }

        .toolbar-actions {
          display: flex;
          gap: 10px;
          margin-left: auto;
        }

        .applicant-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .applicant-stat-card {
          padding: 20px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
        }

        .applicant-stat-card span {
          display: block;
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .applicant-stat-card strong {
          font-size: 28px;
          color: #111827;
        }

        .applicant-controls-card {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          align-items: end;
          padding: 20px;
          margin-bottom: 16px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
        }

        .applicant-search-wrapper {
          flex: 1;
          min-width: 280px;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .applicant-search-wrapper input {
          width: 100%;
          box-sizing: border-box;
        }

        .status-filter-section {
          flex: 2;
          min-width: 320px;
        }

        .status-filter-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 7px;
        }

        .status-filter-tab {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 999px;
          background: #ffffff;
          color: #4b5563;
          cursor: pointer;
          font-size: 13px;
        }

        .status-filter-tab span {
          min-width: 20px;
          padding: 2px 6px;
          border-radius: 999px;
          background: #f3f4f6;
          font-size: 11px;
          text-align: center;
        }

        .status-filter-tab.active {
          background: #111827;
          color: #ffffff;
          border-color: #111827;
        }

        .status-filter-tab.active span {
          background: #ffffff;
          color: #111827;
        }

        .comparison-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
          padding: 14px 18px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
        }

        .comparison-toolbar > div:first-child {
          color: #374151;
        }

        .comparison-limit {
          margin-left: 10px;
          color: #9ca3af;
          font-size: 12px;
        }

        .comparison-toolbar-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .recruiter-applications-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .recruiter-application-card {
          position: relative;
          display: flex;
          gap: 14px;
          padding: 20px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          transition: 0.2s ease;
        }

        .recruiter-application-card:hover {
          border-color: #c7d2fe;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
        }

        .candidate-selected-card {
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.12);
        }

        .candidate-selection {
          padding-top: 4px;
        }

        .candidate-selection input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .candidate-rank {
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #f3f4f6;
          color: #374151;
          font-weight: 800;
        }

        .candidate-main {
          flex: 1;
          min-width: 0;
        }

        .candidate-title-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: start;
        }

        .candidate-title-row h3 {
          margin: 0 0 5px;
          color: #111827;
        }

        .candidate-title-row p {
          margin: 0 0 4px;
          color: #6b7280;
          font-size: 14px;
        }

        .candidate-title-row small {
          color: #9ca3af;
        }

        .top-match-badge {
          padding: 7px 10px;
          border-radius: 999px;
          background: #111827;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .candidate-score-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 18px 0;
        }

        .candidate-score {
          min-width: 70px;
        }

        .candidate-score span {
          display: block;
          color: #6b7280;
          font-size: 11px;
        }

        .candidate-score strong {
          font-size: 22px;
          color: #111827;
        }

        .score-progress {
          flex: 1;
          height: 9px;
          overflow: hidden;
          border-radius: 999px;
          background: #e5e7eb;
        }

        .score-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: #111827;
          transition: width 0.3s ease;
        }

        .recommendation-badge {
          display: inline-flex;
          align-items: center;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .recommendation-strong,
        .recommendation-good {
          background: #dcfce7;
          color: #166534;
        }

        .recommendation-partial {
          background: #fef3c7;
          color: #92400e;
        }

        .recommendation-low {
          background: #fee2e2;
          color: #991b1b;
        }

        .candidate-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        .candidate-meta-grid > div {
          padding: 12px;
          border-radius: 12px;
          background: #f9fafb;
        }

        .candidate-meta-grid span {
          display: block;
          margin-bottom: 5px;
          color: #6b7280;
          font-size: 11px;
        }

        .candidate-meta-grid strong {
          color: #111827;
        }

        .status-badge {
          display: inline-flex;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }

        .status-applied {
          background: #e0f2fe;
          color: #075985;
        }

        .status-shortlisted {
          background: #ede9fe;
          color: #5b21b6;
        }

        .status-interview {
          background: #fef3c7;
          color: #92400e;
        }

        .status-selected {
          background: #dcfce7;
          color: #166534;
        }

        .status-rejected {
          background: #fee2e2;
          color: #991b1b;
        }

        .candidate-skills-preview {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .candidate-skills-preview > div > span,
        .detail-section h3 {
          display: block;
          margin-bottom: 9px;
          color: #374151;
          font-size: 13px;
          font-weight: 800;
        }

        .skill-list {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .skill-chip {
          padding: 6px 9px;
          border-radius: 8px;
          background: #f3f4f6;
          color: #374151;
          font-size: 12px;
        }

        .skill-empty {
          color: #9ca3af;
          font-size: 13px;
        }

        .candidate-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .primary-button,
        .secondary-button,
        .action-button,
        .danger-button,
        .resume-button {
          min-height: 38px;
          padding: 8px 13px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid transparent;
        }

        .primary-button {
          background: #111827;
          color: #ffffff;
        }

        .primary-button:hover:not(:disabled) {
          background: #000000;
        }

        .secondary-button {
          background: #ffffff;
          border-color: #d1d5db;
          color: #374151;
        }

        .secondary-button:hover:not(:disabled) {
          background: #f9fafb;
        }

        .action-button {
          background: #f3f4f6;
          color: #111827;
          border-color: #e5e7eb;
        }

        .action-button:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .resume-button {
          background: #111827;
          color: #ffffff;
          border-color: #111827;
        }

        .resume-button:hover:not(:disabled) {
          background: #374151;
        }

        .danger-button {
          background: #fee2e2;
          color: #991b1b;
        }

        .danger-button:hover:not(:disabled) {
          background: #fecaca;
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .empty-state {
          padding: 50px 20px;
          text-align: center;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
        }

        .empty-state h3 {
          margin-bottom: 8px;
          color: #111827;
        }

        .empty-state p {
          color: #6b7280;
        }

        .info-message {
          margin-bottom: 18px;
          padding: 12px 14px;
          border-radius: 10px;
          background: #eff6ff;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(17, 24, 39, 0.6);
        }

        .comparison-modal,
        .candidate-modal {
          width: min(1100px, 100%);
          max-height: 90vh;
          overflow-y: auto;
          background: #ffffff;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
        }

        .candidate-modal {
          width: min(760px, 100%);
        }

        .comparison-modal-header,
        .modal-header {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: start;
          margin-bottom: 20px;
        }

        .comparison-modal-header h2,
        .modal-header h2 {
          margin: 0 0 5px;
          color: #111827;
        }

        .comparison-modal-header p,
        .modal-header p {
          margin: 0;
          color: #6b7280;
        }

        .modal-close-button {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border: 0;
          border-radius: 10px;
          background: #f3f4f6;
          color: #374151;
          font-size: 24px;
          cursor: pointer;
        }

        .best-candidate-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 16px;
          margin-bottom: 20px;
          border-radius: 14px;
          background: #f3f4f6;
        }

        .best-candidate-banner span {
          display: block;
          margin-bottom: 4px;
          color: #6b7280;
          font-size: 12px;
        }

        .best-candidate-banner strong {
          color: #111827;
        }

        .best-candidate-score {
          font-size: 28px;
          font-weight: 900;
          color: #111827;
        }

        .comparison-table-wrapper {
          overflow-x: auto;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
        }

        .comparison-table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
        }

        .comparison-table th,
        .comparison-table td {
          padding: 14px;
          border-bottom: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          text-align: left;
          vertical-align: top;
        }

        .comparison-table th {
          background: #f9fafb;
          color: #111827;
          font-size: 13px;
        }

        .comparison-table td:first-child {
          width: 150px;
          background: #f9fafb;
          color: #374151;
          font-weight: 800;
        }

        .comparison-table tr:last-child td {
          border-bottom: 0;
        }

        .comparison-score-cell {
          font-size: 24px;
          font-weight: 900;
          color: #111827;
        }

        .candidate-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .detail-card {
          padding: 15px;
          border-radius: 12px;
          background: #f9fafb;
        }

        .detail-card span {
          display: block;
          margin-bottom: 6px;
          color: #6b7280;
          font-size: 12px;
        }

        .detail-card strong {
          color: #111827;
          word-break: break-word;
        }

        .resume-preview-action {
          margin-bottom: 20px;
        }

        .detail-section {
          margin-bottom: 20px;
        }

        .modal-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 24px;
        }

        .timeline-section {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .timeline-section h3 {
          margin-bottom: 16px;
        }

        .timeline-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .timeline-item {
          display: flex;
          gap: 12px;
          align-items: start;
        }

        .timeline-dot {
          width: 10px;
          height: 10px;
          flex-shrink: 0;
          margin-top: 6px;
          border-radius: 50%;
          background: #111827;
        }

        .timeline-item strong {
          color: #111827;
        }

        .timeline-item p {
          margin: 3px 0;
          color: #6b7280;
          font-size: 12px;
        }

        .timeline-item small {
          color: #6b7280;
        }

        .timeline-empty {
          color: #6b7280;
        }

        .resume-preview-overlay {
          z-index: 1100;
        }

        .resume-preview-modal {
          width: min(1200px, 100%);
          height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
        }

        .resume-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .resume-preview-header h2 {
          margin: 0 0 3px;
          color: #111827;
        }

        .resume-preview-header p {
          margin: 0 0 2px;
          color: #4b5563;
          font-size: 13px;
        }

        .resume-preview-header span {
          color: #9ca3af;
          font-size: 12px;
        }

        .resume-preview-header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .resume-viewer-container {
          position: relative;
          flex: 1;
          min-height: 0;
          background: #e5e7eb;
        }

        .resume-pdf-viewer {
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
          background: #ffffff;
        }

        .resume-loading {
          position: absolute;
          top: 16px;
          left: 50%;
          z-index: 2;
          transform: translateX(-50%);
          padding: 9px 14px;
          border-radius: 999px;
          background: #111827;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
        }

        .resume-preview-error {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 30px;
          text-align: center;
        }

        .resume-preview-error h3 {
          margin-bottom: 8px;
          color: #111827;
        }

        .resume-preview-error p {
          max-width: 500px;
          color: #6b7280;
        }

        @media (max-width: 900px) {
          .applicant-stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .candidate-skills-preview {
            grid-template-columns: 1fr;
          }

          .candidate-score-row {
            flex-wrap: wrap;
          }

          .score-progress {
            flex-basis: 100%;
            order: 3;
          }

          .comparison-toolbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .resume-preview-header {
            align-items: flex-start;
          }

          .resume-preview-header-actions {
            flex-wrap: wrap;
          }
        }

        @media (max-width: 600px) {
          .applicant-stat-grid {
            grid-template-columns: 1fr;
          }

          .applications-toolbar,
          .applicant-controls-card {
            flex-direction: column;
            align-items: stretch;
          }

          .toolbar-group,
          .status-filter-section {
            min-width: 0;
          }

          .toolbar-actions {
            margin-left: 0;
          }

          .candidate-meta-grid {
            grid-template-columns: 1fr;
          }

          .recruiter-application-card {
            padding: 15px;
          }

          .candidate-title-row {
            flex-direction: column;
          }

          .candidate-detail-grid {
            grid-template-columns: 1fr;
          }

          .comparison-toolbar-actions {
            width: 100%;
            flex-wrap: wrap;
          }

          .modal-overlay {
            padding: 10px;
          }

          .comparison-modal,
          .candidate-modal {
            padding: 16px;
          }

          .resume-preview-modal {
            height: 95vh;
            border-radius: 12px;
          }

          .resume-preview-header {
            padding: 12px;
            flex-direction: column;
          }

          .resume-preview-header-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}

export default RecruiterApplications;