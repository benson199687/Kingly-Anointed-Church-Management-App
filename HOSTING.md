# 🌐 Church Discipleship Academy - Hosting & Deployment Guide

This guide provides step-by-step instructions for deploying and hosting this full-stack application (Vite + React frontend and Express + Node backend) on **Vercel** and on **standard web hosts** (such as Render, Railway, Heroku, or a VPS).

---

## ⚡ Deployment Option 1: Vercel (Recommended for Serverless)

Vercel is the easiest and fastest way to host your full-stack Vite + Express application. 

### 📁 Configured Files
We have already pre-configured the following files for you:
1. **`vercel.json`**: Instructs Vercel's Edge Router to forward all `/api/*` routes to the serverless entrypoint and use SPA routing fallback for frontend pages.
2. **`api/index.ts`**: The serverless function bridge that exports and runs the Express server on Vercel's serverless infrastructure.
3. **Lazy-loaded Development Modules**: The Express server (`server.ts`) dynamically loads Vite in development to avoid unnecessary production-time/runtime dependencies.

### 🚀 Step-by-Step Vercel Deployment
1. **Push your code to Git**: Push this project directory to your GitHub, GitLab, or Bitbucket account.
2. **Log in to Vercel**: Visit [vercel.com](https://vercel.com) and click **Add New** -> **Project**.
3. **Import your Repository**: Select your imported repository from your Git account.
4. **Configure Project Settings**:
   - Vercel will automatically detect **Vite** as your framework.
   - **Build Command**: Vercel will automatically run `npm run build` (which builds the Vite frontend and compiles the Node backend).
   - **Output Directory**: `dist`
5. **Add Environment Variables**:
   In the **Environment Variables** section, add:
   - `GEMINI_API_KEY`: *Your Gemini AI API Key (required for sermon question generation)*.
   - `NODE_ENV`: `production`
6. **Click Deploy** 🎉! Your application will be live at `https://your-project.vercel.app`.

> ⚠️ **State Persistence on Vercel**: 
> Serverless platforms like Vercel have an **ephemeral/stateless filesystem**. The local file database (`src/db.json`) is initialized at startup and copied to writeable memory (`/tmp/db.json`), but any data added during a session (such as submitting quizzes or completing lessons) will reset when the serverless container recycles. 
> 
> *For durable, persistent data across all users and sessions, it is highly recommended to integrate with a cloud-hosted database like Google Cloud Firestore (Firebase) or a managed PostgreSQL instance.*

---

## 🖥️ Deployment Option 2: Web Hosts (Render, Railway, Heroku, VPS)

For full server persistence (using local files or active persistent volumes) or running a dedicated container, you can host on standard PaaS providers like **Render**, **Railway**, or **Heroku**.

### ⚙️ Server Configurations
- **Build Command**: `npm run build` (Builds Vite assets and bundles `server.ts` with esbuild to `dist/server.cjs`)
- **Start Command**: `npm run start` (Runs the bundled CommonJS server using Node: `node dist/server.cjs`)
- **Port**: Bound to the environment variable `PORT` (falls back to `3000`)
- **Host**: Bound to `0.0.0.0` (required for container ingress routing)

### 🚀 Deploying to Render (Web Service)
1. Push your repository to GitHub or GitLab.
2. Log in to [Render.com](https://render.com) and click **New** -> **Web Service**.
3. Connect your repository.
4. Configure the Web Service:
   - **Language**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
5. Under **Advanced**, add your Environment Variables:
   - `GEMINI_API_KEY`: *Your Gemini AI API Key*
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render allocates this automatically, but you can specify it)
6. Click **Create Web Service**.

### 🚀 Deploying to Railway
1. Push your repository to GitHub.
2. Log in to [Railway.app](https://railway.app) and create a **New Project** -> **Deploy from GitHub repo**.
3. Choose your repository.
4. Railway will automatically build and start the service using the scripts defined in `package.json`.
5. Add your variables (`GEMINI_API_KEY`, `NODE_ENV=production`) in the **Variables** tab.

---

## 🛠️ Local Production Testing
To verify the production build and start cycle locally:
1. Compile the production bundle:
   ```bash
   npm run build
   ```
2. Run the production server:
   ```bash
   npm run start
   ```
3. Open `http://localhost:3000` in your browser.
