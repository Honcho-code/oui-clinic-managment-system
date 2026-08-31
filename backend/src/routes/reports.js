const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Summary numbers for the staff dashboard
router.get('/summary', requireAuth, requireRole('nurse', 'admin'), async (req, res) => {
  const [students, pending, visitsThisMonth, commonComplaints] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'student'`),
    db.query(`SELECT COUNT(*)::int AS count FROM appointments WHERE status = 'pending'`),
    db.query(
      `SELECT COUNT(*)::int AS count FROM clinic_visits
       WHERE visit_date >= date_trunc('month', now())`
    ),
    db.query(
      `SELECT symptoms, COUNT(*)::int AS occurrences
       FROM clinic_visits
       WHERE visit_date >= now() - interval '90 days'
       GROUP BY symptoms
       ORDER BY occurrences DESC
       LIMIT 5`
    ),
  ]);

  res.json({
    total_students: students.rows[0].count,
    pending_appointments: pending.rows[0].count,
    visits_this_month: visitsThisMonth.rows[0].count,
    common_complaints: commonComplaints.rows,
  });
});

// Visit volume for the last 30 days - used for a simple trend view
router.get('/visit-trend', requireAuth, requireRole('nurse', 'admin'), async (req, res) => {
  const result = await db.query(
    `SELECT to_char(visit_date::date, 'YYYY-MM-DD') AS day, COUNT(*)::int AS visits
     FROM clinic_visits
     WHERE visit_date >= now() - interval '30 days'
     GROUP BY day
     ORDER BY day ASC`
  );
  res.json({ trend: result.rows });
});

module.exports = router;
