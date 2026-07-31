### Summary Checklist Overview

```markdown
# Cyberspace Dashboard - API Endpoints & Feature Implementation Summary Checklist

This document summarizes the current status of the backend API endpoints and system configurations for the Cyberspace Dashboard, outlining implemented features, missing endpoints, and required configurations.

---

## 1. Implemented Endpoints & Features

| Endpoint | Method | Status | Description |
| :--- | :---: | :---: | :--- |
| `/api/lessons` | `GET` | ✅ Done | Fetches all lessons or filters by study program using `?program_id=X`. Returns lessons ordered by `sequence_order ASC`. |
| `/api/lessons` | `POST` | ✅ Done | Creates a new lesson. Handles PDF file uploads via `multer` (`/uploads/pdf/`) or JSON/text payload in `data`. |
| `/api/lessons/:id` | `PUT` | ✅ Done | Updates existing lesson details (`title`, `program_id`, `type`, `data`, `sequence_order`, `is_required`). Supports PDF file replacement. |
| `/api/auth/login` | `POST` | ✅ Done | Authenticates users and returns signed JWT with RBAC claims (`operator`, `admin`, `teacher`). |

---

## 2. Missing Endpoints Required for Full Functionality

| Category | Recommended Endpoint | Method | Priority | Description / Purpose |
| :--- | :--- | :---: | :---: | :--- |
| **Lessons** | `/api/lessons/:id` | `GET` | Medium | Fetches details for a single lesson when navigating directly or refreshing. |
| **Lessons** | `/api/lessons/:id` | `DELETE` | High | Allows admins/operators to remove a lesson from a study program. |
| **Lessons** | `/api/lessons/reorder` | `PATCH` | Medium | Batch updates `sequence_order` for lessons when drag-and-dropped in the sidebar. |
| **Programs** | `/api/programs` | `GET` | High | Lists all study programs (required for Pinia store `dataStore.fetchData('programs')`). |
| **Programs** | `/api/programs/:id` | `GET` | Medium | Fetches single study program details for `/dashboard/studyprogram/[id]`. |
| **Programs** | `/api/programs` | `POST` | Low | Creates new study programs. |
| **Progress** | `/api/lessons/:id/progress` | `POST` | High | Updates lesson completion status (`not_started`, `in_progress`, `completed`) in `teacher_lesson_progress`. |
| **Progress** | `/api/progress/program/:programId` | `GET` | High | Retrieves lesson completion statuses for the logged-in user to show checkmarks in the sidebar. |

---

## 3. Server Configuration Checklist

- [ ] **Express Static Middleware for Uploads:** Ensure uploaded PDF files in `/uploads/pdf/` are publicly accessible to embedded browser viewers (`<iframe>` / `<embed>`).
  ```javascript
  // Express server static middleware
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));