// routes/chatRoutes.js - Routes for group chats
const express = require('express');
const mongoose = require('mongoose');
const { authToken } = require('../middleware/authMiddleware');
const ChatRoom = require('../model/ChatRoom');
const ChatMessage = require('../model/ChatMessage');

const router = express.Router();

// GET /chats/rooms - Get all chat rooms user is a member of
router.get('/rooms', authToken, async (req, res) => {
  try {
    const { groupId, projectId } = req.query;
    const filter = { members: req.user._id };

    if (groupId) filter.group = groupId;
    if (projectId) filter.project = projectId;

    const rooms = await ChatRoom.find(filter)
      .populate('members', 'name email role avatarUrl')
      .populate('createdBy', 'name email role avatarUrl')
      .sort({ lastMessageAt: -1 });

    res.json(rooms.map(room => ({
      id: room._id,
      name: room.name,
      description: room.description,
      room_type: room.roomType,
      group_id: room.group,
      project_id: room.project,
      members: room.members.map(m => ({
        id: m._id,
        name: m.name,
        email: m.email,
        role: m.role,
        avatar_url: m.avatarUrl
      })),
      member_count: room.members.length,
      created_by: {
        id: room.createdBy._id,
        name: room.createdBy.name
      },
      last_message_at: room.lastMessageAt,
      created_at: room.createdAt
    })));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load chat rooms', error: error.message });
  }
});

// GET /chats/rooms/:id - Get a specific chat room
router.get('/rooms/:id', authToken, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id)
      .populate('members', 'name email role avatarUrl')
      .populate('createdBy', 'name email role avatarUrl');

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    if (!room.members.some(m => m._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      id: room._id,
      name: room.name,
      description: room.description,
      room_type: room.roomType,
      group_id: room.group,
      project_id: room.project,
      members: room.members.map(m => ({
        id: m._id,
        name: m.name,
        email: m.email,
        role: m.role,
        avatar_url: m.avatarUrl
      })),
      created_by: {
        id: room.createdBy._id,
        name: room.createdBy.name
      },
      last_message_at: room.lastMessageAt,
      created_at: room.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load chat room', error: error.message });
  }
});

// GET /chats/rooms/:id/messages - Get messages in a chat room
router.get('/rooms/:id/messages', authToken, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    if (!room.members.some(m => m.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before ? new Date(req.query.before) : new Date();

    const messages = await ChatMessage.find({
      room: room._id,
      createdAt: { $lt: before }
    })
      .populate('sender', 'name email role avatarUrl')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Mark messages as read
    await ChatMessage.updateMany(
      {
        room: room._id,
        'readBy.user': { $ne: req.user._id },
        sender: { $ne: req.user._id }
      },
      {
        $push: {
          readBy: {
            user: req.user._id,
            readAt: new Date()
          }
        }
      }
    );

    res.json(messages.reverse().map(msg => ({
      id: msg._id,
      content: msg.content,
      message_type: msg.messageType,
      file_url: msg.fileUrl,
      sender: {
        id: msg.sender._id,
        name: msg.sender.name,
        email: msg.sender.email,
        role: msg.sender.role,
        avatar_url: msg.sender.avatarUrl
      },
      read_by: msg.readBy.map(r => ({
        user_id: r.user._id,
        read_at: r.readAt
      })),
      created_at: msg.createdAt
    })));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load messages', error: error.message });
  }
});

// POST /chats/rooms/:id/messages - Send a message in a chat room
router.post('/rooms/:id/messages', authToken, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    if (!room.members.some(m => m.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { content, messageType, fileUrl } = req.body;

    if (!content && !fileUrl) {
      return res.status(400).json({ message: 'Content or file URL is required' });
    }

    const message = await ChatMessage.create({
      room: room._id,
      sender: req.user._id,
      content: content || '',
      messageType: messageType || 'text',
      fileUrl: fileUrl || null
    });

    const populated = await ChatMessage.findById(message._id)
      .populate('sender', 'name email role avatarUrl');

    res.status(201).json({
      id: populated._id,
      content: populated.content,
      message_type: populated.messageType,
      file_url: populated.fileUrl,
      sender: {
        id: populated.sender._id,
        name: populated.sender.name,
        email: populated.sender.email,
        role: populated.sender.role,
        avatar_url: populated.sender.avatarUrl
      },
      created_at: populated.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to send message', error: error.message });
  }
});

// POST /chats/rooms - Create a new chat room
router.post('/rooms', authToken, async (req, res) => {
  try {
    const { name, description, groupId, projectId, roomType } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    const room = await ChatRoom.create({
      name,
      description: description || '',
      group: groupId || null,
      project: projectId || null,
      roomType: roomType || 'group',
      members: [req.user._id],
      createdBy: req.user._id
    });

    const populated = await ChatRoom.findById(room._id)
      .populate('members', 'name email role avatarUrl')
      .populate('createdBy', 'name email role avatarUrl');

    res.status(201).json({
      id: populated._id,
      name: populated.name,
      description: populated.description,
      room_type: populated.roomType,
      group_id: populated.group,
      project_id: populated.project,
      members: populated.members.map(m => ({
        id: m._id,
        name: m.name,
        email: m.email,
        role: m.role,
        avatar_url: m.avatarUrl
      })),
      created_at: populated.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to create chat room', error: error.message });
  }
});

// DELETE /chats/rooms/:id - Delete a chat room (creator only)
router.delete('/rooms/:id', authToken, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    if (!room.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the creator can delete the chat room' });
    }

    await ChatMessage.deleteMany({ room: room._id });
    await ChatRoom.findByIdAndDelete(req.params.id);

    res.json({ message: 'Chat room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete chat room', error: error.message });
  }
});

module.exports = router;

