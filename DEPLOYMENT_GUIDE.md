# 🌐 Cloud Production Deployment Guide

This guide walks you through deploying **ExpenseTracker Pro** across 3 cloud platforms:
- 🛢️ **Database**: [Aiven](https://aiven.io/) (Managed MySQL)
- 🚀 **Backend**: [Render](https://render.com/) (Spring Boot 3 Java Service)
- ⚡ **Frontend**: [Vercel](https://vercel.com/) (Vite + React Single-Page Application)

---

## 📍 Step 1: Deploy Database on Aiven (MySQL)

1. Sign up/Log in to [Aiven Console](https://console.aiven.io/).
2. Click **Create Service** $\rightarrow$ Select **MySQL**.
3. Choose the **Free Plan** or **Startup Plan** and select your preferred region (e.g. `aws-ap-south-1` Mumbai or `aws-eu-west-1`).
4. Name your service (e.g. `expensetracker-db`) and click **Create Service**.
5. Once running (takes ~2 minutes), copy the connection credentials from your Aiven Overview panel:
   - **Host**: `expensetracker-db-xxx.aivencloud.com`
   - **Port**: `24443` (or given port)
   - **Database Name**: `defaultdb` (or `expense_tracker`)
   - **User**: `avnadmin`
   - **Password**: `<YOUR_AIVEN_PASSWORD>`
   - **SSL Mode**: `REQUIRED`

6. Form your JDBC Connection URL:
   ```env
   jdbc:mysql://<HOST>:<PORT>/defaultdb?sslmode=REQUIRED
   ```

---

## 📍 Step 2: Deploy Backend on Render

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** $\rightarrow$ Select **Web Service**.
3. Connect your GitHub repository: `Ganesh40292/expense-tracker-pro`.
4. Configure the Web Service settings:
   - **Name**: `expensetracker-api`
   - **Root Directory**: `backend`
   - **Environment**: `Docker` (or `Java`)
   - **Region**: Same as Aiven database region (e.g. Singapore / Frankfurt)
   - **Branch**: `main`

5. Add **Environment Variables** under Render Settings:

   | Key | Example Value | Description |
   | :--- | :--- | :--- |
   | `DB_URL` | `jdbc:mysql://<AIVEN_HOST>:<PORT>/defaultdb?sslmode=REQUIRED` | Aiven MySQL JDBC URL |
   | `DB_USERNAME` | `avnadmin` | Aiven Database User |
   | `DB_PASSWORD` | `<YOUR_AIVEN_PASSWORD>` | Aiven Database Password |
   | `JWT_SECRET` | `ExpenseTrackerSuperSecretKeyThatIsAtLeast32BytesLong2026!!` | Secret key for JWT auth |
   | `FRONTEND_URL` | `https://your-app.vercel.app` | Vercel production frontend URL |
   | `GEMINI_API_KEY` | `AIzaSy...` | Gemini 2.0 Multimodal API Key |
   | `PORT` | `8080` | Render port |

6. Click **Create Web Service**. Render will automatically build the container and run Flyway database migrations.
7. Once deployed, note down your backend live URL: `https://expensetracker-api.onrender.com`.

---

## 📍 Step 3: Deploy Frontend on Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** $\rightarrow$ Select **Project**.
3. Import your GitHub repository: `Ganesh40292/expense-tracker-pro`.
4. Configure the Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add **Environment Variables** under Vercel Project Settings:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://expensetracker-api.onrender.com/api` | Your Render backend live API URL |

6. Click **Deploy**. Vercel will build and host your single-page app globally with automatic SSL.

---

## 📋 Quick Environment Variables Cheat Sheet

```env
# ── Render Backend Env Vars ──
DB_URL=jdbc:mysql://expensetracker-db-xxx.aivencloud.com:24443/defaultdb?sslmode=REQUIRED
DB_USERNAME=avnadmin
DB_PASSWORD=YOUR_AIVEN_PASSWORD
JWT_SECRET=ExpenseTrackerSuperSecretKeyThatIsAtLeast32BytesLong2026!!
FRONTEND_URL=https://expense-tracker-pro.vercel.app
GEMINI_API_KEY=YOUR_GEMINI_KEY

# ── Vercel Frontend Env Var ──
VITE_API_URL=https://expensetracker-api.onrender.com/api
```
