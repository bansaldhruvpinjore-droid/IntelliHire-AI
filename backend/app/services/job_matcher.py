import re


# ============================================================
# Skill Aliases
# ============================================================

SKILL_ALIASES = {
    "postgres": "postgresql",
    "postgre": "postgresql",
    "postgres sql": "postgresql",

    "mysql database": "mysql",
    "mssql": "sql server",
    "ms sql": "sql server",
    "sqlserver": "sql server",
    "sql server": "sql server",

    "scikit learn": "scikit-learn",
    "scikit learn library": "scikit-learn",
    "sklearn": "scikit-learn",

    "nodejs": "node.js",
    "node js": "node.js",
    "node": "node.js",

    "reactjs": "react",
    "react js": "react",

    "nextjs": "next.js",
    "next js": "next.js",

    "vuejs": "vue",
    "vue js": "vue",

    "angularjs": "angular",
    "angular js": "angular",

    "typescript js": "typescript",

    "tailwindcss": "tailwind css",
    "tailwind": "tailwind css",

    "rest api": "rest",
    "rest apis": "rest",

    "restful api": "rest",
    "restful apis": "rest",

    "mongo": "mongodb",
    "mongo db": "mongodb",

    "aws cloud": "aws",
    "amazon web services": "aws",

    "google cloud platform": "gcp",
    "google cloud": "gcp",

    "microsoft azure": "azure",

    "machine learning": "machine learning",
    "ml": "machine learning",

    "artificial intelligence": "artificial intelligence",
    "ai": "artificial intelligence",

    "deep learning": "deep learning",
    "dl": "deep learning",

    "natural language processing": "nlp",

    "large language model": "llm",
    "large language models": "llm",

    "generative ai": "generative ai",
    "gen ai": "generative ai",

    "power bi": "power bi",
    "powerbi": "power bi",

    "github actions": "github actions",

    "ci cd": "ci/cd",
    "ci-cd": "ci/cd",

    "c sharp": "c#",
    "csharp": "c#",

    "cplusplus": "c++",
    "c plus plus": "c++",

    "dot net": ".net",
    "dotnet": ".net",
}


# ============================================================
# Related Skill Groups
# ============================================================
#
# These relationships are deliberately conservative.
# A related skill receives partial credit rather than being
# treated exactly the same as the required skill.
# ============================================================

RELATED_SKILLS = {
    "sql": {
        "mysql",
        "postgresql",
        "sql server",
        "sqlite",
        "oracle",
    },

    "mysql": {
        "sql",
        "postgresql",
        "sql server",
    },

    "postgresql": {
        "sql",
        "mysql",
        "sql server",
    },

    "sql server": {
        "sql",
        "mysql",
        "postgresql",
    },

    "machine learning": {
        "scikit-learn",
        "tensorflow",
        "pytorch",
        "deep learning",
        "nlp",
    },

    "deep learning": {
        "tensorflow",
        "pytorch",
        "machine learning",
    },

    "artificial intelligence": {
        "machine learning",
        "deep learning",
        "nlp",
        "llm",
        "generative ai",
    },

    "nlp": {
        "machine learning",
        "deep learning",
        "artificial intelligence",
        "llm",
    },

    "llm": {
        "generative ai",
        "nlp",
        "machine learning",
        "artificial intelligence",
    },

    "generative ai": {
        "llm",
        "nlp",
        "machine learning",
        "artificial intelligence",
    },

    "react": {
        "javascript",
        "typescript",
        "html",
        "css",
    },

    "javascript": {
        "react",
        "node.js",
        "typescript",
        "html",
        "css",
    },

    "typescript": {
        "javascript",
        "react",
        "node.js",
    },

    "node.js": {
        "javascript",
        "typescript",
        "express",
    },

    "fastapi": {
        "python",
        "rest",
        "api",
    },

    "django": {
        "python",
        "rest",
        "api",
    },

    "flask": {
        "python",
        "rest",
        "api",
    },

    "python": {
        "fastapi",
        "django",
        "flask",
        "pandas",
        "numpy",
        "scikit-learn",
    },

    "pandas": {
        "python",
        "numpy",
    },

    "numpy": {
        "python",
        "pandas",
    },

    "docker": {
        "kubernetes",
        "ci/cd",
        "aws",
        "azure",
        "gcp",
    },

    "kubernetes": {
        "docker",
        "aws",
        "azure",
        "gcp",
    },

    "aws": {
        "docker",
        "kubernetes",
        "cloud",
    },

    "azure": {
        "docker",
        "kubernetes",
        "cloud",
    },

    "gcp": {
        "docker",
        "kubernetes",
        "cloud",
    },
}


# ============================================================
# Skill Normalization
# ============================================================

def normalize_skill(skill: str) -> str:
    """
    Normalize a skill name so different spellings and aliases
    can be compared consistently.
    """

    if not skill:
        return ""

    skill = skill.lower().strip()

    # Remove common bullet characters.
    skill = re.sub(r"^[•▪◦●\-*]+\s*", "", skill)

    # Normalize whitespace.
    skill = re.sub(r"\s+", " ", skill)

    # Remove unnecessary punctuation around the skill.
    skill = skill.strip(" ,;|:")

    return SKILL_ALIASES.get(skill, skill)


# ============================================================
# Skill Extraction
# ============================================================

def normalize_skills(text: str) -> set[str]:
    """
    Convert a skill string into a normalized set.

    Supports comma, semicolon, pipe and line-separated skills.
    """

    if not text:
        return set()

    # Job skills are commonly stored using commas.
    # We also support semicolons, pipes and line breaks.
    skills = re.split(r"[,;|\n]+", text)

    normalized = set()

    for skill in skills:
        normalized_skill = normalize_skill(skill)

        if normalized_skill:
            normalized.add(normalized_skill)

    return normalized


# ============================================================
# Text Normalization
# ============================================================

def normalize_resume_text(text: str) -> str:
    """
    Normalize resume text for safer skill matching.
    """

    if not text:
        return ""

    text = text.lower()

    # Normalize common whitespace.
    text = re.sub(r"\s+", " ", text)

    return text.strip()


# ============================================================
# Skill Variations
# ============================================================

def get_skill_variations(skill: str) -> list[str]:
    """
    Return known textual variations of a normalized skill.
    """

    skill = normalize_skill(skill)

    variations = {
        "postgresql": [
            "postgresql",
            "postgres",
            "postgre",
            "postgres sql",
        ],

        "scikit-learn": [
            "scikit-learn",
            "scikit learn",
            "sklearn",
        ],

        "node.js": [
            "node.js",
            "nodejs",
            "node js",
        ],

        "react": [
            "react",
            "reactjs",
            "react js",
        ],

        "next.js": [
            "next.js",
            "nextjs",
            "next js",
        ],

        "vue": [
            "vue",
            "vuejs",
            "vue js",
        ],

        "angular": [
            "angular",
            "angularjs",
            "angular js",
        ],

        "mongodb": [
            "mongodb",
            "mongo db",
            "mongo",
        ],

        "sql server": [
            "sql server",
            "mssql",
            "ms sql",
        ],

        "c#": [
            "c#",
            "c sharp",
            "csharp",
        ],

        "c++": [
            "c++",
            "cplusplus",
            "c plus plus",
        ],

        ".net": [
            ".net",
            "dotnet",
            "dot net",
        ],

        "tailwind css": [
            "tailwind css",
            "tailwindcss",
            "tailwind",
        ],

        "power bi": [
            "power bi",
            "powerbi",
        ],

        "artificial intelligence": [
            "artificial intelligence",
            "ai",
        ],

        "machine learning": [
            "machine learning",
            "ml",
        ],

        "deep learning": [
            "deep learning",
            "dl",
        ],

        "natural language processing": [
            "natural language processing",
            "nlp",
        ],

        "generative ai": [
            "generative ai",
            "gen ai",
        ],

        "llm": [
            "llm",
            "large language model",
            "large language models",
        ],

        "ci/cd": [
            "ci/cd",
            "ci cd",
            "ci-cd",
            "continuous integration",
            "continuous deployment",
        ],

        "rest": [
            "rest",
            "rest api",
            "rest apis",
            "restful api",
            "restful apis",
        ],
    }

    return variations.get(skill, [skill])


# ============================================================
# Safe Text Matching
# ============================================================

def text_contains_skill(
    skill: str,
    resume_text: str
) -> bool:
    """
    Check whether a skill or one of its known variations
    appears in the resume.

    Word-boundary matching prevents many accidental matches.
    """

    if not skill or not resume_text:
        return False

    resume_text = normalize_resume_text(resume_text)

    for variation in get_skill_variations(skill):
        variation = variation.lower().strip()

        if not variation:
            continue

        # Special handling for one-character programming
        # languages such as C.
        if variation in {"c", "r"}:
            pattern = (
                r"(?<![a-z0-9+#])"
                + re.escape(variation)
                + r"(?![a-z0-9+#])"
            )
        else:
            pattern = (
                r"(?<!\w)"
                + re.escape(variation)
                + r"(?!\w)"
            )

        if re.search(pattern, resume_text):
            return True

    return False


# ============================================================
# Exact Skill Matching
# ============================================================

def skill_exists(
    skill: str,
    resume_text: str
) -> bool:
    """
    Check whether a required skill exists directly in the
    resume text.
    """

    return text_contains_skill(
        normalize_skill(skill),
        resume_text
    )


# ============================================================
# Related Skill Matching
# ============================================================

def related_skill_exists(
    required_skill: str,
    resume_text: str
) -> str | None:
    """
    Check whether the resume contains a related skill.

    Returns the related skill that was detected, or None.
    """

    normalized_required = normalize_skill(required_skill)

    related_skills = RELATED_SKILLS.get(
        normalized_required,
        set()
    )

    for related_skill in sorted(related_skills):
        if text_contains_skill(
            related_skill,
            resume_text
        ):
            return related_skill

    return None


# ============================================================
# Match Recommendation
# ============================================================

def get_match_recommendation(score: int) -> str:
    """
    Convert a numerical match score into a recruiter-friendly
    recommendation.
    """

    if score >= 80:
        return "Strong Match"

    if score >= 60:
        return "Good Match"

    if score >= 40:
        return "Partial Match"

    return "Low Match"


# ============================================================
# Main Matching Engine
# ============================================================

def calculate_match(
    resume_text: str,
    required_skills: str
) -> dict:
    """
    Compare resume content against required job skills.

    Matching levels:

    Exact Match
        Full credit.

    Related Match
        Partial credit because the resume contains a
        technically related skill.

    Missing
        No credit.
    """

    job_skills = normalize_skills(required_skills)

    resume_text = normalize_resume_text(resume_text)

    matched_skills = []
    missing_skills = []

    exact_matches = []
    related_matches = []

    for skill in sorted(job_skills):

        # ----------------------------------------------------
        # Exact Match
        # ----------------------------------------------------

        if skill_exists(
            skill,
            resume_text
        ):
            matched_skills.append(skill)
            exact_matches.append(skill)
            continue

        # ----------------------------------------------------
        # Related Match
        # ----------------------------------------------------

        related_skill = related_skill_exists(
            skill,
            resume_text
        )

        if related_skill:
            matched_skills.append(skill)
            related_matches.append({
                "required_skill": skill,
                "related_skill": related_skill
            })
            continue

        # ----------------------------------------------------
        # Missing Skill
        # ----------------------------------------------------

        missing_skills.append(skill)

    total_skills = len(job_skills)

    # --------------------------------------------------------
    # Weighted Match Score
    # --------------------------------------------------------
    #
    # Exact match   = 1.0
    # Related match = 0.5
    # Missing       = 0.0
    #
    # This prevents a related technology from being treated
    # exactly the same as the required technology.
    # --------------------------------------------------------

    if total_skills == 0:
        match_score = 0
    else:
        exact_weight = len(exact_matches) * 1.0
        related_weight = len(related_matches) * 0.5

        weighted_score = (
            exact_weight + related_weight
        ) / total_skills

        match_score = round(
            weighted_score * 100
        )

    recommendation = get_match_recommendation(
        match_score
    )

    # --------------------------------------------------------
    # Match Statistics
    # --------------------------------------------------------

    exact_match_count = len(exact_matches)
    related_match_count = len(related_matches)
    missing_match_count = len(missing_skills)

    if total_skills == 0:
        skill_coverage = 0
    else:
        skill_coverage = round(
            (
                exact_match_count +
                related_match_count
            )
            / total_skills
            * 100
        )

    return {
        "match_score": match_score,

        "matched_skills": sorted(
            matched_skills
        ),

        "missing_skills": sorted(
            missing_skills
        ),

        "exact_matches": sorted(
            exact_matches
        ),

        "related_matches": related_matches,

        "exact_match_count": exact_match_count,

        "related_match_count": related_match_count,

        "missing_match_count": missing_match_count,

        "total_required_skills": total_skills,

        "skill_coverage": skill_coverage,

        "recommendation": recommendation,
    }