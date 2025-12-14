// @ts-check

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { aggregateGitHubData } from "./data-aggregator.js";
import { analyzeWithOpenAI } from "./openai-client.js";
import { logger } from "../common/log.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load the system prompt from file.
 *
 * @returns {string} System prompt content
 */
const loadSystemPrompt = () => {
  const promptPath = path.join(__dirname, "system-prompt.txt");
  return fs.readFileSync(promptPath, "utf-8");
};

/**
 * Analyze a GitHub user for a job role.
 *
 * @param {string} username - GitHub username
 * @param {import("./types").JobRole} jobRole - Job role requirements
 * @param {Object} options - Analysis options
 * @param {boolean} [options.include_all_commits=false] - Include all commits
 * @param {string} [options.openai_api_key] - OpenAI API key (or use OPENAI_API_KEY env var)
 * @param {string} [options.model="gpt-4o"] - OpenAI model to use
 * @returns {Promise<import("./types").AnalyzerOutput>} Analysis results
 */
export const analyzeCandidate = async (username, jobRole, options = {}) => {
  const {
    include_all_commits = false,
    openai_api_key = process.env.OPENAI_API_KEY,
    model = "gpt-4o",
  } = options;

  try {
    // Aggregate GitHub data
    logger.log(`Aggregating GitHub data for ${username}...`);
    const githubData = await aggregateGitHubData(username, {
      include_all_commits,
    });

    // Add job role
    githubData.job_role = jobRole;

    // Load system prompt
    const systemPrompt = loadSystemPrompt();

    // Analyze with OpenAI
    logger.log(`Analyzing candidate with OpenAI (model: ${model})...`);
    const analysis = await analyzeWithOpenAI(
      systemPrompt,
      githubData,
      openai_api_key,
      model,
    );

    return analysis;
  } catch (error) {
    logger.error("Error analyzing candidate:", error);
    throw error;
  }
};

export default analyzeCandidate;

