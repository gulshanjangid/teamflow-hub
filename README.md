# Team Task Manager (Teamflow-hub)

A full-stack web application for managing projects, teams, and tasks with role-based access control.

---

# 🚀 Features

## Authentication

* User Signup & Login
* JWT-based Authentication
* Password Hashing with bcrypt
* Protected Routes

## Project Management

* Create Projects
* Update/Delete Projects
* Add/Remove Team Members
* Project-based Collaboration

## Task Management

* Create Tasks
* Assign Tasks to Members
* Task Status Tracking
* Priority Levels
* Due Dates
* Task Filtering

## Dashboard

* Total Tasks Overview
* Completed Tasks
* Pending Tasks
* Overdue Tasks
* Project Statistics

## Role-Based Access Control (RBAC)

### Admin

* Manage projects
* Manage members
* Create/update/delete all tasks

### Member

* View assigned projects
* Update assigned tasks
* Change task status

---

# 🛠 Tech Stack

## Frontend

* React.js / Next.js
* Tailwind CSS
* Axios
* React Router
* Redux Toolkit / Context API

## Backend

* Node.js
* Express.js

## Database

* PostgreSQL / MySQL
* Prisma ORM / Sequelize

## Authentication

* JWT (JSON Web Token)
* bcrypt

---

# 📁 Project Structure

```text
team-task-manager/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── store/
│   │   └── App.jsx
│   │
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── services/
│   │   ├── config/
│   │   └── app.js
│   │
│   └── package.json
│
└── README.md
```

---

# ⚙️ Installation

## 1. Clone Repository

```bash
git clone https://github.com/your-username/team-task-manager.git
cd team-task-manager
```

---

# 🔧 Backend Setup

## Install Dependencies

```bash
cd backend
npm install
```

## Create .env File

```env
PORT=5000
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
```

## Run Backend

```bash
npm run dev
```

Backend will run on:

```text
http://localhost:5000
```

---

# 🎨 Frontend Setup

## Install Dependencies

```bash
cd frontend
npm install
```

## Run Frontend

```bash
npm run dev
```

Frontend will run on:

```text
http://localhost:5173
```

---

# 🗄 Database Schema

## Users Table

| Field    | Type   |
| -------- | ------ |
| id       | UUID   |
| name     | String |
| email    | String |
| password | String |

## Projects Table

| Field       | Type    |
| ----------- | ------- |
| id          | UUID    |
| name        | String  |
| description | Text    |
| createdBy   | User ID |

## Tasks Table

| Field       | Type                      |
| ----------- | ------------------------- |
| id          | UUID                      |
| title       | String                    |
| description | Text                      |
| status      | TODO / IN_PROGRESS / DONE |
| priority    | LOW / MEDIUM / HIGH       |
| dueDate     | Date                      |
| assignedTo  | User ID                   |
| projectId   | Project ID                |

---

# 🔐 Authentication

Authentication is implemented using:

* JWT Tokens
* bcrypt password hashing
* Protected middleware

Example Authorization Header:

```http
Authorization: Bearer your_jwt_token
```

---

# 📡 API Endpoints

# Auth APIs

| Method | Endpoint         | Description   |
| ------ | ---------------- | ------------- |
| POST   | /api/auth/signup | Register user |
| POST   | /api/auth/login  | Login user    |

---

# User APIs

| Method | Endpoint      | Description        |
| ------ | ------------- | ------------------ |
| GET    | /api/users    | Get all users      |
| GET    | /api/users/me | Get logged-in user |

---

# Project APIs

| Method | Endpoint          | Description       |
| ------ | ----------------- | ----------------- |
| POST   | /api/projects     | Create project    |
| GET    | /api/projects     | Get all projects  |
| GET    | /api/projects/:id | Get project by ID |
| PUT    | /api/projects/:id | Update project    |
| DELETE | /api/projects/:id | Delete project    |

---

# Member APIs

| Method | Endpoint                            | Description   |
| ------ | ----------------------------------- | ------------- |
| POST   | /api/projects/:id/members           | Add member    |
| DELETE | /api/projects/:id/members/:memberId | Remove member |

---

# Task APIs

| Method | Endpoint              | Description        |
| ------ | --------------------- | ------------------ |
| POST   | /api/tasks            | Create task        |
| GET    | /api/tasks            | Get all tasks      |
| GET    | /api/tasks/:id        | Get task by ID     |
| PUT    | /api/tasks/:id        | Update task        |
| PATCH  | /api/tasks/:id/status | Update task status |
| DELETE | /api/tasks/:id        | Delete task        |

---

# Dashboard APIs

| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| GET    | /api/dashboard/stats | Dashboard statistics |

---

# ✅ Validations

Implemented validations:

* Required fields
* Email validation
* Password minimum length
* Due date validation
* Role validation
* Request body sanitization

---

# 🔒 Security Features

* Password hashing
* JWT authentication
* Input validation
* Role-based authorization
* Environment variables
* Secure API routes

---

# 📊 Dashboard Features

* Total Projects
* Total Tasks
* Completed Tasks
* Pending Tasks
* Overdue Tasks
* Task Status Summary

---

# 🌐 Deployment

## Frontend

* Vercel
* Netlify

## Backend

* Render
* Railway

## Database

* PostgreSQL (Supabase / Neon)
* MongoDB Atlas

---

# 🧪 Testing

## Backend Testing

* API Testing
* Authentication Testing
* Authorization Testing
* CRUD Operations

## Frontend Testing

* Form Validation
* Route Protection
* Responsive UI

---

# 📸 Screenshots

Add project screenshots here.

Example:

```md
![Dashboard](./screenshots/dashboard.png)
```

---

# 📌 Future Enhancements

* Real-time notifications
* Kanban board
* File uploads
* Task comments
* Email invitations
* Activity logs
* Dark mode

---

# 👨‍💻 Author

Your Name

---

# 📄 License

This project is licensed under the MIT License.
