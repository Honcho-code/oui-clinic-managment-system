-- Migration: appointment messaging + prescriptions
-- Run this against your EXISTING oui_clinic database — it only adds new
-- tables, it does not touch anything you already have.
--
-- Usage:
--   psql -d oui_clinic -f backend/migrations/001_messaging.sql

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
