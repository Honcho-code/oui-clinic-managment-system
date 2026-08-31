# OUI Clinic Management System

Design and implementation of a school clinic management system with Electronic
Medical Records (EMR) and appointment scheduling, built for Oduduwa University Ile-Ife.

Built to match the project proposal: digital student medical records, an
appointment scheduling module, a secure database, and reporting on clinic
operations — for three roles: **student**, **nurse**, **admin**.

## Stack

- **Frontend**: React 18 (Vite), plain CSS with a small design token system, `react-router-dom`
- **Backend**: Node.js + Express, raw SQL via `pg` (no ORM — the schema is explicit and easy to defend)
- **Database**: PostgreSQL
- **Auth**: JWT, bcrypt-hashed passwords, role-based access control

## Project structure

```
oui-clinic/
├── backend/
│   ├── schema.sql              # full database schema (run this first)
│   ├── src/
│   │   ├── index.js            # Express app entry point
│   │   ├── db.js               # PostgreSQL connection pool
│   │   ├── middleware/auth.js  # JWT verification + role guard
│   │   └── routes/
│   │       ├── auth.js         # register, login, /me
│   │       ├── users.js        # student search, staff account creation
│   │       ├── records.js      # EMR: medical records + visit history
│   │       ├── appointments.js # booking, approval, cancellation
│   │       └── reports.js      # summary stats, visit trend
│   └── .env.example
└── frontend/
    └── src/
        ├── pages/student/      # student portal: dashboard, appointments, record
        ├── pages/staff/        # clinic desk: dashboard, students, chart, appointments, reports
        ├── components/         # shared UI (Button, Field, StatusBadge, shells, etc.)
        └── context/AuthContext.jsx
```

## Entity–Relationship overview

```
users (1) ──< appointments (many)         a student books many appointments
users (1) ──< clinic_visits (many)        a student has many logged visits
users (1) ── medical_records (1)          one record per student
appointments (1) ──< clinic_visits (0..1) a visit can originate from an appointment
users (nurse) ──< appointments            a nurse is assigned to many appointments
users (nurse) ──< clinic_visits           a nurse attends many visits
```

`users.role` is an enum (`student`, `nurse`, `admin`) rather than a separate
role table — simple enough for this scope, and easy to extend later if
finer-grained permissions are ever needed.

## Setting it up locally

### 1. Database

```bash
createdb oui_clinic
psql -d oui_clinic -f backend/schema.sql
```

This creates all tables and seeds one admin account:
- Email: `admin@oui.edu.ng`
- Password: `ChangeMe123!`

Change that password after your first login (there's no "change password" UI
yet — do it directly in the database with a fresh bcrypt hash, or add that
screen as a next step).

### 2. Backend

```bash
cd backend
cp .env.example .env      # edit DATABASE_URL and JWT_SECRET
npm install
npm run dev                # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

The frontend expects the API at `http://localhost:4000/api` by default. To
point elsewhere, create `frontend/.env` with:

```
VITE_API_URL=https://your-api-host/api
```

## How the roles work

- **Student** — self-registers with matric number + email. Can book/cancel
  their own appointments and view (read-only) their medical record and visit
  history.
- **Nurse** — created by an admin. Can search students, create/update medical
  records, log clinic visits, and approve/decline/complete appointments.
- **Admin** — everything a nurse can do, plus creating other nurse/admin
  accounts.

There's no "sign up as staff" screen on purpose — clinic accounts should be
provisioned deliberately, not self-served, since they touch medical data.

## What to extend next

A few things intentionally left out of this first pass, worth mentioning at
your defense as future work rather than oversights:

- Password reset flow
- Audit log of who viewed/edited a given medical record (important for a
  real EMR system, cut here for scope)
- Email/SMS reminders ahead of an approved appointment
- Exportable PDF report for a single student's chart
