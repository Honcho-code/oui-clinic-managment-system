const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
}

function publicUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

// Students self-register. Nurse/admin accounts are created by an admin (see /users route).
router.post(
  '/register',
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required.'),
    body('email').isEmail().withMessage('Enter a valid email address.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('identifier').trim().notEmpty().withMessage('Matric number is required.'),
    body('department').trim().notEmpty().withMessage('Department is required.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { full_name, email, password, identifier, department, phone } = req.body;

    try {
      const existing = await db.query(
        'SELECT id FROM users WHERE email = $1 OR identifier = $2',
        [email.toLowerCase(), identifier]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'An account with that email or matric number already exists.' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const result = await db.query(
        `INSERT INTO users (full_name, email, password_hash, role, identifier, department, phone)
         VALUES ($1, $2, $3, 'student', $4, $5, $6)
         RETURNING *`,
        [full_name, email.toLowerCase(), password_hash, identifier, department, phone || null]
      );

      const user = result.rows[0];
      const token = signToken(user);
      res.status(201).json({ token, user: publicUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not create your account. Try again.' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Enter a valid email address.'),
    body('password').notEmpty().withMessage('Enter your password.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({ error: 'That email and password combination doesn\u2019t match our records.' });
      }

      const matches = await bcrypt.compare(password, user.password_hash);
      if (!matches) {
        return res.status(401).json({ error: 'That email and password combination doesn\u2019t match our records.' });
      }

      const token = signToken(user);
      res.json({ token, user: publicUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Sign-in failed. Try again.' });
    }
  }
);

router.get('/me', requireAuth, async (req, res) => {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Account not found.' });
  }
  res.json({ user: publicUser(result.rows[0]) });
});

module.exports = router;
