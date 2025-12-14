# API Testing Guide

This guide shows how to test the `/api/analyze` endpoint without Swagger.

## Prerequisites

1. **Set Environment Variable**: Make sure `OPENAI_API_KEY` is set in your environment
   ```bash
   export OPENAI_API_KEY="sk-your-key-here"
   ```

2. **Start the Server** (if running locally):
   ```bash
   npm start
   # or
   vercel dev
   ```

## Method 1: Using cURL (Command Line)

### Basic Request

```bash
curl -X GET "http://localhost:3000/api/analyze?username=octocat&job_title=Senior%20Engineer&required_skills=JavaScript,React&seniority=senior&focus=fullstack"
```

### Full Request with All Parameters

```bash
curl -X GET \
  "http://localhost:3000/api/analyze?username=octocat&job_title=Senior%20Full%20Stack%20Engineer&required_skills=JavaScript,React,Node.js&nice_to_have_skills=TypeScript,AWS&seniority=senior&focus=fullstack&include_all_commits=true&openai_model=gpt-4o&cache_seconds=3600" \
  -H "Content-Type: application/json"
```

### Pretty Print JSON Response

```bash
curl -X GET \
  "http://localhost:3000/api/analyze?username=octocat&job_title=Senior%20Engineer&required_skills=JavaScript,React&seniority=senior&focus=fullstack" \
  -H "Content-Type: application/json" \
  | jq '.'
```

### Save Response to File

```bash
curl -X GET \
  "http://localhost:3000/api/analyze?username=octocat&job_title=Senior%20Engineer&required_skills=JavaScript,React&seniority=senior&focus=fullstack" \
  -H "Content-Type: application/json" \
  -o response.json
```

### Test Rate Limiting

```bash
# Run this 11 times quickly to test rate limiting
for i in {1..11}; do
  echo "Request $i:"
  curl -X GET \
    "http://localhost:3000/api/analyze?username=octocat&job_title=Engineer&required_skills=JavaScript&seniority=mid&focus=frontend" \
    -H "Content-Type: application/json" \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 1
done
```

### Test Input Validation

```bash
# Test invalid username
curl -X GET \
  "http://localhost:3000/api/analyze?username=invalid@username&job_title=Engineer&required_skills=JavaScript&seniority=mid&focus=frontend" \
  -H "Content-Type: application/json"

# Test missing parameter
curl -X GET \
  "http://localhost:3000/api/analyze?username=octocat&job_title=Engineer&required_skills=JavaScript&seniority=mid" \
  -H "Content-Type: application/json"
```

## Method 2: Using HTTPie (More Readable)

Install HTTPie: `pip install httpie` or `brew install httpie`

```bash
http GET "http://localhost:3000/api/analyze" \
  username==octocat \
  job_title=="Senior Engineer" \
  required_skills=="JavaScript,React" \
  seniority==senior \
  focus==fullstack \
  nice_to_have_skills=="TypeScript,AWS" \
  include_all_commits==true \
  openai_model==gpt-4o
```

## Method 3: Using Postman

1. **Create New Request**:
   - Method: `GET`
   - URL: `http://localhost:3000/api/analyze`

2. **Add Query Parameters**:
   - Go to "Params" tab
   - Add each parameter:
     - `username`: `octocat`
     - `job_title`: `Senior Engineer`
     - `required_skills`: `JavaScript,React`
     - `seniority`: `senior`
     - `focus`: `fullstack`
     - `nice_to_have_skills`: `TypeScript,AWS` (optional)
     - `include_all_commits`: `true` (optional)
     - `openai_model`: `gpt-4o` (optional)
     - `cache_seconds`: `3600` (optional)

3. **Set Headers**:
   - `Content-Type`: `application/json`

4. **Send Request**

## Method 4: Using Browser (Simple GET Requests)

For simple testing, you can use the browser directly:

```
http://localhost:3000/api/analyze?username=octocat&job_title=Senior%20Engineer&required_skills=JavaScript,React&seniority=senior&focus=fullstack
```

**Note**: Browser will show raw JSON. Install a JSON formatter extension for better readability.

## Method 5: Using JavaScript/Node.js

```javascript
const https = require('https');
const querystring = require('querystring');

const params = {
  username: 'octocat',
  job_title: 'Senior Engineer',
  required_skills: 'JavaScript,React',
  seniority: 'senior',
  focus: 'fullstack',
  nice_to_have_skills: 'TypeScript,AWS',
  include_all_commits: 'true',
  openai_model: 'gpt-4o'
};

const url = `http://localhost:3000/api/analyze?${querystring.stringify(params)}`;

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
}).on('error', (err) => {
  console.error('Error:', err);
});
```

## Method 6: Using Python

```python
import requests
import json

url = "http://localhost:3000/api/analyze"
params = {
    "username": "octocat",
    "job_title": "Senior Engineer",
    "required_skills": "JavaScript,React",
    "seniority": "senior",
    "focus": "fullstack",
    "nice_to_have_skills": "TypeScript,AWS",
    "include_all_commits": "true",
    "openai_model": "gpt-4o"
}

response = requests.get(url, params=params)
print(json.dumps(response.json(), indent=2))
```

## Testing Different Scenarios

### 1. Test Valid Request
```bash
curl "http://localhost:3000/api/analyze?username=octocat&job_title=Engineer&required_skills=JavaScript&seniority=mid&focus=frontend"
```

### 2. Test Rate Limiting
```bash
# Make 11 requests quickly
for i in {1..11}; do curl -s "http://localhost:3000/api/analyze?username=test&job_title=Engineer&required_skills=JS&seniority=mid&focus=frontend" | jq -r '.error // "Success"'; done
```

### 3. Test Invalid Username
```bash
curl "http://localhost:3000/api/analyze?username=invalid@user&job_title=Engineer&required_skills=JS&seniority=mid&focus=frontend"
```

### 4. Test Missing Parameters
```bash
curl "http://localhost:3000/api/analyze?username=octocat&job_title=Engineer"
```

### 5. Test Invalid Seniority
```bash
curl "http://localhost:3000/api/analyze?username=octocat&job_title=Engineer&required_skills=JS&seniority=invalid&focus=frontend"
```

### 6. Test Long Input (Should Fail)
```bash
curl "http://localhost:3000/api/analyze?username=octocat&job_title=$(python3 -c 'print("A"*200)')&required_skills=JS&seniority=mid&focus=frontend"
```

## Expected Responses

### Success Response (200)
```json
{
  "engineer_summary": {
    "inferred_seniority": "...",
    "core_strengths": ["..."],
    "working_style": "...",
    "collaboration_style": "..."
  },
  "job_fit_analysis": {
    "overall_fit": "strong",
    "matched_requirements": ["..."],
    "missing_or_weak_areas": ["..."],
    "risk_factors": ["..."]
  },
  "hiring_recommendation": {
    "decision": "Hire",
    "confidence_level": "high",
    "confidence_percentage": 85,
    "justification": "..."
  },
  "recommendations": {
    "github_improvements": ["..."],
    "skill_development": ["..."],
    "project_suggestions": ["..."]
  }
}
```

### Error Response (400)
```json
{
  "error": "Invalid GitHub username format"
}
```

### Rate Limit Response (429)
```json
{
  "error": "Rate limit exceeded. Maximum 10 requests per minute.",
  "retryAfter": 45
}
```

## Check Response Headers

```bash
curl -I "http://localhost:3000/api/analyze?username=octocat&job_title=Engineer&required_skills=JS&seniority=mid&focus=frontend"
```

Look for:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: When limit resets
- `Cache-Control`: Caching information

## Production Testing

If deployed to Vercel, replace `localhost:3000` with your production URL:

```bash
curl "https://your-app.vercel.app/api/analyze?username=octocat&job_title=Engineer&required_skills=JS&seniority=mid&focus=frontend"
```

## Troubleshooting

1. **401/500 Error**: Make sure `OPENAI_API_KEY` is set
2. **Timeout**: Check that timeout is set to 60s in `vercel.json`
3. **Rate Limit**: Wait 1 minute between batches of 10 requests
4. **Invalid Response**: Check that all required parameters are provided and valid

