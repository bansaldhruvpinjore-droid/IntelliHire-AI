import { useState } from "react";
import API from "./api";

function CreateJob({ onJobCreated }) {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    experience: "",
    salary: "",
    description: "",
    required_skills: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await API.post(
        "/jobs/",
        {
          title: formData.title,
          company: formData.company,
          location: formData.location,
          experience: formData.experience || null,
          salary: formData.salary || null,
          description: formData.description,
          required_skills: formData.required_skills || null,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      setMessage(
        `Job "${response.data.title}" created successfully.`
      );

      setFormData({
        title: "",
        company: "",
        location: "",
        experience: "",
        salary: "",
        description: "",
        required_skills: "",
      });

      if (onJobCreated) {
        onJobCreated(response.data);
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to create job."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recruiter-page">

      <div className="recruiter-header">
        <div>
          <span className="dashboard-label">
            INTELLIHIRE AI
          </span>

          <h1>Create Job Opening</h1>

          <p>
            Publish a new job and start receiving
            qualified candidate applications.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      <div className="create-job-card">

        <form onSubmit={handleSubmit}>

          <div className="form-grid">

            <div className="form-group">
              <label>Job Title</label>

              <input
                type="text"
                name="title"
                placeholder="e.g. AI Python Developer"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Company</label>

              <input
                type="text"
                name="company"
                placeholder="e.g. IntelliHire Technologies"
                value={formData.company}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Location</label>

              <input
                type="text"
                name="location"
                placeholder="e.g. Chandigarh / Remote"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Experience</label>

              <input
                type="text"
                name="experience"
                placeholder="e.g. 0-2 years"
                value={formData.experience}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Salary</label>

              <input
                type="text"
                name="salary"
                placeholder="e.g. ₹5-8 LPA"
                value={formData.salary}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Required Skills</label>

              <input
                type="text"
                name="required_skills"
                placeholder="Python, FastAPI, SQL, Machine Learning"
                value={formData.required_skills}
                onChange={handleChange}
              />
            </div>

          </div>

          <div className="form-group">

            <label>Job Description</label>

            <textarea
              name="description"
              placeholder="Describe the role, responsibilities and requirements..."
              value={formData.description}
              onChange={handleChange}
              rows="7"
              required
            />

          </div>

          <div className="create-job-actions">

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating Job..."
                : "Create Job Opening"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default CreateJob;