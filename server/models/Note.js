const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
      trim: true,
    },
    body: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      enum: ['General', 'Remember', 'Information', 'Money Lend', 'Lists', 'Accounts'],
      default: 'General',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

module.exports = mongoose.model('Note', noteSchema);
