# Vercel Deployment Guide

This guide explains how to deploy the Casper DeFi Yield Optimizer frontend to Vercel.

## Prerequisites

1. A GitHub account
2. A Vercel account (sign up at [vercel.com](https://vercel.com))
3. This repository pushed to GitHub

## Quick Deployment (Recommended)

### Option 1: Deploy via Vercel Dashboard

1. **Go to Vercel**: Visit [vercel.com](https://vercel.com) and sign in

2. **Import Project**:
   - Click "Add New Project"
   - Select "Import Git Repository"
   - Choose your GitHub repository: `le-stagiaire-ag2r/caspernews`

3. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Environment Variables**:
   Add these environment variables in Vercel dashboard:
   ```
   VITE_CASPER_NETWORK=casper-test
   VITE_CONTRACT_HASH=hash-f49d339a1e82cb95cc1ce2eea5c0c7589e8694d3678d0ab9432e57ea00e1d1df
   VITE_CASPER_RPC_URL=https://rpc.testnet.casperlabs.io/rpc
   VITE_API_URL=http://localhost:3001/api
   VITE_APP_NAME=Casper DeFi Yield Optimizer
   VITE_APP_VERSION=1.0.0
   ```

5. **Deploy**: Click "Deploy" button

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from root directory
cd /path/to/caspernews
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name: casper-defi-yield-optimizer
# - In which directory is your code located? frontend
# - Override build settings? N

# For production deployment
vercel --prod
```

## Post-Deployment Steps

After deployment, Vercel will give you a URL like: `https://casper-defi-yield-optimizer.vercel.app`

### 1. Test the Deployment

- Visit your Vercel URL
- Check that the UI loads correctly
- Try connecting your Casper wallet
- Verify contract hash is displayed correctly

### 2. Update Backend URL (if deploying backend separately)

If you deploy the backend separately, update the `VITE_API_URL` environment variable:

1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Update `VITE_API_URL` to your backend URL
4. Redeploy the project

## Directory Structure

```
caspernews/
├── frontend/              # Frontend application (deployed to Vercel)
│   ├── dist/             # Build output
│   ├── src/              # Source code
│   ├── package.json
│   └── vite.config.ts
├── backend/              # Backend (deploy separately or use Vercel serverless)
├── contracts/            # Smart contracts (already deployed)
├── vercel.json          # Vercel configuration
└── VERCEL_DEPLOYMENT.md # This file
```

## Deploying Backend (Optional)

The backend can be deployed to:

### Option A: Vercel Serverless Functions

Convert backend routes to Vercel serverless functions:

1. Create `api/` directory in root
2. Move backend routes to `api/` as individual files
3. Update `vercel.json` to handle API routes

### Option B: External Service

Deploy backend to:
- **Heroku**: Free tier available
- **Railway**: Generous free tier
- **Render**: Free tier with auto-sleep
- **DigitalOcean App Platform**

Example for Heroku:
```bash
cd backend
heroku create casper-yield-optimizer-api
git push heroku main
```

## Updating the Deployment

### Automatic Deployments

Vercel automatically deploys on:
- Every push to `main` branch (production)
- Every push to other branches (preview deployments)

### Manual Deployments

```bash
# Deploy latest changes
vercel

# Deploy to production
vercel --prod
```

## Environment Variables Reference

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_CASPER_NETWORK` | `casper-test` | Casper network name |
| `VITE_CONTRACT_HASH` | `hash-f49d339...` | Deployed contract package hash |
| `VITE_CASPER_RPC_URL` | `https://rpc.testnet...` | Casper RPC endpoint |
| `VITE_API_URL` | Backend URL | Backend API endpoint |
| `VITE_APP_NAME` | App name | Application display name |
| `VITE_APP_VERSION` | `1.0.0` | Application version |

## Troubleshooting

### Build Fails

**Error**: `Module not found` or `Cannot find module`
- **Solution**: Ensure all dependencies are in `frontend/package.json`
- Run `npm install` locally to verify

**Error**: `Build failed` with TypeScript errors
- **Solution**: Run `npm run build` locally to see full error
- Fix TypeScript errors before deploying

### Environment Variables Not Working

**Problem**: `.env` values not loading
- **Solution**: In Vercel, all environment variables must be prefixed with `VITE_`
- Add them in Vercel dashboard under Settings → Environment Variables

### Page Shows 404

**Problem**: Routes not working
- **Solution**: Ensure `vercel.json` has correct SPA routing configuration
- Check that build output is in `frontend/dist`

### Wallet Connection Fails

**Problem**: Cannot connect to wallet
- **Solution**: Check browser console for errors
- Verify CSPR.click packages are installed correctly
- Ensure CSP headers allow wallet connections

## Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Go to Settings → Domains
3. Add your custom domain
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning

## Performance Optimization

### Recommended Vercel Settings

- **Framework**: Vite
- **Node Version**: 18.x
- **Build & Development Settings**:
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

### Caching

Vercel automatically handles:
- Static asset caching (CSS, JS, images)
- Edge network distribution
- Automatic HTTPS

## Monitoring

View deployment logs and analytics:
1. Go to Vercel dashboard
2. Select your project
3. View Deployments tab for logs
4. View Analytics tab for performance metrics

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
- **Project Issues**: https://github.com/le-stagiaire-ag2r/caspernews/issues

## Next Steps

After successful deployment:
1. Share your Vercel URL for the hackathon submission
2. Test all functionality on the live site
3. Consider implementing full transaction support (currently placeholders)
4. Add analytics and monitoring
5. Deploy backend for full functionality

---

**Deployment Status**: ✅ Ready for Vercel deployment

**Live URL** (after deployment): `https://casper-defi-yield-optimizer.vercel.app`
