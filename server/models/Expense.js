const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  amount: {
    type: Number,
    default: 0
  },
  reason: {
    type: String,
    default: '',
    trim: true
  },
  type: {
    type: String,
    enum: ['plus', 'minus'],
    default: 'minus'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
      trim: true,
    },
    initialTotal: {
      type: Number,
      default: 0,
    },
    entries: {
      type: [entrySchema],
      default: [],
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

module.exports = mongoose.model('Expense', expenseSchema);
