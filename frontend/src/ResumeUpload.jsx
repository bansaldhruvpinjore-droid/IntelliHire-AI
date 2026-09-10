import { useEffect, useState } from "react";
import API from "./api";

function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadResumes();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const loadResumes = async () => {
    try {
      setLoadingResumes(true);

      const response = await API.get("/resumes/", {
        headers: getAuthHeaders(),
      });

      setResumes(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a resume first.");
      return;
    }

    const extension = file.name.toLowerCase().split(".").pop();

    if (extension !== "pdf" && extension !== "docx") {
      setError("Only PDF and DOCX files are allowed.");
      return;
    }

    try {
      setUploading(true);
      setMessage("");
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      await API.post(
        "/resumes/upload",
        formData,
        {
          headers: getAuthHeaders(),
        }
      );

      setMessage("Resume uploaded successfully!");
      setFile(null);

      const input = document.getElementById("resume-file");

      if (input) {
        input.value = "";
      }

      await loadResumes();

    } catch (err) {
      console.error(err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Unable to upload resume.");
      }
    } finally {
      setUploading(false);
    }
  };

  const analyzeResume = async (resume) => {
    try {
      setSelectedResume(resume);
      setAnalysis(null);
      setAnalyzing(true);
      setError("");

      const response = await API.get(
        `/resumes/${resume.id}/analysis`,
        {
          headers: getAuthHeaders(),
        }
      );

      setAnalysis(response.data);

    } catch (err) {
      console.error(err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Unable to analyze this resume.");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <section className="resume-section">

      {/* Header */}

      <div className="resume-header">

        <div>
          <span className="dashboard-label">
            INTELLIHIRE AI
          </span>

          <h1>Resume Center</h1>

          <p>
            Upload your resume and let IntelliHire AI analyze
            your skills, experience and education.
          </p>
        </div>

      </div>

      {/* Upload Area */}

      <div className="resume-upload-box">

        <div className="resume-upload-icon">
          📄
        </div>

        <h2>Upload Your Resume</h2>

        <p className="upload-description">
          Supported formats: PDF and DOCX
        </p>

        <input
          id="resume-file"
          type="file"
          accept=".pdf,.docx"
          onChange={(event) => {
            setFile(event.target.files[0]);
            setMessage("");
            setError("");
          }}
        />

        {file && (
          <div className="selected-file">
            Selected: {file.name}
          </div>
        )}

        <button
          className="primary-button"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading
            ? "Uploading..."
            : "Upload Resume"}
        </button>

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

      </div>

      {/* Existing Resumes */}

      <div className="resume-list-section">

        <div className="resume-list-header">
          <div>
            <h2>Your Resumes</h2>

            <p>
              Select a resume to view its AI analysis.
            </p>
          </div>

          <span className="resume-count">
            {resumes.length}{" "}
            {resumes.length === 1 ? "Resume" : "Resumes"}
          </span>
        </div>

        {loadingResumes ? (

          <div className="resume-loading">
            Loading your resumes...
          </div>

        ) : resumes.length === 0 ? (

          <div className="resume-empty">
            <h3>No resumes uploaded</h3>

            <p>
              Upload your first resume above to start
              using IntelliHire AI.
            </p>
          </div>

        ) : (

          <div className="resume-list">

            {resumes.map((resume) => (

              <div
                className="resume-item"
                key={resume.id}
              >

                <div className="resume-file-info">

                  <div className="resume-file-icon">
                    📄
                  </div>

                  <div>
                    <h3>{resume.filename}</h3>

                    <p>
                      Resume ID: #{resume.id}
                    </p>
                  </div>

                </div>

                <button
                  className="analysis-button"
                  onClick={() => analyzeResume(resume)}
                >
                  View AI Analysis
                </button>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* AI Analysis */}

      {selectedResume && (

        <div className="resume-analysis">

          <div className="analysis-header">

            <div>
              <span className="dashboard-label">
                AI ANALYSIS
              </span>

              <h2>
                {selectedResume.filename}
              </h2>
            </div>

            <button
              className="modal-close"
              onClick={() => {
                setSelectedResume(null);
                setAnalysis(null);
              }}
            >
              ×
            </button>

          </div>

          {analyzing ? (

            <div className="analysis-loading">
              <h3>Analyzing your resume...</h3>

              <p>
                IntelliHire AI is extracting your professional
                information.
              </p>
            </div>

          ) : analysis ? (

            <>

              {/* Summary */}

              {analysis.summary && (
                <div className="analysis-card">

                  <h3>Professional Summary</h3>

                  <p>
                    {analysis.summary}
                  </p>

                </div>
              )}

              {/* Skills */}

              <div className="analysis-card">

                <h3>Skills</h3>

                {analysis.skills?.length > 0 ? (

                  <div className="analysis-skills">

                    {analysis.skills.map(
                      (skill, index) => (
                        <span
                          className="skill-tag"
                          key={index}
                        >
                          {skill}
                        </span>
                      )
                    )}

                  </div>

                ) : (

                  <p className="analysis-muted">
                    No skills detected.
                  </p>

                )}

              </div>

              {/* Experience + Education */}

              <div className="analysis-grid">

                <div className="analysis-card">

                  <h3>Experience</h3>

                  <strong className="analysis-value">
                    {analysis.experience_years ?? 0}
                  </strong>

                  <p>
                    Years of experience
                  </p>

                </div>

                <div className="analysis-card">

                  <h3>Education</h3>

                  <p className="education-value">
                    {analysis.education ||
                      "Not detected"}
                  </p>

                </div>

              </div>

            </>

          ) : null}

        </div>

      )}

    </section>
  );
}

export default ResumeUpload;