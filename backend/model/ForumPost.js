// models/ForumPost.js - Forum posts for discussions
const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'technical', 'hackathon', 'assignment', 'help', 'announcement'],
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0
  },
  replyCount: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lastReplyAt: {
    type: Date,
    default: Date.now
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

forumPostSchema.pre('save', function preSave(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ForumPost', forumPostSchema);

