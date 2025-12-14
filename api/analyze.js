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
import githubUsernameRegex from "github-username-regex";

/**
 * Validate and sanitize username.
 *
 * @param {string} username - Username to validate
 * @returns {string} Validated username
 * @throws {CustomError} If username is invalid
 */
const validateUsername = (username) => {
  if (!username || typeof username !== "string") {
    throw new CustomError(
      "Username is required and must be a string",
      CustomError.MISSING_PARAMETER,
    );
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length === 0) {
    throw new CustomError(
      "Username cannot be empty",
      CustomError.MISSING_PARAMETER,
    );
  }

  if (trimmedUsername.length > 39) {
    throw new CustomError(
      "Username must be 39 characters or less",
      CustomError.MISSING_PARAMETER,
    );
  }

  if (!githubUsernameRegex.test(trimmedUsername)) {
    throw new CustomError(
      "Invalid GitHub username format",
      CustomError.MISSING_PARAMETER,
    );
  }

  return trimmedUsername;
};

/**
 * Validate and sanitize string input with length limits.
 *
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Validated string
 * @throws {CustomError} If value is invalid
 */
const validateStringInput = (value, fieldName, maxLength = 200) => {
  if (!value || typeof value !== "string") {
    throw new CustomError(
      `${fieldName} is required and must be a string`,
      CustomError.MISSING_PARAMETER,
    );
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new CustomError(
      `${fieldName} cannot be empty`,
      CustomError.MISSING_PARAMETER,
    );
  }

  if (trimmed.length > maxLength) {
    throw new CustomError(
      `${fieldName} must be ${maxLength} characters or less`,
      CustomError.MISSING_PARAMETER,
    );
  }

  return trimmed;
};

/**
 * Validate and sanitize skills array.
 *
 * @param {string} skillsString - Comma-separated skills string
 * @param {string} fieldName - Name of the field for error messages
 * @param {boolean} required - Whether the field is required
 * @returns {string[]} Array of validated skills
 * @throws {CustomError} If skills are invalid
 */
const validateSkills = (skillsString, fieldName, required = false) => {
  if (!skillsString) {
    if (required) {
      throw new CustomError(
        `${fieldName} is required`,
        CustomError.MISSING_PARAMETER,
      );
    }
    return [];
  }

  if (typeof skillsString !== "string") {
    throw new CustomError(
      `${fieldName} must be a comma-separated string`,
      CustomError.MISSING_PARAMETER,
    );
  }

  const skills = skillsString
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (required && skills.length === 0) {
    throw new CustomError(
      `${fieldName} must contain at least one skill`,
      CustomError.MISSING_PARAMETER,
    );
  }

  if (skills.length > 50) {
    throw new CustomError(
      `${fieldName} cannot contain more than 50 skills`,
      CustomError.MISSING_PARAMETER,
    );
  }

  // Validate each skill
  for (const skill of skills) {
    if (skill.length > 50) {
      throw new CustomError(
        `Each skill in ${fieldName} must be 50 characters or less`,
        CustomError.MISSING_PARAMETER,
      );
    }
  }

  return skills;
};

/**
 * Simple in-memory rate limiter.
 * Note: For production, consider using Redis or Vercel's rate limiting.
 */
const rateLimitMap = new Map();

/**
 * Check rate limit for a given identifier (IP or user).
 *
 * @param {string} identifier - Identifier to rate limit (IP address or user ID)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }} Rate limit status
 */
const checkRateLimit = (identifier, maxRequests = 10, windowMs = 60000) => {
  const now = Date.now();
  const key = identifier;

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  const record = rateLimitMap.get(key);

  // Reset if window expired
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: record.resetAt,
    };
  }

  // Check if limit exceeded
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
  };
};

/**
 * Get client identifier from request.
 *
 * @param {any} req - Request object
 * @returns {string} Client identifier
 */
const getClientIdentifier = (req) => {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : realIp || req.socket?.remoteAddress || "unknown";

  return ip;
};

/**
 * Parse job role from query parameters.
 *
 * @param {any} req - Request object
 * @returns {import("../src/analyzer/types").JobRole} Job role object
 */
const parseJobRole = (req) => {
  const { job_title, required_skills, nice_to_have_skills, seniority, focus } =
    req.query;

  if (!job_title || !required_skills || !seniority || !focus) {
    throw new MissingParamError([
      "job_title",
      "required_skills",
      "seniority",
      "focus",
    ]);
  }

  // Validate and sanitize job title
  const validatedJobTitle = validateStringInput(job_title, "job_title", 100);

  // Validate skills
  const validatedRequiredSkills = validateSkills(
    required_skills,
    "required_skills",
    true,
  );
  const validatedNiceToHaveSkills = validateSkills(
    nice_to_have_skills,
    "nice_to_have_skills",
    false,
  );

  // Validate seniority
  const validSeniority = ["junior", "mid", "senior"];
  const lowerSeniority = seniority.toLowerCase();
  if (!validSeniority.includes(lowerSeniority)) {
    throw new CustomError(
      `Invalid seniority. Must be one of: ${validSeniority.join(", ")}`,
      CustomError.MISSING_PARAMETER,
    );
  }

  // Validate focus
  const validFocus = ["frontend", "backend", "fullstack", "data", "infra"];
  const lowerFocus = focus.toLowerCase();
  if (!validFocus.includes(lowerFocus)) {
    throw new CustomError(
      `Invalid focus. Must be one of: ${validFocus.join(", ")}`,
      CustomError.MISSING_PARAMETER,
    );
  }

  return {
    title: validatedJobTitle,
    required_skills: validatedRequiredSkills,
    nice_to_have_skills: validatedNiceToHaveSkills,
    seniority: lowerSeniority,
    focus: lowerFocus,
  };
};

// @ts-ignore
export default async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  // Rate limiting - 10 requests per minute per IP
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId, 10, 60000);

  if (!rateLimit.allowed) {
    res.setHeader("X-RateLimit-Limit", "10");
    res.setHeader("X-RateLimit-Remaining", "0");
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(rateLimit.resetAt).toISOString(),
    );
    return res.status(429).json({
      error: "Rate limit exceeded. Maximum 10 requests per minute.",
      retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
    });
  }

  // Set rate limit headers
  res.setHeader("X-RateLimit-Limit", "10");
  res.setHeader("X-RateLimit-Remaining", rateLimit.remaining.toString());
  res.setHeader("X-RateLimit-Reset", new Date(rateLimit.resetAt).toISOString());

  const { username, include_all_commits, cache_seconds, openai_model } =
    req.query;

  // Validate username
  let validatedUsername;
  try {
    validatedUsername = validateUsername(username);
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(400).json({
        error: error.message,
      });
    }
    return res.status(400).json({
      error: "Invalid username parameter",
    });
  }

  // Validate OpenAI API key - ONLY from environment variable (security)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.",
    });
  }

  // Validate OpenAI model if provided
  const validModels = ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"];
  const requestedModel = openai_model || "gpt-4o";
  const model = validModels.includes(requestedModel)
    ? requestedModel
    : "gpt-4o";

  try {
    // Parse job role from query parameters
    const jobRole = parseJobRole(req);

    // Analyze candidate
    const analysis = await analyzeCandidate(validatedUsername, jobRole, {
      include_all_commits: parseBoolean(include_all_commits),
      openai_api_key: apiKey,
      model,
    });

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
