const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Inbox for clinic staff: one row per student thread, most recently active first
router.get('/', requireAuth, requireRole('nurse', 'admin'), async (req, res) => {
  const result = await db.query(
    `SELECT DISTINCT ON (m.student_id)
            m.student_id, m.body, m.type, m.created_at,
            s.full_name AS student_name, s.identifier AS student_identifier,
            u.full_name AS sender_name, u.role AS sender_role
     FROM messages m
     JOIN users s ON s.id = m.student_id
     JOIN users u ON u.id = m.sender_id
     ORDER BY m.student_id, m.created_at DESC`
  );
  // DISTINCT ON gives one row per student ordered by student_id, not recency —
  // re-sort by most recently active thread for the inbox view.
  result.rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ threads: result.rows });
});

function canAccessThread(req, res, next) {
  const studentId = Number(req.params.studentId);
  if (req.user.role === 'student' && req.user.id !== studentId) {
    return res.status(403).json({ error: 'You can only view your own messages.' });
  }
  next();
}

// Full thread for a student: text messages and prescriptions, oldest first
router.get('/:studentId', requireAuth, canAccessThread, async (req, res) => {
  const result = await db.query(
    `SELECT m.*, u.full_name AS sender_name, u.role AS sender_role,
            p.id AS prescription_id, p.drug_name, p.dosage, p.instructions
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     LEFT JOIN prescriptions p ON p.message_id = m.id
     WHERE m.student_id = $1
     ORDER BY m.created_at ASC`,
    [req.params.studentId]
  );
  res.json({ messages: result.rows });
});

// Send a plain text message — either the student themself or clinic staff
router.post(
  '/:studentId',
  requireAuth,
  canAccessThread,
  [body('body').trim().notEmpty().withMessage('Write something before sending.')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { studentId } = req.params;
    const { body: text, appointment_id } = req.body;

    if (req.user.role !== 'student') {
      const student = await db.query("SELECT id FROM users WHERE id = $1 AND role = 'student'", [studentId]);
      if (student.rows.length === 0) {
        return res.status(404).json({ error: 'No student found with that ID.' });
      }
    }

    const result = await db.query(
      `INSERT INTO messages (student_id, sender_id, appointment_id, type, body)
       VALUES ($1, $2, $3, 'text', $4)
       RETURNING *`,
      [studentId, req.user.id, appointment_id || null, text]
    );

    res.status(201).json({ message: { ...result.rows[0], sender_name: req.user.full_name, sender_role: req.user.role } });
  }
);

// Clinic staff issues a prescription directly into the thread
router.post(
  '/:studentId/prescribe',
  requireAuth,
  requireRole('nurse', 'admin'),
  [
    body('drug_name').trim().notEmpty().withMessage('Enter the drug name.'),
    body('dosage').trim().notEmpty().withMessage('Enter the dosage.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { studentId } = req.params;
    const { drug_name, dosage, instructions, appointment_id } = req.body;

    const student = await db.query("SELECT id FROM users WHERE id = $1 AND role = 'student'", [studentId]);
    if (student.rows.length === 0) {
      return res.status(404).json({ error: 'No student found with that ID.' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const messageResult = await client.query(
        `INSERT INTO messages (student_id, sender_id, appointment_id, type, body)
         VALUES ($1, $2, $3, 'prescription', $4)
         RETURNING *`,
        [studentId, req.user.id, appointment_id || null, `Prescribed ${drug_name}`]
      );
      const message = messageResult.rows[0];

      const prescriptionResult = await client.query(
        `INSERT INTO prescriptions (message_id, student_id, prescribed_by, drug_name, dosage, instructions)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [message.id, studentId, req.user.id, drug_name, dosage, instructions || null]
      );

      await client.query('COMMIT');

      res.status(201).json({
        message: {
          ...message,
          sender_name: req.user.full_name,
          sender_role: req.user.role,
          prescription_id: prescriptionResult.rows[0].id,
          drug_name: prescriptionResult.rows[0].drug_name,
          dosage: prescriptionResult.rows[0].dosage,
          instructions: prescriptionResult.rows[0].instructions,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      res.status(500).json({ error: 'Could not save the prescription. Try again.' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
