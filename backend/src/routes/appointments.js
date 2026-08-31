const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Student books an appointment
router.post(
  '/',
  requireAuth,
  requireRole('student'),
  [
    body('reason').trim().notEmpty().withMessage('Tell us why you need to see the clinic.'),
    body('requested_date').isISO8601().withMessage('Choose a valid date.'),
    body('requested_time').matches(/^\d{2}:\d{2}$/).withMessage('Choose a valid time.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { reason, requested_date, requested_time } = req.body;
    const result = await db.query(
      `INSERT INTO appointments (student_id, reason, requested_date, requested_time)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, reason, requested_date, requested_time]
    );
    res.status(201).json({ appointment: result.rows[0] });
  }
);

// List appointments - students see their own, staff see everyone's (optionally filtered by status)
router.get('/', requireAuth, async (req, res) => {
  const { status } = req.query;
  const params = [];
  const conditions = [];

  if (req.user.role === 'student') {
    params.push(req.user.id);
    conditions.push(`a.student_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`a.status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await db.query(
    `SELECT a.*, s.full_name AS student_name, s.identifier AS student_identifier,
            n.full_name AS nurse_name
     FROM appointments a
     JOIN users s ON s.id = a.student_id
     LEFT JOIN users n ON n.id = a.assigned_nurse
     ${where}
     ORDER BY a.requested_date ASC, a.requested_time ASC`,
    params
  );
  res.json({ appointments: result.rows });
});

// Staff updates status / assigns a nurse / adds notes
router.patch(
  '/:id',
  requireAuth,
  requireRole('nurse', 'admin'),
  [
    body('status').optional().isIn(['pending', 'approved', 'completed', 'cancelled', 'declined']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { status, assigned_nurse, staff_notes } = req.body;
    const existing = await db.query('SELECT * FROM appointments WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'That appointment no longer exists.' });
    }

    const current = existing.rows[0];
    const result = await db.query(
      `UPDATE appointments SET
        status = COALESCE($1, status),
        assigned_nurse = COALESCE($2, assigned_nurse),
        staff_notes = COALESCE($3, staff_notes),
        updated_at = now()
       WHERE id = $4 RETURNING *`,
      [status || null, assigned_nurse || null, staff_notes || null, req.params.id]
    );
    res.json({ appointment: result.rows[0] });
  }
);

// Student cancels their own pending appointment
router.delete('/:id', requireAuth, requireRole('student'), async (req, res) => {
  const existing = await db.query('SELECT * FROM appointments WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'That appointment no longer exists.' });
  }
  if (existing.rows[0].student_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only cancel your own appointments.' });
  }
  await db.query(`UPDATE appointments SET status = 'cancelled', updated_at = now() WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
