# API Analyze Endpoint - URL Parameters

## Endpoint
```
GET /api/analyze
```

## Required Parameters

### `username` (string)
- **Description**: GitHub username to analyze
- **Example**: `username=octocat`
- **Required**: Yes
- **Validation**: Must be a valid GitHub username (alphanumeric, hyphens, max 39 characters)

### `job_title` (string)
- **Description**: The job title/position name
- **Example**: `job_title=Senior%20Full%20Stack%20Engineer` (URL encoded)
- **Required**: Yes
- **Validation**: Must be 1-100 characters

### `required_skills` (string, comma-separated)
- **Description**: Required technical skills for the role (comma-separated list)
- **Example**: `required_skills=JavaScript,React,Node.js`
- **Required**: Yes
- **Validation**: Maximum 50 skills, each skill max 50 characters
- **Note**: Skills are separated by commas, spaces are trimmed automatically

### `seniority` (string)
- **Description**: Required seniority level
- **Valid values**: `junior`, `mid`, `senior`
- **Example**: `seniority=senior`
- **Required**: Yes
- **Case-insensitive**: Yes

### `focus` (string)
- **Description**: Technical focus area of the role
- **Valid values**: `frontend`, `backend`, `fullstack`, `data`, `infra`
- **Example**: `focus=fullstack`
- **Required**: Yes
- **Case-insensitive**: Yes

## Optional Parameters

### `nice_to_have_skills` (string, comma-separated)
- **Description**: Nice-to-have skills (comma-separated list)
- **Example**: `nice_to_have_skills=TypeScript,AWS,Docker`
- **Required**: No
- **Default**: Empty array
- **Validation**: Maximum 50 skills, each skill max 50 characters

### `include_all_commits` (boolean)
- **Description**: Include all commits (not just contributions from the last year)
- **Valid values**: `true`, `false`, `1`, `0`
- **Example**: `include_all_commits=true`
- **Required**: No
- **Default**: `false`

### `openai_model` (string)
- **Description**: OpenAI model to use for analysis
- **Example**: `openai_model=gpt-4o`
- **Required**: No
- **Default**: `gpt-4o`
- **Valid models**: `gpt-4o`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`
- **Note**: Invalid models will default to `gpt-4o`

## Environment Variables

### `OPENAI_API_KEY` (required)
- **Description**: OpenAI API key for authentication
- **Required**: Yes
- **Security**: Must be set as an environment variable. Query parameter support has been removed for security.

### `cache_seconds` (number)
- **Description**: Cache duration in seconds for the response
- **Example**: `cache_seconds=3600`
- **Required**: No
- **Default**: Uses `CACHE_TTL.STATS_CARD.DEFAULT` from cache configuration

## Example URLs

### Basic Example
```
GET /api/analyze?username=octocat&job_title=Senior%20Engineer&required_skills=JavaScript,React&seniority=senior&focus=fullstack
```

### Full Example with All Parameters
```
GET /api/analyze?username=octocat&job_title=Senior%20Full%20Stack%20Engineer&required_skills=JavaScript,React,Node.js&nice_to_have_skills=TypeScript,AWS&seniority=senior&focus=fullstack&include_all_commits=true&openai_model=gpt-4o&cache_seconds=3600
```
**Note**: `OPENAI_API_KEY` must be set as an environment variable (not in URL)

### Frontend Role Example
```
GET /api/analyze?username=username&job_title=Frontend%20Developer&required_skills=React,TypeScript,CSS&nice_to_have_skills=Next.js,Tailwind&seniority=mid&focus=frontend
```

### Backend Role Example
```
GET /api/analyze?username=username&job_title=Backend%20Engineer&required_skills=Python,Django,PostgreSQL&nice_to_have_skills=Docker,Kubernetes&seniority=senior&focus=backend
```

### Data Engineer Example
```
GET /api/analyze?username=username&job_title=Data%20Engineer&required_skills=Python,SQL,Spark&nice_to_have_skills=Airflow,Snowflake&seniority=mid&focus=data
```

## Response Format

The endpoint returns a JSON object with the following structure:

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
    "confidence_percentage": 0-100,
    "justification": "string"
  },
  "recommendations": {
    "github_improvements": ["string"],
    "skill_development": ["string"],
    "project_suggestions": ["string"]
  }
}
```

## Error Responses

### 400 Bad Request
- Missing required parameters
- Invalid parameter values (e.g., invalid `seniority` or `focus`)
- Invalid username format
- Input validation errors (length limits, format issues)

### 429 Too Many Requests
- Rate limit exceeded (10 requests per minute per IP)
- Response includes `X-RateLimit-*` headers and `retryAfter` in seconds

### 500 Internal Server Error
- Missing `OPENAI_API_KEY` environment variable
- GitHub API errors
- OpenAI API errors
- Data aggregation errors

## Rate Limiting

The endpoint implements rate limiting to prevent abuse:
- **Limit**: 10 requests per minute per IP address
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed (10)
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: ISO timestamp when the rate limit resets
- **429 Response**: When rate limit is exceeded, includes `retryAfter` in seconds

**Note**: For production deployments, consider using Redis-based rate limiting for better scalability across multiple serverless instances.

## Notes

1. **URL Encoding**: Remember to URL-encode parameter values (e.g., spaces become `%20`)
2. **Skills Format**: Skills should be comma-separated without extra spaces (spaces are trimmed automatically)
3. **Case Sensitivity**: `seniority` and `focus` values are case-insensitive
4. **API Key**: `OPENAI_API_KEY` **must** be set as an environment variable. Query parameter support has been removed for security.
5. **Caching**: Responses are cached based on the `cache_seconds` parameter or default cache settings
6. **Input Validation**: All inputs are validated and sanitized. Invalid inputs will return 400 errors with descriptive messages
7. **Timeout**: The endpoint has a 60-second timeout to accommodate OpenAI API calls

