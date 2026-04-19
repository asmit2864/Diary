const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const requireAuth = require('../middleware/auth');

// All routes require auth
router.use(requireAuth);

// GET all notes
router.get('/', async (req, res) => {
  try {
    const filter = { archived: false, userId: req.user.id };
    const notes = await Note.find(filter).sort({ pinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single note
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create note
router.post('/', async (req, res) => {
  try {
    const note = new Note({
      title: req.body.title || '',
      body: req.body.body || '',
      userId: req.user.id,
    });
    const saved = await note.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update note
router.put('/:id', async (req, res) => {
  try {
    const updated = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        title: req.body.title,
        body: req.body.body,
        pinned: req.body.pinned,
        archived: req.body.archived,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Note not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE note
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
