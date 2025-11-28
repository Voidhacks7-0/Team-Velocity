const mongoose = require('mongoose');

const resourceRequestSchema = new mongoose.Schema({
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'issued', 'returned', 'cancelled'],
    default: 'pending'
  },
  adminNote: {
    type: String,
    trim: true
  },
  issueDate: Date,
  expectedReturnDate: Date,
  returnDate: Date,
  conditionOnReturn: {
    type: String,
    trim: true
  },
  penalty: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('ResourceRequest', resourceRequestSchema);

