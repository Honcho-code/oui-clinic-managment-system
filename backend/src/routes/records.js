const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

async function canAccessStudentRecord(req, res, next) {
  const studentId = Number(req.params.studentId);
  if (req.user.role === 'student' && req.user.id !== studentId) {
    return res.status(403).json({ error: "You can only view your own medical record." });
  }
  next();
}

// Get a student's medical record (creates an empty shell on first access by staff)
router.get('/:studentId', requireAuth, canAccessStudentRecord, async (req, res) => {
  const { studentId } = req.params;

  const result = await db.query('SELECT * FROM medical_records WHERE student_id = $1', [studentId]);
  if (result.rows.length === 0) {
    return res.json({ record: null });
  }
  res.json({ record: result.rows[0] });
});

// Create or update a student's medical record - clinic staff only
router.put(
  '/:studentId',
  requireAuth,
  requireRole('nurse', 'admin'),
  [
    body('blood_group').optional({ checkFalsy: true }).isString(),
    body('genotype').optional({ checkFalsy: true }).isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { studentId } = req.params;
    const {
      blood_group, genotype, allergies, chronic_conditions,
      emergency_contact_name, emergency_contact_phone, notes,
    } = req.body;

    const student = await db.query("SELECT id FROM users WHERE id = $1 AND role = 'student'", [studentId]);
    if (student.rows.length === 0) {
      return res.status(404).json({ error: 'No student found with that ID.' });
    }

    const existing = await db.query('SELECT id FROM medical_records WHERE student_id = $1', [studentId]);

    let result;
    if (existing.rows.length === 0) {
      result = await db.query(
        `INSERT INTO medical_records
          (student_id, blood_group, genotype, allergies, chronic_conditions,
           emergency_contact_name, emergency_contact_phone, notes, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [studentId, blood_group || null, genotype || null, allergies || null, chronic_conditions || null,
          emergency_contact_name || null, emergency_contact_phone || null, notes || null, req.user.id]
      );
    } else {
      result = await db.query(
        `UPDATE medical_records SET
          blood_group = $1, genotype = $2, allergies = $3, chronic_conditions = $4,
          emergency_contact_name = $5, emergency_contact_phone = $6, notes = $7,
          updated_by = $8, updated_at = now()
         WHERE student_id = $9
         RETURNING *`,
        [blood_group || null, genotype || null, allergies || null, chronic_conditions || null,
          emergency_contact_name || null, emergency_contact_phone || null, notes || null,
          req.user.id, studentId]
      );
    }

    res.json({ record: result.rows[0] });
  }
);

// Visit history for a student
router.get('/:studentId/visits', requireAuth, canAccessStudentRecord, async (req, res) => {
  const result = await db.query(
    `SELECT v.*, u.full_name AS attended_by_name
     FROM clinic_visits v
     LEFT JOIN users u ON u.id = v.attended_by
     WHERE v.student_id = $1
     ORDER BY v.visit_date DESC`,
    [req.params.studentId]
  );
  res.json({ visits: result.rows });
});

// Log a new clinic visit - clinic staff only
router.post(
  '/:studentId/visits',
  requireAuth,
  requireRole('nurse', 'admin'),
  [
    body('symptoms').trim().notEmpty().withMessage('Describe the presenting symptoms.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { studentId } = req.params;
    const { symptoms, diagnosis, treatment, follow_up_date, notes, appointment_id } = req.body;

    const result = await db.query(
      `INSERT INTO clinic_visits
        (student_id, appointment_id, attended_by, symptoms, diagnosis, treatment, follow_up_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [studentId, appointment_id || null, req.user.id, symptoms, diagnosis || null,
        treatment || null, follow_up_date || null, notes || null]
    );

    if (appointment_id) {
      await db.query(`UPDATE appointments SET status = 'completed', updated_at = now() WHERE id = $1`, [appointment_id]);
    }

    res.status(201).json({ visit: result.rows[0] });
  }
);

module.exports = router;
