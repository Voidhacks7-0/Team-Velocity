// models/ForumReply.js - Replies to forum posts
const mongoose = require('mongoose');

const forumReplySchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumPost',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  parentReply: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumReply',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isSolution: {
    type: Boolean,
    default: false
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

forumReplySchema.pre('save', function preSave(next) {
  this.updatedAt = Date.now();
  next();
});

forumReplySchema.post('save', async function() {
  // Update reply count on post
  const ForumPost = mongoose.model('ForumPost');
  await ForumPost.findByIdAndUpdate(this.post, {
    $inc: { replyCount: 1 },
    lastReplyAt: this.createdAt
  });
});

forumReplySchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const ForumPost = mongoose.model('ForumPost');
    await ForumPost.findByIdAndUpdate(doc.post, {
      $inc: { replyCount: -1 }
    });
  }
});

module.exports = mongoose.model('ForumReply', forumReplySchema);

