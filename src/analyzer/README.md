# GitHub Engineer Analyzer

A recruiter-focused GitHub profile analysis system that evaluates engineering candidates based on their GitHub activity and provides hiring recommendations.

## Overview

This analyzer uses the same GitHub data collection mechanisms as the github-readme-stats project to gather comprehensive information about a candidate's GitHub profile, then applies AI-powered analysis to provide recruiter-friendly insights.

## System Prompt

The system prompt is located in `system-prompt.txt` and defines the behavior of the AI analyzer. It instructs the AI to:

1. **Analyze the candidate as an engineer** - Infer seniority, strengths, working style, and risks
2. **Evaluate job fit** - Match candidate capabilities against job requirements
3. **Provide hiring recommendations** - Return one of: "Strong Hire", "Hire", "Borderline", or "Do Not Hire Yet"
4. **Generate actionable recommendations** - Suggest GitHub improvements, skill development, and project ideas

## Data Structure

### Input Format

The analyzer expects a JSON object with the following structure:

```json
{
  "candidate": {
    "username": "string",
    "profile": {
      "public_repos": number,
      "followers": number,
      "account_age_years": number
    }
  },
  "github_stats": {
    "total_commits_estimate": number,
    "commit_frequency": "low | medium | high",
    "commit_consistency": "sporadic | consistent | very_consistent",
    "primary_languages": [
      { "language": "string", "percentage": number }
    ],
    "top_repositories": [
      {
        "name": "string",
        "stars": number,
        "forks": number,
        "is_original_work": boolean,
        "description": "string"
      }
    ],
    "pull_requests": {
      "opened": number,
      "merged": number,
      "reviewed": number
    },
    "issues": {
      "opened": number,
      "closed": number
    },
    "collaboration_signals": {
      "solo_projects_ratio": number,
      "team_projects_ratio": number
    },
    "readme_quality": "poor | average | strong",
    "documentation_signal": "low | medium | high"
  },
  "job_role": {
    "title": "string",
    "required_skills": ["string"],
    "nice_to_have_skills": ["string"],
    "seniority": "junior | mid | senior",
    "focus": "frontend | backend | fullstack | data | infra"
  }
}
```

### Output Format

The analyzer returns a structured JSON response:

```json
{
  "engineer_summary": {
    "inferred_seniority": "string",
    "core_strengths": ["string"],
    "working_style": "string",
    "collaboration_style": "string"
  },
  "job_fit_analysis": {
    "overall_fit": "strong | medium | weak",
    "matched_requirements": ["string"],
    "missing_or_weak_areas": ["string"],
    "risk_factors": ["string"]
  },
  "hiring_recommendation": {
    "decision": "Strong Hire | Hire | Borderline | Do Not Hire Yet",
    "confidence_level": "low | medium | high",
    "justification": "string"
  },
  "recommendations": {
    "github_improvements": ["string"],
    "skill_development": ["string"],
    "project_suggestions": ["string"]
  }
}
```

## Usage

### Data Aggregation

Use the `aggregateGitHubData` function to collect and format GitHub data:

```javascript
import { aggregateGitHubData } from "./src/analyzer/data-aggregator.js";

const data = await aggregateGitHubData("username", {
  include_all_commits: true
});

// Add job role information
data.job_role = {
  title: "Senior Full Stack Engineer",
  required_skills: ["JavaScript", "React", "Node.js"],
  nice_to_have_skills: ["TypeScript", "AWS"],
  seniority: "senior",
  focus: "fullstack"
};
```

### AI Analysis

To use this with an AI service (OpenAI, Anthropic, etc.), you would:

1. Load the system prompt from `system-prompt.txt`
2. Format the aggregated data as JSON
3. Send both to your AI service
4. Parse and return the structured response

Example integration pattern:

```javascript
import fs from "fs";
import { aggregateGitHubData } from "./data-aggregator.js";

const systemPrompt = fs.readFileSync("./system-prompt.txt", "utf-8");
const githubData = await aggregateGitHubData(username);
githubData.job_role = jobRoleRequirements;

// Send to AI service (pseudo-code)
const response = await aiService.chat({
  system: systemPrompt,
  user: JSON.stringify(githubData, null, 2)
});

const analysis = JSON.parse(response);
```

## API Endpoint

The analyzer is available as an API endpoint at `/api/analyze`.

### Setup

1. **Set OpenAI API Key**: You need to provide an OpenAI API key either:
   - As an environment variable: `OPENAI_API_KEY=your_key_here`
   - As a query parameter: `?openai_api_key=your_key_here` (less secure, not recommended for production)

2. **Get your OpenAI API key**: Sign up at [OpenAI](https://platform.openai.com/) and create an API key

### API Usage

**Endpoint**: `GET /api/analyze`

**Required Parameters**:
- `username` - GitHub username to analyze
- `job_title` - Job title (e.g., "Senior Full Stack Engineer")
- `required_skills` - Comma-separated list (e.g., "JavaScript,React,Node.js")
- `seniority` - One of: `junior`, `mid`, `senior`
- `focus` - One of: `frontend`, `backend`, `fullstack`, `data`, `infra`

**Optional Parameters**:
- `nice_to_have_skills` - Comma-separated list
- `include_all_commits` - Boolean (default: false)
- `openai_api_key` - OpenAI API key (if not set as env var)
- `openai_model` - Model to use (default: "gpt-4o")
- `cache_seconds` - Cache duration

**Example Request**:
```
GET /api/analyze?username=octocat&job_title=Senior%20Full%20Stack%20Engineer&required_skills=JavaScript,React,Node.js&nice_to_have_skills=TypeScript,AWS&seniority=senior&focus=fullstack&openai_api_key=sk-...
```

**Example Response**:
```json
{
  "engineer_summary": {
    "inferred_seniority": "Mid-level",
    "core_strengths": ["Full-stack development", "API design"],
    "working_style": "Consistent contributor with strong documentation habits",
    "collaboration_style": "Active in team projects with good PR review participation"
  },
  "job_fit_analysis": {
    "overall_fit": "strong",
    "matched_requirements": ["JavaScript proficiency", "React experience"],
    "missing_or_weak_areas": ["AWS cloud infrastructure"],
    "risk_factors": ["Limited TypeScript exposure"]
  },
  "hiring_recommendation": {
    "decision": "Hire",
    "confidence_level": "high",
    "justification": "Strong technical foundation with relevant experience. Minor gaps in cloud infrastructure can be addressed through onboarding."
  },
  "recommendations": {
    "github_improvements": ["Add more detailed README files", "Showcase TypeScript projects"],
    "skill_development": ["Complete AWS certification", "Build a TypeScript-based project"],
    "project_suggestions": ["Create a full-stack TypeScript application with AWS deployment"]
  }
}
```

### Programmatic Usage

You can also use the analyzer programmatically:

```javascript
import { analyzeCandidate } from "./src/analyzer/index.js";

const analysis = await analyzeCandidate(
  "username",
  {
    title: "Senior Full Stack Engineer",
    required_skills: ["JavaScript", "React", "Node.js"],
    nice_to_have_skills: ["TypeScript", "AWS"],
    seniority: "senior",
    focus: "fullstack"
  },
  {
    include_all_commits: true,
    openai_api_key: process.env.OPENAI_API_KEY,
    model: "gpt-4o"
  }
);

console.log(analysis.hiring_recommendation.decision);
```

## Important Notes

- **OpenAI API Key Required**: You must provide a valid OpenAI API key. Get one from [OpenAI Platform](https://platform.openai.com/api-keys)

- **API Costs**: Each analysis uses OpenAI API credits. Check [OpenAI Pricing](https://openai.com/pricing) for current rates.

- **Data Limitations**: The analyzer only uses public GitHub data. Private repositories and activity are not accessible.

- **Evidence-Based**: The system prompt instructs the AI to avoid hallucination and base conclusions only on provided data.

- **Recruiter-Focused**: Output is optimized for recruiters and hiring managers, not developers.

## Future Enhancements

Potential improvements to consider:

1. **Enhanced Repository Analysis**: Fetch actual repository metadata including README content, commit history patterns, and contributor information
2. **Account Age Calculation**: Use GitHub API to get actual account creation date
3. **Issue Tracking**: Properly fetch and analyze issue opening/closing patterns
4. **PR Analysis**: Deep dive into PR descriptions, review comments, and merge patterns
5. **Language Proficiency**: More sophisticated language usage analysis
6. **Collaboration Metrics**: Better team collaboration signal detection

## Files

- `system-prompt.txt` - The AI system prompt defining analyzer behavior
- `data-aggregator.js` - Function to aggregate GitHub data into analyzer format
- `openai-client.js` - OpenAI API client for analysis
- `analyzer.js` - Main analyzer function that orchestrates data collection and AI analysis
- `types.d.ts` - TypeScript type definitions for all data structures
- `README.md` - This file
- `../api/analyze.js` - API endpoint handler

