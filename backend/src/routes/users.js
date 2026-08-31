const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// List students - used by clinic staff to search/find a patient
router.get('/students', requireAuth, requireRole('nurse', 'admin'), async (req, res) => {
  const { q } = req.query;
  let result;
  if (q && q.trim()) {
    result = await db.query(
      `SELECT id, full_name, email, identifier, department, phone, created_at
       FROM users
       WHERE role = 'student' AND (full_name ILIKE $1 OR identifier ILIKE $1 OR email ILIKE $1)
       ORDER BY full_name ASC LIMIT 50`,
      [`%${q.trim()}%`]
    );
  } else {
    result = await db.query(
      `SELECT id, full_name, email, identifier, department, phone, created_at
       FROM users WHERE role = 'student' ORDER BY full_name ASC LIMIT 50`
    );
  }
  res.json({ students: result.rows });
});

router.get('/students/:id', requireAuth, requireRole('nurse', 'admin'), async (req, res) => {
  const result = await db.query(
    `SELECT id, full_name, email, identifier, department, phone, created_at
     FROM users WHERE id = $1 AND role = 'student'`,
    [req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'No student found with that ID.' });
  }
  res.json({ student: result.rows[0] });
});

// Admin creates nurse/admin accounts
router.post(
  '/staff',
  requireAuth,
  requireRole('admin'),
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required.'),
    body('email').isEmail().withMessage('Enter a valid email address.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('identifier').trim().notEmpty().withMessage('Staff ID is required.'),
    body('role').isIn(['nurse', 'admin']).withMessage('Role must be nurse or admin.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { full_name, email, password, identifier, role, phone } = req.body;

    try {
      const existing = await db.query(
        'SELECT id FROM users WHERE email = $1 OR identifier = $2',
        [email.toLowerCase(), identifier]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'An account with that email or staff ID already exists.' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const result = await db.query(
        `INSERT INTO users (full_name, email, password_hash, role, identifier, department, phone)
         VALUES ($1, $2, $3, $4, $5, 'Clinic', $6)
         RETURNING id, full_name, email, role, identifier, department, phone, created_at`,
        [full_name, email.toLowerCase(), password_hash, role, identifier, phone || null]
      );
      res.status(201).json({ staff: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not create the staff account.' });
    }
  }
);

module.exports = router;
