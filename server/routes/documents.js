const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const requireAuth = require('../middleware/auth');

// All routes require auth
router.use(requireAuth);

// GET all documents
router.get('/', async (req, res) => {
  try {
    const filter = { archived: false, userId: req.user.id };
    const documents = await Document.find(filter).sort({ pinned: -1, updatedAt: -1 });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single document
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json(document);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create document
router.post('/', async (req, res) => {
  try {
    const document = new Document({
      title: req.body.title || '',
      body: req.body.body || '',
      documentUrl: req.body.documentUrl || '',
      userId: req.user.id,
    });
    const saved = await document.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update document
router.put('/:id', async (req, res) => {
  try {
    const updated = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        title: req.body.title,
        body: req.body.body,
        documentUrl: req.body.documentUrl,
        pinned: req.body.pinned,
        archived: req.body.archived,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Document not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE document
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Document.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: 'Document not found' });
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
