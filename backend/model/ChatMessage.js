// models/ChatMessage.js - Messages in chat rooms
const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: null
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

chatMessageSchema.index({ room: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1 });

chatMessageSchema.post('save', async function() {
  // Update lastMessageAt on room
  const ChatRoom = mongoose.model('ChatRoom');
  await ChatRoom.findByIdAndUpdate(this.room, {
    lastMessageAt: this.createdAt
  });
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);

