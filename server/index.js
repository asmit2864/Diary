require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const notesRouter = require('./routes/notes');
const authRouter  = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — allow frontend
const allowedOrigin = process.env.FRONTEND_URI;

app.use(cors({ origin: allowedOrigin, credentials: true }));

// Fix Google Auth Popup Cross-Origin-Opener-Policy issue
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/auth', authRouter);
app.use('/api/notes', notesRouter);

// Serve React build
const buildDir = path.resolve(__dirname, '../client/build');
if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir));
  app.get('*', (req, res) => {
    const indexPath = path.join(buildDir, 'index.html');
    res.sendFile(indexPath);
  });
} else {
  app.get('/', (req, res) => res.json({ status: 'API running — no client build found' }));
}

// Start server immediately so Render health check passes
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));
