require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const notesRouter    = require('./routes/notes');
const documentsRouter = require('./routes/documents');
const accountsRouter  = require('./routes/accounts');
const expensesRouter  = require('./routes/expenses');
const authRouter     = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — in dev, allow any origin on the LAN (192.168.x.x / 10.x.x.x / localhost)
const corsOrigin = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URI]
  : (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      const isLocal =
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/.test(origin);
      if (isLocal) return callback(null, true);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    };

app.use(cors({ origin: corsOrigin, credentials: true }));

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
app.use('/api/documents', documentsRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/expenses', expensesRouter);

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

// Listen on all network interfaces so LAN devices can reach the server
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT} (all interfaces)`));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));
