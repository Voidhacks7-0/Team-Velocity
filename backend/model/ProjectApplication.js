// models/ProjectApplication.js - Applications to join projects
const mongoose = require('mongoose');

const projectApplicationSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

projectApplicationSchema.index({ project: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('ProjectApplication', projectApplicationSchema);

