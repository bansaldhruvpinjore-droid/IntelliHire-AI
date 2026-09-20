\# IntelliHire AI – Smart Recruitment Platform



IntelliHire AI is a full-stack recruitment platform designed to simplify the hiring process for candidates and recruiters. It provides job posting, resume management, application tracking, and resume-to-job matching features through a role-based web application.



\## Key Features



\### Candidate



\* Register and log in securely.

\* Upload and manage resumes.

\* Browse and search job listings.

\* View resume-to-job match results.

\* Apply for jobs and track applications.

\* Receive application status notifications.



\### Recruiter



\* Create and manage job postings.

\* View applicants for recruiter-owned jobs.

\* Review candidate applications.

\* View application match scores and skill comparisons.

\* Update application statuses.

\* Review applicant status history and analytics.



\## Technology Stack



\### Frontend



\* React

\* Vite

\* JavaScript

\* Axios

\* React Router



\### Backend



\* Python

\* FastAPI

\* SQLAlchemy

\* Pydantic

\* JWT-based authentication



\### Database \& Tools



\* PostgreSQL (Neon)

\* Alembic

\* Git and GitHub



\## Project Architecture



The application follows a frontend-backend architecture.



1\. The React frontend provides the candidate and recruiter interfaces.

2\. Axios sends HTTP requests to the FastAPI backend.

3\. FastAPI routes handle authentication, jobs, resumes, applications, and notifications.

4\. SQLAlchemy communicates with the PostgreSQL database.

5\. JWT authentication protects authorized endpoints.

6\. The matching service compares resume skills with job requirements.



\## Project Structure



```text

IntelliHire-AI/

├── backend/

│   ├── app/

│   │   ├── models/

│   │   ├── routes/

│   │   ├── schemas/

│   │   ├── services/

│   │   ├── database.py

│   │   └── main.py

│   ├── alembic/

│   ├── uploads/

│   └── requirements.txt

│

├── frontend/

│   ├── src/

│   │   ├── App.jsx

│   │   ├── api.js

│   │   └── ...

│   └── package.json

│

├── .gitignore

├── .env.example

└── README.md

```



\## Getting Started



\### Prerequisites



\* Python 3.9 or later

\* Node.js and npm

\* PostgreSQL database (Neon can be used)

\* Git



\### 1. Clone the repository



```bash

git clone https://github.com/bansaldhruvpinjore-droid/IntelliHire-AI.git

cd IntelliHire-AI

```



\### 2. Configure the backend



```powershell

cd backend

python -m venv venv

.\\venv\\Scripts\\Activate.ps1

pip install -r requirements.txt

```



Create a `.env` file inside the `backend` folder using `.env.example` as a reference. Fill in your own database connection string and authentication secret.



\### 3. Start the backend



From the `backend` directory:



```powershell

uvicorn app.main:app --reload

```



Backend API:



http://127.0.0.1:8000



Interactive API documentation:



http://127.0.0.1:8000/docs



\### 4. Start the frontend



Open a second terminal:



```powershell

cd D:\\IntelliHire-AI\\frontend

npm install

npm run dev

```



Open the local URL printed by Vite in the terminal.



\## Environment Configuration



The backend requires environment variables for database connectivity and authentication.



Refer to `.env.example` for the variable names. Never commit real credentials, database URLs, JWT secrets, or private user data.



\## API Modules



| Module         | Purpose                                          |

| -------------- | ------------------------------------------------ |

| Authentication | Registration and login                           |

| Users          | User profile and account information             |

| Resumes        | Resume upload, listing, and analysis             |

| Jobs           | Job creation, listing, search, and matching      |

| Applications   | Applying, status updates, history, and analytics |

| Notifications  | Candidate application notifications              |



Refer to FastAPI Swagger documentation at `/docs` for available endpoints and request schemas.



\## Security



\* Passwords are stored using password hashing.

\* JWT authentication is used for protected endpoints.

\* Role-based access controls candidate and recruiter operations.

\* Resume access is restricted by authorization rules.

\* Secrets and environment configuration must remain outside version control.



\## Current Scope \& Future Improvements



The platform includes resume-to-job matching based on skills and matching rules. Future improvements may include semantic embeddings, LLM-assisted resume analysis, automated testing, deployment, and additional production-readiness features.



\## Author



Dhruv Gupta



MCA | AI \& Machine Learning

GitHub: https://github.com/bansaldhruvpinjore-droid

