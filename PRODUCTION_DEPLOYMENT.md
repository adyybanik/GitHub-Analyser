# Production Deployment Guide

This guide will help you deploy the GitHub Analyzer API to production on Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional but recommended): `npm i -g vercel`
3. **GitHub Repository**: Your code should be pushed to GitHub
4. **API Keys Ready**:
   - OpenAI API Key
   - GitHub Personal Access Token(s)

## Step 1: Prepare Your Repository

Make sure all changes are committed and pushed:

```bash
git add .
git commit -m "Production ready: security and validation improvements"
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended for First Time)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New Project"**
3. **Import your GitHub repository**:
   - Select your repository from the list
   - Click "Import"
4. **Configure Project**:
   - Framework Preset: **Other** (or leave as auto-detected)
   - Root Directory: `./` (default)
   - Build Command: Leave empty (not needed for serverless functions)
   - Output Directory: Leave empty
   - Install Command: `npm install`
5. **Click "Deploy"**

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time - will ask questions)
vercel

# Deploy to production
vercel --prod
```

## Step 3: Configure Environment Variables

**CRITICAL**: Set these environment variables in Vercel dashboard before using the API.

### Required Environment Variables

1. **OpenAI API Key** (Required for `/api/analyze`)
   ```
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

2. **GitHub Personal Access Token(s)** (Required for GitHub API calls)
   ```
   PAT_1=ghp_your_github_token_here
   PAT_2=ghp_another_token_here  (optional, for rate limit handling)
   PAT_3=ghp_third_token_here    (optional, for rate limit handling)
   ```

### Optional Environment Variables

```
CACHE_SECONDS=86400                    # Cache duration (default: 24 hours)
WHITELIST=username1,username2          # Restrict to specific users (optional)
GIST_WHITELIST=gist_id1,gist_id2      # Restrict gist access (optional)
EXCLUDE_REPO=repo1,repo2              # Exclude repos from stats (optional)
```

### How to Set Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your actual API key
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**
5. **IMPORTANT**: Redeploy your project after adding environment variables

## Step 4: Verify Deployment

After deployment, you'll get a URL like: `https://your-project.vercel.app`

### Test the API

```bash
# Replace with your actual Vercel URL
curl "https://your-project.vercel.app/api/analyze?username=octocat&job_title=Senior%20Engineer&required_skills=JavaScript,React&seniority=senior&focus=fullstack"
```

### Test with the test script

```bash
./test-api.sh https://your-project.vercel.app
```

## Step 5: Production Checklist

- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] `OPENAI_API_KEY` environment variable set
- [ ] At least one `PAT_1` environment variable set
- [ ] Tested the `/api/analyze` endpoint
- [ ] Verified rate limiting works (429 response after 10 requests)
- [ ] Verified input validation works (400 responses for invalid inputs)
- [ ] Checked that API key is NOT in query parameters (security)
- [ ] Monitored first few requests for errors

## Step 6: Monitor and Optimize

### Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → **Logs**
2. Monitor for errors, timeouts, or rate limit issues

### Performance Monitoring

- **Function Duration**: Should be under 60 seconds (configured timeout)
- **Memory Usage**: Configured at 256MB for analyze endpoint
- **Rate Limiting**: 10 requests/minute per IP (in-memory, resets per instance)

### Cost Monitoring

- **OpenAI API**: Monitor usage in OpenAI dashboard
- **Vercel**: Check usage in Vercel dashboard
- **GitHub API**: Monitor rate limits (5,000 requests/hour per token)

## Production Considerations

### Rate Limiting

The current implementation uses in-memory rate limiting, which means:
- ✅ Works well for single-instance deployments
- ⚠️ Each Vercel serverless instance has its own rate limit counter
- 💡 For production at scale, consider Redis-based rate limiting

### Timeout Configuration

- Current timeout: **60 seconds** (configured in `vercel.json`)
- This matches OpenAI API timeout
- For Vercel Pro plan, you can increase if needed

### Security Best Practices

✅ **Implemented**:
- API key only via environment variables (not query params)
- Input validation and sanitization
- Rate limiting
- Error handling without exposing internals

⚠️ **Consider Adding**:
- API authentication (API keys for your users)
- Request logging and monitoring
- CORS configuration if needed
- IP allowlisting if required

### Scaling Considerations

1. **Multiple GitHub PATs**: Add `PAT_2`, `PAT_3`, etc. for better rate limit handling
2. **Caching**: Responses are cached based on `cache_seconds` parameter
3. **Cold Starts**: First request may be slower (serverless cold start)
4. **Concurrent Requests**: Vercel handles this automatically

## Troubleshooting

### Error: "OpenAI API key is not configured"
- **Solution**: Set `OPENAI_API_KEY` in Vercel environment variables
- **Action**: Settings → Environment Variables → Add → Redeploy

### Error: "No GitHub API tokens found"
- **Solution**: Set at least `PAT_1` in Vercel environment variables
- **Action**: Settings → Environment Variables → Add → Redeploy

### Error: Timeout (504)
- **Solution**: Check that `maxDuration: 60` is set in `vercel.json` for `api/analyze.js`
- **Action**: Verify deployment includes updated `vercel.json`

### Error: Rate limit exceeded (429)
- **Solution**: This is expected behavior (10 requests/minute)
- **Action**: Wait 1 minute or implement Redis-based rate limiting for production

### Function timeout
- **Solution**: Upgrade to Vercel Pro plan for longer timeouts
- **Current**: 60 seconds (Hobby plan limit)
- **Pro Plan**: Up to 300 seconds

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update your API calls to use the custom domain

## Example Production URL

Once deployed, your API will be available at:

```
https://your-project.vercel.app/api/analyze
```

Example request:
```bash
curl "https://your-project.vercel.app/api/analyze?username=octocat&job_title=Senior%20Engineer&required_skills=JavaScript,React&seniority=senior&focus=fullstack"
```

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Set environment variables
3. ✅ Test the endpoint
4. 📊 Set up monitoring (Vercel Analytics, Sentry, etc.)
5. 📈 Monitor costs (OpenAI, Vercel)
6. 🔒 Consider additional security measures
7. 📝 Document your API for users

## Support

- Vercel Docs: https://vercel.com/docs
- OpenAI API Docs: https://platform.openai.com/docs
- GitHub API Docs: https://docs.github.com/en/rest

