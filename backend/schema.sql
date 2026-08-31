-- OUI Clinic Management System
-- Database schema (PostgreSQL)

CREATE TYPE user_role AS ENUM ('student', 'nurse', 'admin');
CREATE TYPE appointment_status AS ENUM ('pending', 'approved', 'completed', 'cancelled', 'declined');

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(160) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'student',
    identifier      VARCHAR(40) UNIQUE NOT NULL,   -- matric number for students, staff ID for nurse/admin
    department      VARCHAR(120),                   -- e.g. Computer Science, or "Clinic" for staff
    phone           VARCHAR(30),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One medical record per student, expanded over time by clinic staff
CREATE TABLE medical_records (
    id                  SERIAL PRIMARY KEY,
    student_id          INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    blood_group         VARCHAR(5),
    genotype            VARCHAR(5),
    allergies           TEXT,
    chronic_conditions  TEXT,
    emergency_contact_name  VARCHAR(120),
    emergency_contact_phone VARCHAR(30),
    notes               TEXT,
    updated_by          INTEGER REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Appointment requests raised by students, actioned by clinic staff
CREATE TABLE appointments (
    id              SERIAL PRIMARY KEY,
    student_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_nurse  INTEGER REFERENCES users(id),
    reason          TEXT NOT NULL,
    requested_date  DATE NOT NULL,
    requested_time  TIME NOT NULL,
    status          appointment_status NOT NULL DEFAULT 'pending',
    staff_notes     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A logged clinic visit / consultation, tied to a student.
-- appointments already exists above, so this reference is valid immediately.
CREATE TABLE clinic_visits (
    id              SERIAL PRIMARY KEY,
    student_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_id  INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    attended_by     INTEGER REFERENCES users(id),      -- nurse who attended
    visit_date      TIMESTAMPTZ NOT NULL DEFAULT now(),
    symptoms        TEXT,
    diagnosis       TEXT,
    treatment       TEXT,
    follow_up_date  DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_student ON appointments(student_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_visits_student ON clinic_visits(student_id);

CREATE TYPE message_type AS ENUM ('text', 'prescription');

-- One running thread per student. Every message a student or clinic staff
-- sends lives here; optionally tagged with the appointment it relates to.
CREATE TABLE messages (
    id              SERIAL PRIMARY KEY,
    student_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_id  INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    type            message_type NOT NULL DEFAULT 'text',
    body            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A structured prescription, always attached to the message that issued it,
-- so it renders distinctly in the thread and is easy to look up later.
CREATE TABLE prescriptions (
    id              SERIAL PRIMARY KEY,
    message_id      INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    student_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prescribed_by   INTEGER NOT NULL REFERENCES users(id),
    drug_name       VARCHAR(160) NOT NULL,
    dosage          VARCHAR(160) NOT NULL,
    instructions    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_student ON messages(student_id);
CREATE INDEX idx_prescriptions_student ON prescriptions(student_id);

-- Seed an admin account so the system is reachable on first run.
-- Password below is 'ChangeMe123!' hashed with bcrypt (cost 10).
-- Change it immediately after first login.
INSERT INTO users (full_name, email, password_hash, role, identifier, department)
VALUES (
    'Clinic Administrator',
    'admin@oui.edu.ng',
    '$2b$10$6UK5orBf1x1OBbqG0e9.QeXMy/orkMuRqdRvDhyzaVpqDFqX9MZ3m',
    'admin',
    'OUI-ADM-001',
    'Clinic'
);
