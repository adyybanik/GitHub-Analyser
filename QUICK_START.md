# Quick Start Guide - Testing the API

## Step 1: Set Environment Variables

Create a `.env` file in the root directory or export the variables:

```bash
# Required: OpenAI API Key
export OPENAI_API_KEY="sk-your-key-here"

# Optional: GitHub Personal Access Tokens (for GitHub API)
export PAT_1="ghp_your_github_token_here"
```

Or create a `.env` file:
```bash
echo "OPENAI_API_KEY=sk-your-key-here" > .env
echo "PAT_1=ghp_your_github_token_here" >> .env
```

## Step 2: Start the Server

The server runs on **port 9000** by default (not 3000).

```bash
# Option 1: Using Node directly
node express.js

# Option 2: Using Vercel CLI (if you have it installed)
vercel dev
```

You should see:
```
Server running on port 9000
```

## Step 3: Test the API

### Quick Test (using the test script)
```bash
./test-api.sh http://localhost:9000
```

### Manual Test with cURL
```bash
curl "http://localhost:9000/api/analyze?username=octocat&job_title=Senior%20Engineer&required_skills=JavaScript,React&seniority=senior&focus=fullstack"
```

### Pretty Print JSON
```bash
curl "http://localhost:9000/api/analyze?username=octocat&job_title=Engineer&required_skills=JS&seniority=mid&focus=frontend" | jq '.'
```

## Troubleshooting

### Error: "Connection refused" or HTTP 000
- **Solution**: Make sure the server is running on port 9000
- Check: `lsof -ti:9000` should show a process
- Start server: `node express.js`

### Error: "OpenAI API key is not configured"
- **Solution**: Set `OPENAI_API_KEY` environment variable
- Check: `echo $OPENAI_API_KEY` should show your key
- Fix: `export OPENAI_API_KEY="sk-your-key"` or add to `.env` file

### Error: "No GitHub API tokens found"
- **Solution**: Set at least one `PAT_1` environment variable
- This is needed for GitHub API calls
- Get token: https://github.com/settings/tokens

### Port Already in Use
- **Solution**: Use a different port
- Set: `export PORT=3000` then `node express.js`
- Or kill the process: `lsof -ti:9000 | xargs kill`

## Testing Checklist

- [ ] Server is running (`node express.js`)
- [ ] Server is on port 9000 (check console output)
- [ ] `OPENAI_API_KEY` is set
- [ ] `PAT_1` is set (for GitHub API)
- [ ] Test script uses correct port: `./test-api.sh http://localhost:9000`

## Example Full Test

```bash
# Terminal 1: Start server
cd GitHub-Analyser
export OPENAI_API_KEY="sk-your-key"
export PAT_1="ghp_your_token"
node express.js

# Terminal 2: Run tests
cd GitHub-Analyser
./test-api.sh http://localhost:9000
```

