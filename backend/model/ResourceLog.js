const mongoose = require('mongoose');

const resourceLogSchema = new mongoose.Schema({
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
  action: {
    type: String,
    enum: ['issued', 'returned'],
    required: true
  },
  issueDate: Date,
  expectedReturnDate: Date,
  returnDate: Date,
  conditionOnReturn: String,
  adminNote: String,
  penalty: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ResourceLog', resourceLogSchema);

