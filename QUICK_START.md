# Quick Start - Deployment Steps

## 🚀 Complete Deployment Checklist

### Step 1: MongoDB Atlas (5 minutes)
- [ ] Create account at https://www.mongodb.com/cloud/atlas
- [ ] Create free cluster (M0)
- [ ] Add IP: 0.0.0.0/0 (Allow from anywhere)
- [ ] Create database user
- [ ] Get connection string
- [ ] Replace `<password>` with your password
- [ ] Save connection string for later

**Connection String Format:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/qa-share?retryWrites=true&w=majority
```

---

### Step 2: Cloudinary (3 minutes)
- [ ] Create account at https://cloudinary.com/
- [ ] Go to Dashboard
- [ ] Copy Cloud Name, API Key, API Secret
- [ ] Save for Render configuration

---

### Step 3: Deploy Backend to Render (10 minutes)

1. **Push code to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create Render Web Service**
   - [ ] Go to https://render.com/ and sign up
   - [ ] Click "New +" → "Web Service"
   - [ ] Connect your GitHub repository
   - [ ] Configure:
     - Name: `qa-share-backend`
     - Region: Select nearest
     - Branch: `main`
     - Root Directory: `server`
     - Runtime: `Node`
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
     - Instance Type: `Free`

3. **Add Environment Variables in Render**
   - [ ] `MONGODB_URI` = Your MongoDB Atlas connection string
   - [ ] `JWT_SECRET` = Random string (generate at https://randomkeygen.com/)
   - [ ] `NODE_ENV` = `production`
   - [ ] `CLOUDINARY_CLOUD_NAME` = Your Cloudinary cloud name
   - [ ] `CLOUDINARY_API_KEY` = Your Cloudinary API key
   - [ ] `CLOUDINARY_API_SECRET` = Your Cloudinary API secret
   - [ ] `PORT` = `5001`

4. **Deploy**
   - [ ] Click "Create Web Service"
   - [ ] Wait 5-10 minutes
   - [ ] Copy your backend URL: `https://your-app.onrender.com`

---

### Step 4: Deploy Frontend to Vercel (5 minutes)

1. **Update Environment Variable**
   - Create `client/.env.production`:
     ```
     VITE_API_URL=https://your-backend-app.onrender.com/api
     ```
   - Commit and push:
     ```bash
     git add client/.env.production
     git commit -m "Add production API URL"
     git push origin main
     ```

2. **Deploy to Vercel**
   - [ ] Go to https://vercel.com/ and sign up with GitHub
   - [ ] Click "Add New" → "Project"
   - [ ] Import your repository
   - [ ] Configure:
     - Framework Preset: `Vite`
     - Root Directory: `client`
     - Build Command: Leave as default (`npm run build`)
     - Output Directory: `dist`

3. **Add Environment Variables in Vercel**
   - [ ] Go to Project Settings → Environment Variables
   - [ ] Add: `VITE_API_URL` = `https://your-backend-app.onrender.com/api`
   - [ ] Apply to: All environments

4. **Deploy**
   - [ ] Click "Deploy"
   - [ ] Wait 2-5 minutes
   - [ ] Your app is live! 🎉

---

### Step 5: Update Backend CORS (2 minutes)

After Vercel deployment:
1. [ ] Go to Render dashboard
2. [ ] Add environment variable:
   - `FRONTEND_URL` = `https://your-app.vercel.app`
3. [ ] Service will redeploy automatically

---

### Step 6: Test Your App ✅

Visit your Vercel URL and test:
- [ ] Register new user
- [ ] Login
- [ ] Create project
- [ ] Create test case
- [ ] Create bug
- [ ] Upload file
- [ ] All features working

---

## 📝 Important URLs to Save

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | `https://your-app.vercel.app` | Your live app |
| **Backend** | `https://your-app.onrender.com` | API server |
| **MongoDB** | MongoDB Atlas Dashboard | Database |
| **Cloudinary** | Cloudinary Dashboard | File storage |

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Render logs in dashboard
# Common issues:
# - Missing environment variables
# - Wrong MongoDB connection string
# - Build failed
```

### Frontend can't connect
```bash
# Check browser console (F12)
# Common issues:
# - Wrong VITE_API_URL
# - CORS not allowing frontend domain
# - Backend is asleep (Render free tier)
```

### Database errors
```bash
# Check MongoDB Atlas
# Common issues:
# - IP not whitelisted
# - Wrong credentials
# - Database user doesn't have permissions
```

---

## 🔄 Future Updates

To deploy updates:

**Backend:**
```bash
git add .
git commit -m "Update backend"
git push origin main
# Render auto-deploys
```

**Frontend:**
```bash
git add .
git commit -m "Update frontend"
git push origin main
# Vercel auto-deploys
```

---

## 💰 Free Tier Limits

- **Render**: Backend sleeps after 15 min inactivity (wakes on first request)
- **Vercel**: 100GB bandwidth/month
- **MongoDB Atlas**: 512MB storage
- **Cloudinary**: 25 credits/month (about 25GB bandwidth)

---

## 🎓 Default Test Accounts

After first deployment, these accounts will be created:

**QA User:**
- Email: `qa@test.com`
- Password: `password123`

**Dev User:**
- Email: `dev@test.com`
- Password: `password123`

**Change these passwords immediately after first login!**
