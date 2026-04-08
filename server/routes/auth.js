const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const isStandardLocal = !process.env.FRONTEND_URI || process.env.FRONTEND_URI.includes('localhost');

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: isStandardLocal ? 'lax' : 'none',
  secure: !isStandardLocal, // 'none' demands secure: true
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

// POST /auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Fetch user info from Google using the access_token
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${credential}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to verify access token with Google');
    }
    
    const payload = await response.json();
    const { email, sub: googleId, picture: avatarUser } = payload;
    
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, googleId, avatarUser });
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (!user.avatarUser && avatarUser) user.avatarUser = avatarUser;
      await user.save();
    }
    
    issueToken(res, user);
    res.json({ id: user._id, email: user.email, avatarUser: user.avatarUser });
  } catch (err) {
    res.status(401).json({ message: 'Invalid Google token: ' + err.message });
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
router.get('/me', async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    res.json({ id: user._id, email: user.email, avatarUser: user.avatarUser, hasVaultPin: !!user.vaultPin });
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { ...COOKIE_OPTS, maxAge: 0 });
  res.json({ message: 'Logged out' });
});

// POST /auth/set-pin
router.post('/set-pin', async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { pin } = req.body;
    if (!pin || pin.length !== 6) return res.status(400).json({ message: '6-digit PIN required' });
    
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.vaultPin) return res.status(400).json({ message: 'Vault PIN already set' });
    
    const bcrypt = require('bcryptjs');
    user.vaultPin = await bcrypt.hash(pin, 12);
    await user.save();
    
    res.json({ message: 'Vault PIN set' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /auth/verify-pin
router.post('/verify-pin', async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ message: 'PIN required' });
    
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (!user.vaultPin) return res.status(400).json({ message: 'Vault PIN not set' });
    
    const bcrypt = require('bcryptjs');
    const ok = await bcrypt.compare(pin, user.vaultPin);
    if (!ok) return res.status(401).json({ message: 'Invalid Vault PIN' });
    
    res.json({ message: 'Vault PIN verified' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
