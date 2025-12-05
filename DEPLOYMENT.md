# Deployment Guide

## Prerequisites
1. MongoDB Atlas account (free tier available)
2. Render account (free tier available)
3. Vercel account (free tier available)
4. Cloudinary account (for file uploads - free tier available)

---

## 1. MongoDB Atlas Setup

### Create Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a new cluster (free tier M0)
4. Wait for cluster to be created (2-5 minutes)

### Configure Network Access
1. In your cluster, go to "Network Access"
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
4. Confirm

### Create Database User
1. Go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username and password (save these!)
5. Set role to "Read and write to any database"
6. Add user

### Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `qa-share` (or your preferred database name)

Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/qa-share?retryWrites=true&w=majority`

---

## 2. Cloudinary Setup (for file uploads)

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free account
3. Go to Dashboard
4. Note down:
   - Cloud Name
   - API Key
   - API Secret

---

## 3. Backend Deployment on Render

### Prepare Backend
1. Make sure your `server/package.json` has the correct start script:
   ```json
   "scripts": {
     "start": "node dist/index.js",
     "build": "tsc"
   }
   ```

### Deploy to Render
1. Go to [Render](https://render.com/)
2. Sign up or log in
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `qa-share-backend` (or your choice)
   - **Region**: Choose closest to you
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### Add Environment Variables
In Render dashboard, add these environment variables:
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A strong random string (use a password generator)
- `NODE_ENV`: `production`
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

### Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Note your backend URL: `https://your-app.onrender.com`

---

## 4. Frontend Deployment on Vercel

### Update API URL
1. Create `.env.production` file in `client/` directory:
   ```
   VITE_API_URL=https://your-backend-app.onrender.com/api
   ```

### Deploy to Vercel
1. Go to [Vercel](https://vercel.com/)
2. Sign up or log in with GitHub
3. Click "Add New" → "Project"
4. Import your repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Add Environment Variables
In Vercel project settings → Environment Variables:
- **Key**: `VITE_API_URL`
- **Value**: `https://your-backend-app.onrender.com/api`
- Check all environments (Production, Preview, Development)

### Deploy
1. Click "Deploy"
2. Wait for deployment (2-5 minutes)
3. Your app will be live at: `https://your-app.vercel.app`

---

## 5. Post-Deployment

### Update CORS Settings
1. In your Render backend dashboard, update environment variables or code to allow your Vercel domain
2. The current CORS setup allows all origins, but for production you should restrict it

### Test Your Application
1. Visit your Vercel URL
2. Try registering a new user
3. Create a project
4. Test all features

### Monitor
- **Render**: Check logs in dashboard for backend issues
- **Vercel**: Check deployment logs and function logs
- **MongoDB Atlas**: Monitor database performance

---

## 6. Free Tier Limitations

### Render Free Tier
- Spins down after 15 minutes of inactivity
- First request after spin-down will be slow (30-60 seconds)
- 750 hours/month free

### Vercel Free Tier
- 100GB bandwidth/month
- Unlimited deployments
- Always-on (no spin-down)

### MongoDB Atlas Free Tier
- 512MB storage
- Shared CPU
- Perfect for development and small apps

---

## Troubleshooting

### Backend won't start
- Check Render logs
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

### Frontend can't connect to backend
- Check CORS settings in backend
- Verify VITE_API_URL is correct
- Check browser console for errors

### Database connection fails
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Ensure database user has correct permissions

### Files won't upload
- Verify Cloudinary credentials
- Check file size limits
- Monitor Cloudinary usage quota

---

## Local Development with Production Database

Create `server/.env`:
```
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-secret-key
PORT=5001
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Create `client/.env.local`:
```
VITE_API_URL=http://localhost:5001/api
```

Run locally:
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```
