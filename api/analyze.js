// @ts-check

import { analyzeCandidate } from "../src/analyzer/analyzer.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  setCacheHeaders,
  setErrorCacheHeaders,
} from "../src/common/cache.js";
import { MissingParamError, CustomError } from "../src/common/error.js";
import { logger } from "../src/common/log.js";
import { parseBoolean } from "../src/common/ops.js";

/**
 * Parse job role from query parameters.
 *
 * @param {any} req - Request object
 * @returns {import("../src/analyzer/types").JobRole} Job role object
 */
const parseJobRole = (req) => {
  const {
    job_title,
    required_skills,
    nice_to_have_skills,
    seniority,
    focus,
  } = req.query;

  if (!job_title || !required_skills || !seniority || !focus) {
    throw new MissingParamError([
      "job_title",
      "required_skills",
      "seniority",
      "focus",
    ]);
  }

  const validSeniority = ["junior", "mid", "senior"];
  if (!validSeniority.includes(seniority.toLowerCase())) {
    throw new CustomError(
      `Invalid seniority. Must be one of: ${validSeniority.join(", ")}`,
      CustomError.MISSING_PARAMETER,
    );
  }

  const validFocus = ["frontend", "backend", "fullstack", "data", "infra"];
  if (!validFocus.includes(focus.toLowerCase())) {
    throw new CustomError(
      `Invalid focus. Must be one of: ${validFocus.join(", ")}`,
      CustomError.MISSING_PARAMETER,
    );
  }

  return {
    title: job_title,
    required_skills: required_skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    nice_to_have_skills: nice_to_have_skills
      ? nice_to_have_skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    seniority: seniority.toLowerCase(),
    focus: focus.toLowerCase(),
  };
};

// @ts-ignore
export default async (req, res) => {
  const {
    username,
    include_all_commits,
    cache_seconds,
    openai_model,
    openai_api_key,
  } = req.query;

  res.setHeader("Content-Type", "application/json");

  // Validate username
  if (!username) {
    return res.status(400).json({
      error: "Missing required parameter: username",
    });
  }

  // Validate OpenAI API key
  const apiKey = openai_api_key || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({
      error:
        "OpenAI API key is required. Provide 'openai_api_key' query parameter or set OPENAI_API_KEY environment variable.",
    });
  }

  try {
    // Parse job role from query parameters
    const jobRole = parseJobRole(req);

    // Analyze candidate
    const analysis = await analyzeCandidate(
      username,
      jobRole,
      {
        include_all_commits: parseBoolean(include_all_commits),
        openai_api_key: apiKey,
        model: openai_model || "gpt-4o",
      },
    );

    // Set cache headers
    const cacheSeconds = resolveCacheSeconds({
      requested: parseInt(cache_seconds, 10),
      def: CACHE_TTL.STATS_CARD.DEFAULT,
      min: CACHE_TTL.STATS_CARD.MIN,
      max: CACHE_TTL.STATS_CARD.MAX,
    });
    setCacheHeaders(res, cacheSeconds);

    return res.json(analysis);
  } catch (error) {
    setErrorCacheHeaders(res);

    if (error instanceof MissingParamError) {
      return res.status(400).json({
        error: error.message,
      });
    }

    if (error instanceof CustomError) {
      logger.error("Analyzer error:", error.message);
      return res.status(500).json({
        error: error.message,
      });
    }

    logger.error("Unexpected error:", error);
    return res.status(500).json({
      error: "An unexpected error occurred while analyzing the candidate",
    });
  }
};

