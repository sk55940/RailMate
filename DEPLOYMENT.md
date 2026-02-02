# Deploying RailMate to Vercel

## Prerequisites
- GitHub account with repository pushed
- Vercel account (sign up at vercel.com)
- MongoDB Atlas database (or other cloud MongoDB)

## Step-by-Step Deployment Guide

### 1. Prepare Your Environment Variables

Create these environment variables in Vercel (you'll add them in the dashboard):

**Backend Variables:**
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from project root:
```bash
vercel
```

4. Follow the prompts and add environment variables when asked

5. For production deployment:
```bash
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository (BishalSaini/AI-RR)
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install --prefix frontend && npm install --prefix backend`

5. Add Environment Variables:
   - Go to "Environment Variables" section
   - Add all the variables listed above
   - Make sure to select "Production", "Preview", and "Development" for each

6. Click "Deploy"

### 3. Configure MongoDB Atlas

1. Go to MongoDB Atlas dashboard
2. Navigate to Network Access
3. Add Vercel's IP addresses or use `0.0.0.0/0` (allow from anywhere)
4. Update your connection string in environment variables

### 4. Update Frontend API Configuration

The frontend is already configured to use relative URLs (`/api`), which will work with Vercel's routing.

### 5. Post-Deployment Steps

1. Test all endpoints:
   - User registration/login
   - Complaint creation
   - File uploads
   - Chatbot functionality

2. Monitor logs in Vercel dashboard for any errors

3. Set up custom domain (optional):
   - Go to Project Settings > Domains
   - Add your custom domain

### 6. File Upload Considerations

⚠️ **Important**: Vercel's serverless functions have limitations:
- File system is read-only except `/tmp`
- Uploaded files won't persist between deployments
- Consider using cloud storage for production:
  - **Cloudinary** (recommended for images)
  - **AWS S3**
  - **Azure Blob Storage**

### 7. Alternative: Split Deployment (Recommended for Production)

For better performance, consider splitting frontend and backend:

**Frontend on Vercel:**
- Deploy only the frontend folder
- Fast, optimized static hosting

**Backend on:**
- **Render.com** (Free tier available)
- **Railway.app** (Better for Node.js apps)
- **Heroku**
- **DigitalOcean App Platform**

Then update `VITE_API_URL` in frontend to point to your backend URL.

## Troubleshooting

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### API Not Working
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check CORS settings in backend

### File Uploads Not Working
- Implement cloud storage solution (Cloudinary recommended)
- Update upload middleware to use cloud storage

## Monitoring

- Use Vercel Analytics for frontend performance
- Set up error tracking (Sentry recommended)
- Monitor MongoDB Atlas metrics

## Cost Considerations

**Vercel Free Tier Includes:**
- 100GB bandwidth/month
- Unlimited deployments
- Serverless function executions (limited)

**Paid Plans:**
- Pro: $20/month (recommended for production)
- Better limits and support

## Commands Reference

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Deploying Vite Apps](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Node.js on Vercel](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)
