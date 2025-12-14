// @ts-check

import { fetchStats } from "../fetchers/stats.js";
import { fetchTopLanguages } from "../fetchers/top-languages.js";
import { logger } from "../common/log.js";
import { retryer } from "../common/retryer.js";
import { request } from "../common/http.js";

/**
 * Calculate commit frequency level based on commits and account age.
 *
 * @param {number} totalCommits - Total commits
 * @param {number} accountAgeYears - Account age in years
 * @returns {"low" | "medium" | "high"} Commit frequency level
 */
const calculateCommitFrequency = (totalCommits, accountAgeYears) => {
  if (accountAgeYears === 0) {
    return "low";
  }
  const commitsPerYear = totalCommits / accountAgeYears;
  if (commitsPerYear < 50) {
    return "low";
  }
  if (commitsPerYear < 200) {
    return "medium";
  }
  return "high";
};

/**
 * Calculate commit consistency based on commit patterns.
 * This is a simplified version - in production, you'd analyze commit history.
 *
 * @param {number} totalCommits - Total commits
 * @param {number} accountAgeYears - Account age in years
 * @returns {"sporadic" | "consistent" | "very_consistent"} Commit consistency
 */
const calculateCommitConsistency = (totalCommits, accountAgeYears) => {
  if (accountAgeYears === 0) {
    return "sporadic";
  }
  const commitsPerYear = totalCommits / accountAgeYears;
  const commitsPerMonth = commitsPerYear / 12;
  if (commitsPerMonth < 2) {
    return "sporadic";
  }
  if (commitsPerMonth < 10) {
    return "consistent";
  }
  return "very_consistent";
};

/**
 * Analyze README quality based on repository descriptions and documentation.
 * This is a simplified heuristic - in production, you'd analyze actual README files.
 *
 * @param {Array} repositories - Array of repository objects
 * @returns {"poor" | "average" | "strong"} README quality assessment
 */
const assessReadmeQuality = (repositories) => {
  if (!repositories || repositories.length === 0) {
    return "poor";
  }
  const reposWithDescriptions = repositories.filter(
    (repo) => repo.description && repo.description.length > 20,
  ).length;
  const ratio = reposWithDescriptions / repositories.length;
  if (ratio < 0.3) {
    return "poor";
  }
  if (ratio < 0.7) {
    return "average";
  }
  return "strong";
};

/**
 * Assess documentation signal based on repository metadata.
 *
 * @param {Array} repositories - Array of repository objects
 * @returns {"low" | "medium" | "high"} Documentation signal
 */
const assessDocumentationSignal = (repositories) => {
  if (!repositories || repositories.length === 0) {
    return "low";
  }
  const reposWithDescriptions = repositories.filter(
    (repo) => repo.description && repo.description.length > 30,
  ).length;
  const ratio = reposWithDescriptions / repositories.length;
  if (ratio < 0.4) {
    return "low";
  }
  if (ratio < 0.7) {
    return "medium";
  }
  return "high";
};

/**
 * Calculate collaboration signals based on repository data.
 *
 * @param {Array} repositories - Array of repository objects
 * @param {number} contributedTo - Number of repositories contributed to
 * @returns {{solo_projects_ratio: number, team_projects_ratio: number}} Collaboration signals
 */
const calculateCollaborationSignals = (repositories, contributedTo) => {
  const totalRepos = repositories.length;
  if (totalRepos === 0) {
    return { solo_projects_ratio: 1, team_projects_ratio: 0 };
  }
  const teamProjectsRatio = Math.min(
    contributedTo / (totalRepos + contributedTo),
    1,
  );
  const soloProjectsRatio = 1 - teamProjectsRatio;
  return {
    solo_projects_ratio: soloProjectsRatio,
    team_projects_ratio: teamProjectsRatio,
  };
};

/**
 * Fetch user profile data (repos count, followers, account creation).
 *
 * @param {string} username - GitHub username
 * @returns {Promise<{public_repos: number, followers: number, account_age_years: number}>} Profile data
 */
const fetchUserProfile = async (username) => {
  const profileFetcher = (variables, token) => {
    return request(
      {
        query: `
          query userProfile($login: String!) {
            user(login: $login) {
              repositories(ownerAffiliations: OWNER) {
                totalCount
              }
              followers {
                totalCount
              }
              createdAt
            }
          }
        `,
        variables,
      },
      {
        Authorization: `bearer ${token}`,
      },
    );
  };

  const res = await retryer(profileFetcher, { login: username });

  if (res.data.errors) {
    logger.error("Error fetching user profile:", res.data.errors);
    // Return defaults if there's an error
    return {
      public_repos: 0,
      followers: 0,
      account_age_years: 1,
    };
  }

  const user = res.data.data.user;
  const createdAt = new Date(user.createdAt);
  const now = new Date();
  const accountAgeYears = Math.max(
    1,
    Math.floor((now - createdAt) / (1000 * 60 * 60 * 24 * 365)),
  );

  return {
    public_repos: user.repositories.totalCount,
    followers: user.followers.totalCount,
    account_age_years: accountAgeYears,
  };
};

/**
 * Aggregate GitHub data for recruiter analysis.
 *
 * @param {string} username - GitHub username
 * @param {Object} options - Aggregation options
 * @param {boolean} [options.include_all_commits=false] - Include all commits
 * @returns {Promise<import("./types").AnalyzerInput>} Aggregated data for analysis
 */
export const aggregateGitHubData = async (username, options = {}) => {
  const { include_all_commits = false } = options;

  try {
    // Fetch stats, top languages, and profile in parallel
    const [stats, topLangs, profile] = await Promise.all([
      fetchStats(
        username,
        include_all_commits,
        [],
        true, // include merged PRs
        false, // include discussions
        false, // include discussion answers
      ),
      fetchTopLanguages(username, []),
      fetchUserProfile(username),
    ]);

    // Use profile data for account age
    const accountAgeYears = profile.account_age_years;

    // Process top languages
    const totalLangSize = Object.values(topLangs).reduce(
      (sum, lang) => sum + lang.size,
      0,
    );
    const primaryLanguages = Object.values(topLangs)
      .map((lang) => ({
        language: lang.name,
        percentage: totalLangSize > 0 ? (lang.size / totalLangSize) * 100 : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // Get top repositories (would need additional API call in production)
    // For now, we'll create a placeholder structure
    const topRepositories = [];

    // Calculate commit metrics
    const commitFrequency = calculateCommitFrequency(
      stats.totalCommits,
      accountAgeYears,
    );
    const commitConsistency = calculateCommitConsistency(
      stats.totalCommits,
      accountAgeYears,
    );

    // Calculate collaboration signals
    const collaborationSignals = calculateCollaborationSignals(
      topRepositories,
      stats.contributedTo,
    );

    // Assess documentation quality
    const readmeQuality = assessReadmeQuality(topRepositories);
    const documentationSignal = assessDocumentationSignal(topRepositories);

    return {
      candidate: {
        username,
        profile: {
          public_repos: profile.public_repos,
          followers: profile.followers,
          account_age_years: accountAgeYears,
        },
      },
      github_stats: {
        total_commits_estimate: stats.totalCommits,
        commit_frequency: commitFrequency,
        commit_consistency: commitConsistency,
        primary_languages: primaryLanguages,
        top_repositories: topRepositories,
        pull_requests: {
          opened: stats.totalPRs,
          merged: stats.totalPRsMerged,
          reviewed: stats.totalReviews,
        },
        issues: {
          opened: 0, // Note: stats.totalIssues includes both open and closed
          closed: stats.totalIssues,
        },
        collaboration_signals: collaborationSignals,
        readme_quality: readmeQuality,
        documentation_signal: documentationSignal,
      },
      // job_role will be provided separately by the caller
      job_role: null,
    };
  } catch (error) {
    logger.error("Error aggregating GitHub data:", error);
    throw error;
  }
};

export default aggregateGitHubData;
