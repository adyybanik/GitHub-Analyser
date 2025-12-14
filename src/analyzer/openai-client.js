// @ts-check

import axios from "axios";
import { logger } from "../common/log.js";
import { CustomError } from "../common/error.js";

/**
 * Analyze GitHub data using OpenAI.
 *
 * @param {string} systemPrompt - The system prompt for the AI
 * @param {import("./types").AnalyzerInput} inputData - The GitHub data to analyze
 * @param {string} apiKey - OpenAI API key
 * @param {string} [model="gpt-4o"] - OpenAI model to use
 * @returns {Promise<import("./types").AnalyzerOutput>} Analysis results
 */
export const analyzeWithOpenAI = async (
  systemPrompt,
  inputData,
  apiKey,
  model = "gpt-4o",
) => {
  if (!apiKey) {
    throw new CustomError(
      "OpenAI API key is required. Set OPENAI_API_KEY environment variable.",
      CustomError.MISSING_PARAMETER,
    );
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Analyze this GitHub profile data:\n\n${JSON.stringify(inputData, null, 2)}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent, analytical responses
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60000, // 60 second timeout
      },
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new CustomError(
        "No response content from OpenAI",
        CustomError.API_ERROR,
      );
    }

    // Parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      logger.error("Failed to parse OpenAI response:", content);
      throw new CustomError(
        "Invalid JSON response from OpenAI",
        CustomError.API_ERROR,
      );
    }

    // Validate response structure
    if (
      !analysis.engineer_summary ||
      !analysis.job_fit_analysis ||
      !analysis.hiring_recommendation ||
      !analysis.recommendations
    ) {
      logger.error("Invalid analysis structure:", analysis);
      throw new CustomError(
        "Invalid analysis response structure from OpenAI",
        CustomError.API_ERROR,
      );
    }

    // Validate confidence_percentage if present
    if (
      analysis.hiring_recommendation.confidence_percentage !== undefined &&
      (typeof analysis.hiring_recommendation.confidence_percentage !==
        "number" ||
        analysis.hiring_recommendation.confidence_percentage < 0 ||
        analysis.hiring_recommendation.confidence_percentage > 100)
    ) {
      logger.warn("Invalid confidence_percentage, ensuring it's between 0-100");
      // Clamp to valid range
      analysis.hiring_recommendation.confidence_percentage = Math.max(
        0,
        Math.min(
          100,
          analysis.hiring_recommendation.confidence_percentage || 50,
        ),
      );
    }

    return analysis;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new CustomError("Invalid OpenAI API key", CustomError.API_ERROR);
      }
      if (error.response?.status === 429) {
        throw new CustomError(
          "OpenAI API rate limit exceeded",
          CustomError.API_ERROR,
        );
      }
      logger.error("OpenAI API error:", error.response?.data || error.message);
      throw new CustomError(
        `OpenAI API error: ${error.response?.data?.error?.message || error.message}`,
        CustomError.API_ERROR,
      );
    }
    throw error;
  }
};

export default analyzeWithOpenAI;
