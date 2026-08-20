import re


def normalize_skill(skill: str) -> str:
    """
    Normalize a skill name for comparison.
    """
    skill = skill.lower().strip()

    aliases = {
        "postgres": "postgresql",
        "postgre": "postgresql",
        "scikit learn": "scikit-learn",
        "sklearn": "scikit-learn",
        "nodejs": "node.js",
        "node js": "node.js",
        "reactjs": "react",
    }

    return aliases.get(skill, skill)


def normalize_skills(text: str) -> set[str]:
    """
    Convert comma-separated skills into a normalized set.
    """
    if not text:
        return set()

    skills = text.split(",")

    return {
        normalize_skill(skill)
        for skill in skills
        if skill.strip()
    }


def skill_exists(skill: str, resume_text: str) -> bool:
    """
    Check whether a skill exists in the resume text.
    """
    resume_text = resume_text.lower()

    # Special handling for common variations
    aliases = {
        "postgresql": ["postgresql", "postgres", "postgre"],
        "scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
        "node.js": ["node.js", "nodejs", "node js"],
        "react": ["react", "reactjs"],
    }

    possible_names = aliases.get(skill, [skill])

    for name in possible_names:
        pattern = r"(?<!\w)" + re.escape(name) + r"(?!\w)"

        if re.search(pattern, resume_text):
            return True

    return False


def calculate_match(resume_text: str, required_skills: str) -> dict:
    """
    Compare resume skills against the skills required by a job.
    """

    job_skills = normalize_skills(required_skills)

    matched_skills = []
    missing_skills = []

    for skill in job_skills:
        if skill_exists(skill, resume_text):
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    total_skills = len(job_skills)

    if total_skills == 0:
        match_score = 0
    else:
        match_score = round(
            (len(matched_skills) / total_skills) * 100
        )

    return {
        "match_score": match_score,
        "matched_skills": sorted(matched_skills),
        "missing_skills": sorted(missing_skills),
    }