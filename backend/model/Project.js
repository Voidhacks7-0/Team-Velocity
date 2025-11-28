// models/Project.js - Projects for hackathons and matchmaking
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['leader', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxTeamSize: {
    type: Number,
    default: 5
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  projectType: {
    type: String,
    enum: ['hackathon', 'assignment', 'personal', 'research'],
    default: 'hackathon'
  },
  status: {
    type: String,
    enum: ['recruiting', 'in-progress', 'completed', 'cancelled'],
    default: 'recruiting'
  },
  hackathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  repositoryUrl: {
    type: String,
    default: ''
  },
  demoUrl: {
    type: String,
    default: ''
  },
  deadline: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

projectSchema.pre('save', function preSave(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', projectSchema);

