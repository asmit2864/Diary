const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const requireAuth = require('../middleware/auth');

// All routes require auth
router.use(requireAuth);

// GET all expenses
router.get('/', async (req, res) => {
  try {
    const filter = { archived: false, userId: req.user.id };
    const expenses = await Expense.find(filter).sort({ pinned: -1, updatedAt: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single expense
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create expense
router.post('/', async (req, res) => {
  try {
    const expense = new Expense({
      title: req.body.title || '',
      initialTotal: req.body.initialTotal || 0,
      entries: req.body.entries || [],
      userId: req.user.id,
    });
    const saved = await expense.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update expense
router.put('/:id', async (req, res) => {
  try {
    const updated = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        title: req.body.title,
        initialTotal: req.body.initialTotal,
        entries: req.body.entries,
        pinned: req.body.pinned,
        archived: req.body.archived,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Expense not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
