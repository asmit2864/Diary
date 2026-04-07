const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const requireAuth = require('../middleware/auth');

// All routes require auth
router.use(requireAuth);

// GET all accounts
router.get('/', async (req, res) => {
  try {
    const filter = { archived: false, userId: req.user.id };
    const accounts = await Account.find(filter).sort({ pinned: -1, updatedAt: -1 });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single account
router.get('/:id', async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, userId: req.user.id });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create account
router.post('/', async (req, res) => {
  try {
    const account = new Account({
      title: req.body.title || '',
      accountId: req.body.accountId || '',
      accountPassword: req.body.accountPassword || '',
      userId: req.user.id,
    });
    const saved = await account.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update account
router.put('/:id', async (req, res) => {
  try {
    const updated = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        title: req.body.title,
        accountId: req.body.accountId,
        accountPassword: req.body.accountPassword,
        pinned: req.body.pinned,
        archived: req.body.archived,
      },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Account not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE account
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Account.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
