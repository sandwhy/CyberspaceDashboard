# 🚀 CyberspaceEDU Deployment Guide

This guide explains how to deploy the Cyberspace Dashboard (Frontend), API (Backend), and Database (TiDB Cloud) to a production environment.

---

## 1. Database Setup (TiDB Cloud)

TiDB Cloud is a MySQL-compatible serverless database.

1.  **Create Cluster**: Sign up at [tidbcloud.com](https://tidbcloud.com) and create a **Serverless (Free)** cluster.
2.  **Create Database**: In the TiDB SQL Editor, run:
    ```sql
    CREATE DATABASE cyberspace_db;
    ```
3.  **Import SQL**: 
    *   Open `cyberspace-server/database.sql` in your code editor.
    *   **CRITICAL**: Find and replace all occurrences of `utf8mb4_0900_ai_ci` with `utf8mb4_general_ci`.
    *   Copy the modified SQL.
    *   In TiDB SQL Editor, run `USE cyberspace_db;` and then paste/run your SQL script.
4.  **Get Credentials**: Click **Connect** on the TiDB dashboard to get your Host, User, and Password.

---

## 2. Backend Deployment (Vercel)

The backend is located in the `cyberspace-server` directory.

1.  **GitHub**: Push your code to GitHub.
2.  **Vercel Project**:
    *   Add a new project in Vercel from your repo.
    *   **Root Directory**: Set this to `cyberspace-server`.
3.  **Environment Variables**: Add the following in Vercel Settings:
    *   `DB_HOST`: Your TiDB Host.
    *   `DB_USER`: Your TiDB User.
    *   `DB_PASSWORD`: Your TiDB Password.
    *   `DB_NAME`: `cyberspace_db`
    *   `PORT`: `4000` (TiDB default)
4.  **Deploy**: Once live, copy the generated Vercel URL (e.g., `https://cyberspace-api.vercel.app`).

---

## 3. Frontend Deployment (Vercel)

The frontend is located in the `cyberspace-dashboard` directory.

1.  **Vercel Project**:
    *   Add a new project in Vercel from the same repo.
    *   **Root Directory**: Set this to `cyberspace-dashboard`.
2.  **Environment Variables**:
    *   `NUXT_PUBLIC_API_BASE`: The Backend URL you copied in the previous step.
3.  **Deploy**: Vercel will automatically detect Nuxt and build the project.

---

## 🛠 Common Troubleshooting

### "Parsing SQL Failed" in TiDB
*   **Fix**: Ensure you have replaced `utf8mb4_0900_ai_ci` with `utf8mb4_general_ci` in your `.sql` file.
*   **Fix**: Ensure every statement (like `USE database;`) ends with a semicolon `;`.

### "Connection Refused" on Vercel
*   **Fix**: Check that `DB_HOST` is correct and that you haven't included `https://` in the host string.
*   **Fix**: Ensure `ssl: { rejectUnauthorized: false }` is present in your `db.js` (I have already added this for you).

### "Images Not Showing"
*   **Note**: Local file uploads to `/uploads` will NOT persist on Vercel. 
*   **Future Step**: You should integrate a cloud storage provider like **Cloudinary** for permanent image hosting.
