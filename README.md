# CyberspaceEDU

This repository contains the Cyberspace Dashboard (Frontend) and the Cyberspace Server (Backend API).

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (Can be via XAMPP, WAMP, or standalone)
- Git

## 1. Database Setup & Initialization

You need to create a database and initialize its tables before running the server. You can do this using the Command Line or a GUI like phpMyAdmin.

### Option A: Using Command Line (CLI)
1. Open a terminal and log into your MySQL server:
   ```bash
   mysql -u root -p
   ```
2. Create the database:
   ```sql
   CREATE DATABASE cyberspace_testdb;
   USE cyberspace_testdb;
   ```
3. Import the SQL file containing the tables:
   ```sql
   SOURCE cyberspace-server/database.sql;
   ```
4. Type `exit` to leave the MySQL prompt.

### Option B: Using phpMyAdmin (XAMPP / WAMP)
1. Open your browser and navigate to `http://localhost/phpmyadmin`.
2. Click on **New** in the left sidebar to create a new database.
3. Name it `cyberspace_testdb` and click **Create**.
4. Select the newly created `cyberspace_testdb` from the left sidebar.
5. Click on the **Import** tab at the top.
6. Click **Choose File** and select the `database.sql` file located inside the `cyberspace-server` folder.
7. Scroll down and click **Import** to create all the tables.

## 2. Backend Setup (cyberspace-server)
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd cyberspace-server
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `cyberspace-server` directory. You can use the following template:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=cyberspace_testdb
   ```
   *(Make sure to replace `your_mysql_password` with your actual MySQL root password)*
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend should now be running on `http://localhost:5000`.

## 3. Frontend Setup (cyberspace-dashboard)
1. Open a new terminal window/tab and navigate to the frontend directory:
   ```bash
   cd cyberspace-dashboard
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `cyberspace-dashboard` directory:
   ```env
   NUXT_PUBLIC_API_BASE=http://localhost:5000
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend should now be running on `http://localhost:3000`.

## 4. Usage
Once both servers are running:
- Access the web interface at `http://localhost:3000`.
- The backend API will automatically handle requests at `http://localhost:5000`.
