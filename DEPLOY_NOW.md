# 🚀 Quick Production Deployment

## Ready to Deploy? Follow These Steps:

### 1. Deploy to Vercel (Choose One Method)

#### Method A: One-Click Deploy (Easiest)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/adyybanik/GitHub-Analyser)

#### Method B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

#### Method C: Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your GitHub repository
4. Click "Deploy"

### 2. Set Environment Variables (CRITICAL!)

After deployment, go to **Settings → Environment Variables** and add:

#### Required:
```
OPENAI_API_KEY = sk-your-openai-key-here
PAT_1 = ghp_your-github-token-here
```

#### Optional (for better rate limiting):
```
PAT_2 = ghp_another-token-here
PAT_3 = ghp_third-token-here
```

**⚠️ IMPORTANT**: After adding environment variables, **redeploy** your project!

### 3. Test Your Production API

Once deployed, you'll get a URL like: `https://your-project.vercel.app`

Test it:
```bash
curl "https://your-project.vercel.app/api/analyze?username=octocat&job_title=Engineer&required_skills=JS&seniority=mid&focus=frontend"
```

### 4. Done! 🎉

Your API is now live in production!

For detailed instructions, see `PRODUCTION_DEPLOYMENT.md`

