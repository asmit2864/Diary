const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

function issueToken(res, user) {
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  res.cookie('token', token, COOKIE_OPTS);
}

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: 'An account with this email already exists' });

    const user = await User.create({ email, password });
    issueToken(res, user);
    res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    issueToken(res, user);
    res.json({ id: user._id, email: user.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /auth/me
router.get('/me', (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ id: payload.id, email: payload.email });
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { ...COOKIE_OPTS, maxAge: 0 });
  res.json({ message: 'Logged out' });
});

module.exports = router;
