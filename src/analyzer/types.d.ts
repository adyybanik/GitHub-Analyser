/**
 * @typedef {Object} CandidateProfile
 * @property {string} username - GitHub username
 * @property {Object} profile - Basic profile information
 * @property {number} profile.public_repos - Number of public repositories
 * @property {number} profile.followers - Number of followers
 * @property {number} profile.account_age_years - Account age in years
 */

/**
 * @typedef {Object} PrimaryLanguage
 * @property {string} language - Programming language name
 * @property {number} percentage - Percentage of code in this language
 */

/**
 * @typedef {Object} TopRepository
 * @property {string} name - Repository name
 * @property {number} stars - Number of stars
 * @property {number} forks - Number of forks
 * @property {boolean} is_original_work - Whether this is original work (not a fork)
 * @property {string} description - Repository description
 */

/**
 * @typedef {Object} PullRequestStats
 * @property {number} opened - Number of PRs opened
 * @property {number} merged - Number of PRs merged
 * @property {number} reviewed - Number of PRs reviewed
 */

/**
 * @typedef {Object} IssueStats
 * @property {number} opened - Number of issues opened
 * @property {number} closed - Number of issues closed
 */

/**
 * @typedef {Object} CollaborationSignals
 * @property {number} solo_projects_ratio - Ratio of solo projects (0-1)
 * @property {number} team_projects_ratio - Ratio of team projects (0-1)
 */

/**
 * @typedef {Object} GitHubStats
 * @property {number} total_commits_estimate - Estimated total commits
 * @property {"low" | "medium" | "high"} commit_frequency - Commit frequency level
 * @property {"sporadic" | "consistent" | "very_consistent"} commit_consistency - Commit consistency pattern
 * @property {PrimaryLanguage[]} primary_languages - Top programming languages
 * @property {TopRepository[]} top_repositories - Top repositories by stars
 * @property {PullRequestStats} pull_requests - Pull request statistics
 * @property {IssueStats} issues - Issue statistics
 * @property {CollaborationSignals} collaboration_signals - Collaboration indicators
 * @property {"poor" | "average" | "strong"} readme_quality - Quality of README files
 * @property {"low" | "medium" | "high"} documentation_signal - Documentation quality signal
 */

/**
 * @typedef {Object} JobRole
 * @property {string} title - Job title
 * @property {string[]} required_skills - Required technical skills
 * @property {string[]} nice_to_have_skills - Nice-to-have skills
 * @property {"junior" | "mid" | "senior"} seniority - Required seniority level
 * @property {"frontend" | "backend" | "fullstack" | "data" | "infra"} focus - Technical focus area
 */

/**
 * @typedef {Object} AnalyzerInput
 * @property {CandidateProfile} candidate - Candidate information
 * @property {GitHubStats} github_stats - GitHub statistics
 * @property {JobRole} job_role - Job role requirements
 */

/**
 * @typedef {Object} EngineerSummary
 * @property {string} inferred_seniority - Inferred seniority level
 * @property {string[]} core_strengths - Core technical strengths
 * @property {string} working_style - Working style description
 * @property {string} collaboration_style - Collaboration style description
 */

/**
 * @typedef {Object} JobFitAnalysis
 * @property {"strong" | "medium" | "weak"} overall_fit - Overall job fit assessment
 * @property {string[]} matched_requirements - Requirements that match
 * @property {string[]} missing_or_weak_areas - Areas that are missing or weak
 * @property {string[]} risk_factors - Potential risk factors
 */

/**
 * @typedef {Object} HiringRecommendation
 * @property {"Strong Hire" | "Hire" | "Borderline" | "Do Not Hire Yet"} decision - Hiring decision
 * @property {"low" | "medium" | "high"} confidence_level - Confidence in the decision
 * @property {number} confidence_percentage - Confidence percentage (0-100)
 * @property {string} justification - Justification for the decision
 */

/**
 * @typedef {Object} Recommendations
 * @property {string[]} github_improvements - GitHub profile improvement suggestions
 * @property {string[]} skill_development - Skill development recommendations
 * @property {string[]} project_suggestions - Project suggestions tailored to job role
 */

/**
 * @typedef {Object} AnalyzerOutput
 * @property {EngineerSummary} engineer_summary - Engineer profile summary
 * @property {JobFitAnalysis} job_fit_analysis - Job fit analysis
 * @property {HiringRecommendation} hiring_recommendation - Hiring recommendation
 * @property {Recommendations} recommendations - Actionable recommendations
 */

