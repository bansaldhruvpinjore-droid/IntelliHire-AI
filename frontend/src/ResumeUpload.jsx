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

  const getSkillsCount = () => {
    if (!analysis?.skills) {
      return 0;
    }

    if (Array.isArray(analysis.skills)) {
      return analysis.skills.length;
    }

    if (typeof analysis.skills === "string") {
      return analysis.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean).length;
    }

    return 0;
  };

  const calculateResumeScore = () => {
    if (!analysis) {
      return 0;
    }

    let score = 0;

    if (
      analysis.summary &&
      String(analysis.summary).trim().length > 20
    ) {
      score += 25;
    }

    const skillsCount = getSkillsCount();

    if (skillsCount >= 5) {
      score += 30;
    } else if (skillsCount >= 3) {
      score += 20;
    } else if (skillsCount >= 1) {
      score += 10;
    }

    if (
      analysis.experience_years !== null &&
      analysis.experience_years !== undefined
    ) {
      score += 20;
    }

    if (
      analysis.education &&
      String(analysis.education).trim().length > 0
    ) {
      score += 25;
    }

    return Math.min(score, 100);
  };

  const getScoreLabel = (score) => {
    if (score >= 80) {
      return "Strong Resume";
    }

    if (score >= 60) {
      return "Good Resume";
    }

    if (score >= 40) {
      return "Needs Improvement";
    }

    return "Early Stage";
  };

  const getScoreClass = (score) => {
    if (score >= 80) {
      return "score-strong";
    }

    if (score >= 60) {
      return "score-good";
    }

    if (score >= 40) {
      return "score-improve";
    }

    return "score-early";
  };

  const getSkillLevel = () => {
    const count = getSkillsCount();

    if (count >= 8) {
      return "Excellent";
    }

    if (count >= 5) {
      return "Good";
    }

    if (count >= 3) {
      return "Moderate";
    }

    return "Limited";
  };

  const getSkillCoveragePercentage = () => {
    const count = getSkillsCount();

    return Math.min(Math.round((count / 10) * 100), 100);
  };

  const getScoreBreakdown = () => {
    const skillsCount = getSkillsCount();

    return {
      summary:
        analysis?.summary &&
        String(analysis.summary).trim().length > 20
          ? 25
          : 0,

      skills:
        skillsCount >= 5
          ? 30
          : skillsCount >= 3
            ? 20
            : skillsCount >= 1
              ? 10
              : 0,

      experience:
        analysis?.experience_years !== null &&
        analysis?.experience_years !== undefined
          ? 20
          : 0,

      education:
        analysis?.education &&
        String(analysis.education).trim().length > 0
          ? 25
          : 0,
    };
  };

  /*
   * -------------------------------------------------------
   * Resume Intelligence
   * -------------------------------------------------------
   */

  const getResumeStrengths = () => {
    if (!analysis) {
      return [];
    }

    const strengths = [];
    const skillsCount = getSkillsCount();

    if (
      analysis.summary &&
      String(analysis.summary).trim().length > 20
    ) {
      strengths.push({
        title: "Professional Summary",
        description:
          "Your resume contains a meaningful professional summary that helps recruiters quickly understand your profile.",
      });
    }

    if (skillsCount >= 5) {
      strengths.push({
        title: "Strong Skill Coverage",
        description:
          `Your resume contains ${skillsCount} identified skills, giving recruiters a broader view of your technical capabilities.`,
      });
    } else if (skillsCount >= 3) {
      strengths.push({
        title: "Good Skill Foundation",
        description:
          `Your resume contains ${skillsCount} identified skills and provides a reasonable technical foundation.`,
      });
    }

    if (
      analysis.experience_years !== null &&
      analysis.experience_years !== undefined
    ) {
      strengths.push({
        title: "Experience Information",
        description:
          "Your resume includes experience information, making your professional background easier to evaluate.",
      });
    }

    if (
      analysis.education &&
      String(analysis.education).trim().length > 0
    ) {
      strengths.push({
        title: "Education Information",
        description:
          "Your educational background is present and can help recruiters understand your academic qualifications.",
      });
    }

    if (strengths.length === 0) {
      strengths.push({
        title: "Resume Uploaded",
        description:
          "Your resume has been successfully uploaded and analyzed. Add more structured information to improve its overall strength.",
      });
    }

    return strengths;
  };

  const getImprovementAreas = () => {
    if (!analysis) {
      return [];
    }

    const improvements = [];
    const skillsCount = getSkillsCount();

    if (
      !analysis.summary ||
      String(analysis.summary).trim().length <= 20
    ) {
      improvements.push({
        title: "Add a Professional Summary",
        description:
          "A concise summary can quickly communicate your career direction, core skills, and value to recruiters.",
        priority: "High",
      });
    }

    if (skillsCount < 5) {
      improvements.push({
        title: "Expand Your Skills Section",
        description:
          "Consider adding relevant technical skills, tools, frameworks, databases, and technologies that you genuinely know.",
        priority: skillsCount < 3 ? "High" : "Medium",
      });
    }

    if (
      analysis.experience_years === null ||
      analysis.experience_years === undefined
    ) {
      improvements.push({
        title: "Add Experience Details",
        description:
          "Include internships, projects, freelance work, or professional experience where applicable.",
        priority: "Medium",
      });
    }

    if (
      !analysis.education ||
      String(analysis.education).trim().length === 0
    ) {
      improvements.push({
        title: "Add Education Details",
        description:
          "Include your degree, institution, specialization, and relevant academic information.",
        priority: "Medium",
      });
    }

    if (improvements.length === 0) {
      improvements.push({
        title: "Continue Optimizing",
        description:
          "Your resume currently covers the main analyzed sections. Continue tailoring it to each job description.",
        priority: "Low",
      });
    }

    return improvements;
  };

  const getRecommendations = () => {
    if (!analysis) {
      return [];
    }

    const recommendations = [];
    const skillsCount = getSkillsCount();

    if (skillsCount < 5) {
      recommendations.push(
        "Add relevant technical skills from the job descriptions you are targeting, but only include skills you genuinely understand."
      );
    }

    if (
      !analysis.summary ||
      String(analysis.summary).trim().length <= 20
    ) {
      recommendations.push(
        "Create a 2–4 line professional summary focused on your target role and strongest capabilities."
      );
    }

    if (
      analysis.experience_years === null ||
      analysis.experience_years === undefined
    ) {
      recommendations.push(
        "Highlight meaningful projects, internships, certifications, or practical work if you have limited professional experience."
      );
    }

    if (
      !analysis.education ||
      String(analysis.education).trim().length === 0
    ) {
      recommendations.push(
        "Add your current degree and relevant academic details so recruiters can quickly verify your educational background."
      );
    }

    recommendations.push(
      "Customize your resume for each target job by emphasizing the skills and experience most relevant to that position."
    );

    recommendations.push(
      "Use measurable results in project and experience descriptions whenever possible, such as performance improvements, users served, or features delivered."
    );

    return recommendations.slice(0, 5);
  };

  const resumeScore = calculateResumeScore();
  const scoreBreakdown = getScoreBreakdown();
  const resumeStrengths = getResumeStrengths();
  const improvementAreas = getImprovementAreas();
  const recommendations = getRecommendations();

  return (
    <>
      <section className="resume-section">
        <div className="resume-header">
          <div>
            <span className="dashboard-label">
              INTELLIHIRE AI
            </span>

            <h1>Resume Center</h1>

            <p>
              Upload your resume and get an intelligent
              analysis of your skills, experience, and
              career readiness.
            </p>
          </div>
        </div>

        <div className="resume-upload-card">
          <h2>Upload Resume</h2>

          <p>
            Supported formats: PDF and DOCX
          </p>

          <div className="resume-upload-row">
            <input
              id="resume-file"
              type="file"
              accept=".pdf,.docx"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setMessage("");
                setError("");
              }}
            />

            <button
              className="primary-button"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading
                ? "Uploading..."
                : "Upload Resume"}
            </button>
          </div>

          {file && (
            <div className="selected-file">
              Selected: <strong>{file.name}</strong>
            </div>
          )}

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

        <div className="resume-list-card">
          <div className="section-heading">
            <div>
              <h2>Your Resumes</h2>
              <p>
                Select a resume to view its analysis.
              </p>
            </div>
          </div>

          {loadingResumes ? (
            <div className="loading-message">
              Loading your resumes...
            </div>
          ) : resumes.length === 0 ? (
            <div className="empty-state">
              <h3>No resumes uploaded</h3>

              <p>
                Upload your first resume to start the
                analysis.
              </p>
            </div>
          ) : (
            <div className="resume-list">
              {resumes.map((resume) => (
                <div
                  className={`resume-item ${
                    selectedResume?.id === resume.id
                      ? "resume-item-selected"
                      : ""
                  }`}
                  key={resume.id}
                >
                  <div>
                    <strong>
                      {resume.filename ||
                        resume.file_name ||
                        `Resume #${resume.id}`}
                    </strong>

                    {resume.created_at && (
                      <span>
                        Uploaded{" "}
                        {new Date(
                          resume.created_at
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <button
                    className="secondary-button"
                    onClick={() =>
                      analyzeResume(resume)
                    }
                  >
                    Analyze Resume
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {analyzing && (
          <div className="analysis-loading-card">
            <div className="loading-spinner"></div>

            <div>
              <h3>Analyzing Resume...</h3>

              <p>
                IntelliHire AI is processing your resume
                information.
              </p>
            </div>
          </div>
        )}

        {analysis && !analyzing && (
          <div className="resume-analysis">

            {/* -----------------------------------------
                Resume Overview
            ----------------------------------------- */}

            <div className="analysis-card resume-overview-card">
              <div className="analysis-card-header">
                <div>
                  <span className="analysis-label">
                    RESUME INTELLIGENCE
                  </span>

                  <h2>Resume Readiness</h2>

                  <p>
                    A structured overview of your current
                    resume strength.
                  </p>
                </div>
              </div>

              <div className="resume-overview-grid">
                <div className="resume-score-panel">
                  <div
                    className={`resume-score-circle ${getScoreClass(
                      resumeScore
                    )}`}
                  >
                    <strong>{resumeScore}</strong>
                    <span>/100</span>
                  </div>

                  <h3>
                    {getScoreLabel(resumeScore)}
                  </h3>

                  <p>
                    Resume Readiness Score
                  </p>
                </div>

                <div className="resume-stat-grid">
                  <div className="resume-stat-card">
                    <span>Skills</span>
                    <strong>
                      {getSkillsCount()}
                    </strong>
                  </div>

                  <div className="resume-stat-card">
                    <span>Experience</span>
                    <strong>
                      {analysis.experience_years ??
                        0}
                    </strong>
                  </div>

                  <div className="resume-stat-card">
                    <span>Education</span>
                    <strong>
                      {analysis.education
                        ? "Added"
                        : "Missing"}
                    </strong>
                  </div>

                  <div className="resume-stat-card">
                    <span>Summary</span>
                    <strong>
                      {analysis.summary
                        ? "Added"
                        : "Missing"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* -----------------------------------------
                Score Breakdown
            ----------------------------------------- */}

            <div className="analysis-card">
              <div className="analysis-card-header">
                <div>
                  <span className="analysis-label">
                    SCORE ANALYSIS
                  </span>

                  <h2>Resume Score Breakdown</h2>

                  <p>
                    See which resume sections contribute
                    to your readiness score.
                  </p>
                </div>
              </div>

              <div className="score-breakdown">
                <div className="score-breakdown-item">
                  <div className="score-breakdown-header">
                    <span>Professional Summary</span>
                    <strong>
                      {scoreBreakdown.summary}/25
                    </strong>
                  </div>

                  <div className="score-progress">
                    <div
                      style={{
                        width: `${
                          (scoreBreakdown.summary /
                            25) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="score-breakdown-item">
                  <div className="score-breakdown-header">
                    <span>Skills</span>
                    <strong>
                      {scoreBreakdown.skills}/30
                    </strong>
                  </div>

                  <div className="score-progress">
                    <div
                      style={{
                        width: `${
                          (scoreBreakdown.skills /
                            30) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="score-breakdown-item">
                  <div className="score-breakdown-header">
                    <span>Experience</span>
                    <strong>
                      {scoreBreakdown.experience}/20
                    </strong>
                  </div>

                  <div className="score-progress">
                    <div
                      style={{
                        width: `${
                          (scoreBreakdown.experience /
                            20) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="score-breakdown-item">
                  <div className="score-breakdown-header">
                    <span>Education</span>
                    <strong>
                      {scoreBreakdown.education}/25
                    </strong>
                  </div>

                  <div className="score-progress">
                    <div
                      style={{
                        width: `${
                          (scoreBreakdown.education /
                            25) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* -----------------------------------------
                Skills Intelligence
            ----------------------------------------- */}

            <div className="analysis-card">
              <div className="analysis-card-header">
                <div>
                  <span className="analysis-label">
                    SKILLS INTELLIGENCE
                  </span>

                  <h2>Skills Intelligence</h2>

                  <p>
                    An overview of your detected skill
                    coverage.
                  </p>
                </div>
              </div>

              <div className="skills-intelligence">
                <div className="skill-intelligence-summary">
                  <div>
                    <span>Skill Level</span>

                    <strong>
                      {getSkillLevel()}
                    </strong>
                  </div>

                  <div>
                    <span>Skills Detected</span>

                    <strong>
                      {getSkillsCount()}
                    </strong>
                  </div>

                  <div>
                    <span>Coverage</span>

                    <strong>
                      {getSkillCoveragePercentage()}%
                    </strong>
                  </div>
                </div>

                <div className="skill-coverage">
                  <div className="skill-coverage-header">
                    <span>
                      Skill Coverage
                    </span>

                    <strong>
                      {getSkillCoveragePercentage()}%
                    </strong>
                  </div>

                  <div className="skill-coverage-background">
                    <div
                      style={{
                        width: `${getSkillCoveragePercentage()}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="skills-list">
                  {Array.isArray(analysis.skills) ? (
                    analysis.skills.map(
                      (skill, index) => (
                        <span
                          className="skill-tag"
                          key={`${skill}-${index}`}
                        >
                          {skill}
                        </span>
                      )
                    )
                  ) : typeof analysis.skills ===
                    "string" ? (
                    analysis.skills
                      .split(",")
                      .map((skill, index) => (
                        <span
                          className="skill-tag"
                          key={`${skill}-${index}`}
                        >
                          {skill.trim()}
                        </span>
                      ))
                  ) : (
                    <span className="no-data">
                      No skills detected.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* -----------------------------------------
                Strengths
            ----------------------------------------- */}

            <div className="analysis-card resume-strengths-card">
              <div className="analysis-card-header">
                <div>
                  <span className="analysis-label">
                    RESUME STRENGTHS
                  </span>

                  <h2>
                    What Your Resume Does Well
                  </h2>

                  <p>
                    Positive areas identified from the
                    available resume analysis.
                  </p>
                </div>
              </div>

              <div className="resume-insights-grid">
                {resumeStrengths.map(
                  (strength, index) => (
                    <div
                      className="resume-insight-card strength-card"
                      key={index}
                    >
                      <div className="insight-icon">
                        ✓
                      </div>

                      <div>
                        <h3>{strength.title}</h3>

                        <p>
                          {strength.description}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* -----------------------------------------
                Improvement Areas
            ----------------------------------------- */}

            <div className="analysis-card">
              <div className="analysis-card-header">
                <div>
                  <span className="analysis-label">
                    IMPROVEMENT AREAS
                  </span>

                  <h2>
                    Where Your Resume Can Improve
                  </h2>

                  <p>
                    Areas that could make your resume
                    stronger for recruitment.
                  </p>
                </div>
              </div>

              <div className="resume-insights-grid">
                {improvementAreas.map(
                  (item, index) => (
                    <div
                      className="resume-insight-card improvement-card"
                      key={index}
                    >
                      <div className="insight-icon">
                        !
                      </div>

                      <div className="insight-content">
                        <div className="insight-title-row">
                          <h3>{item.title}</h3>

                          <span
                            className={`priority-badge priority-${item.priority.toLowerCase()}`}
                          >
                            {item.priority}
                          </span>
                        </div>

                        <p>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* -----------------------------------------
                Recommendations
            ----------------------------------------- */}

            <div className="analysis-card recommendation-card">
              <div className="analysis-card-header">
                <div>
                  <span className="analysis-label">
                    AI CAREER GUIDANCE
                  </span>

                  <h2>
                    Resume Improvement Recommendations
                  </h2>

                  <p>
                    Practical actions you can take to
                    improve your resume.
                  </p>
                </div>
              </div>

              <div className="recommendations-list">
                {recommendations.map(
                  (recommendation, index) => (
                    <div
                      className="recommendation-item"
                      key={index}
                    >
                      <div className="recommendation-number">
                        {index + 1}
                      </div>

                      <p>{recommendation}</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* -----------------------------------------
                Professional Summary
            ----------------------------------------- */}

            <div className="analysis-card">
              <div className="analysis-card-header">
                <div>
                  <span className="analysis-label">
                    PROFESSIONAL SUMMARY
                  </span>

                  <h2>Resume Summary</h2>
                </div>
              </div>

              <div className="analysis-text">
                {analysis.summary ? (
                  <p>{analysis.summary}</p>
                ) : (
                  <div className="no-data">
                    No professional summary detected.
                  </div>
                )}
              </div>
            </div>

            {/* -----------------------------------------
                Experience & Education
            ----------------------------------------- */}

            <div className="analysis-two-column">

              <div className="analysis-card">
                <div className="analysis-card-header">
                  <div>
                    <span className="analysis-label">
                      EXPERIENCE
                    </span>

                    <h2>Experience</h2>
                  </div>
                </div>

                <div className="analysis-highlight">
                  <strong>
                    {analysis.experience_years ??
                      0}
                  </strong>

                  <span>
                    Years of Experience
                  </span>
                </div>
              </div>

              <div className="analysis-card">
                <div className="analysis-card-header">
                  <div>
                    <span className="analysis-label">
                      EDUCATION
                    </span>

                    <h2>Education</h2>
                  </div>
                </div>

                <div className="analysis-text">
                  {analysis.education ? (
                    <p>{analysis.education}</p>
                  ) : (
                    <div className="no-data">
                      No education information detected.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </section>

      <style>{`
        .resume-section {
          max-width: 1180px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }

        .resume-header {
          margin-bottom: 28px;
        }

        .dashboard-label {
          display: inline-block;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .1em;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .resume-header h1 {
          margin: 0;
          font-size: 34px;
          color: #111827;
        }

        .resume-header p {
          margin-top: 10px;
          max-width: 720px;
          color: #6b7280;
          line-height: 1.6;
        }

        .resume-upload-card,
        .resume-list-card,
        .analysis-card,
        .analysis-loading-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, .06);
        }

        .resume-upload-card,
        .resume-list-card,
        .analysis-card {
          padding: 26px;
          margin-top: 20px;
        }

        .resume-upload-card h2,
        .resume-list-card h2,
        .analysis-card h2 {
          margin: 0;
          color: #111827;
        }

        .resume-upload-card > p,
        .section-heading p,
        .analysis-card-header p {
          color: #6b7280;
          line-height: 1.6;
        }

        .resume-upload-row {
          display: flex;
          gap: 14px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        .resume-upload-row input {
          flex: 1;
          min-width: 260px;
        }

        .primary-button,
        .secondary-button {
          border: none;
          border-radius: 10px;
          padding: 11px 18px;
          font-weight: 700;
          cursor: pointer;
        }

        .primary-button {
          background: #111827;
          color: #fff;
        }

        .secondary-button {
          background: #f3f4f6;
          color: #111827;
        }

        .primary-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .selected-file {
          margin-top: 14px;
          color: #374151;
          font-size: 14px;
        }

        .success-message,
        .error-message {
          margin-top: 14px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 14px;
        }

        .success-message {
          background: #ecfdf5;
          color: #047857;
        }

        .error-message {
          background: #fef2f2;
          color: #b91c1c;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .resume-list {
          display: grid;
          gap: 12px;
          margin-top: 20px;
        }

        .resume-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          transition: .2s ease;
        }

        .resume-item-selected {
          border-color: #9ca3af;
          box-shadow: 0 4px 12px rgba(15, 23, 42, .06);
        }

        .resume-item strong {
          display: block;
          color: #111827;
        }

        .resume-item span {
          display: block;
          margin-top: 5px;
          color: #6b7280;
          font-size: 13px;
        }

        .loading-message,
        .empty-state,
        .no-data {
          padding: 24px 0;
          color: #6b7280;
        }

        .empty-state h3 {
          color: #111827;
          margin-bottom: 6px;
        }

        .analysis-loading-card {
          margin-top: 20px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .analysis-loading-card h3 {
          margin: 0 0 5px;
          color: #111827;
        }

        .analysis-loading-card p {
          margin: 0;
          color: #6b7280;
        }

        .loading-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid #e5e7eb;
          border-top-color: #111827;
          border-radius: 50%;
          animation: resume-spin .8s linear infinite;
        }

        @keyframes resume-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .analysis-label {
          display: inline-block;
          margin-bottom: 7px;
          color: #6b7280;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .1em;
        }

        .analysis-card-header p {
          margin-bottom: 0;
        }

        .resume-overview-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 28px;
          margin-top: 26px;
        }

        .resume-score-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #f8fafc;
        }

        .resume-score-circle {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 10px solid #e5e7eb;
          background: #fff;
        }

        .resume-score-circle strong {
          font-size: 42px;
          line-height: 1;
          color: #111827;
        }

        .resume-score-circle span {
          margin-top: 6px;
          color: #6b7280;
          font-size: 13px;
        }

        .score-strong {
          border-color: #16a34a;
        }

        .score-good {
          border-color: #2563eb;
        }

        .score-improve {
          border-color: #d97706;
        }

        .score-early {
          border-color: #dc2626;
        }

        .resume-score-panel h3 {
          margin: 18px 0 4px;
          color: #111827;
        }

        .resume-score-panel p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
        }

        .resume-stat-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .resume-stat-card {
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #f8fafc;
        }

        .resume-stat-card span {
          display: block;
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .resume-stat-card strong {
          font-size: 24px;
          color: #111827;
        }

        .score-breakdown {
          display: grid;
          gap: 20px;
          margin-top: 24px;
        }

        .score-breakdown-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 8px;
          color: #374151;
          font-size: 14px;
        }

        .score-breakdown-header strong {
          color: #111827;
        }

        .score-progress,
        .skill-coverage-background {
          width: 100%;
          height: 10px;
          overflow: hidden;
          background: #e5e7eb;
          border-radius: 999px;
        }

        .score-progress div,
        .skill-coverage-background div {
          height: 100%;
          background: #111827;
          border-radius: 999px;
          transition: width .4s ease;
        }

        .skills-intelligence {
          margin-top: 24px;
        }

        .skill-intelligence-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .skill-intelligence-summary > div {
          padding: 18px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
        }

        .skill-intelligence-summary span {
          display: block;
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 7px;
        }

        .skill-intelligence-summary strong {
          font-size: 23px;
          color: #111827;
        }

        .skill-coverage {
          margin-top: 24px;
        }

        .skill-coverage-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          color: #374151;
          font-size: 13px;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 22px;
        }

        .skill-tag {
          padding: 8px 12px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          color: #374151;
          font-size: 13px;
          font-weight: 600;
        }

        .resume-insights-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-top: 24px;
        }

        .resume-insight-card {
          display: flex;
          gap: 14px;
          padding: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #f8fafc;
        }

        .insight-icon {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #111827;
          color: #fff;
          font-weight: 800;
        }

        .resume-insight-card h3 {
          margin: 2px 0 7px;
          color: #111827;
          font-size: 16px;
        }

        .resume-insight-card p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.6;
        }

        .insight-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .priority-badge {
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .04em;
        }

        .priority-high {
          background: #fee2e2;
          color: #b91c1c;
        }

        .priority-medium {
          background: #fef3c7;
          color: #92400e;
        }

        .priority-low {
          background: #e5e7eb;
          color: #374151;
        }

        .recommendation-card {
          background: #fafafa;
        }

        .recommendations-list {
          display: grid;
          gap: 12px;
          margin-top: 24px;
        }

        .recommendation-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }

        .recommendation-number {
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #111827;
          color: #fff;
          font-size: 13px;
          font-weight: 800;
        }

        .recommendation-item p {
          margin: 5px 0 0;
          color: #374151;
          line-height: 1.6;
          font-size: 14px;
        }

        .analysis-text {
          margin-top: 20px;
          padding: 18px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }

        .analysis-text p {
          margin: 0;
          color: #374151;
          line-height: 1.7;
        }

        .analysis-two-column {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .analysis-highlight {
          margin-top: 20px;
          padding: 22px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          text-align: center;
        }

        .analysis-highlight strong {
          display: block;
          font-size: 34px;
          color: #111827;
        }

        .analysis-highlight span {
          display: block;
          margin-top: 6px;
          color: #6b7280;
          font-size: 13px;
        }

        @media (max-width: 900px) {
          .resume-overview-grid {
            grid-template-columns: 1fr;
          }

          .resume-insights-grid {
            grid-template-columns: 1fr;
          }

          .analysis-two-column {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .resume-section {
            padding: 28px 16px 60px;
          }

          .resume-header h1 {
            font-size: 28px;
          }

          .resume-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .resume-stat-grid,
          .skill-intelligence-summary {
            grid-template-columns: 1fr;
          }

          .resume-upload-row {
            flex-direction: column;
            align-items: stretch;
          }

          .resume-upload-row input {
            min-width: 0;
          }

          .primary-button {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

export default ResumeUpload;