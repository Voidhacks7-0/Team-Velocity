// routes/groupRoutes.js - Routes for collaboration groups
const express = require('express');
const mongoose = require('mongoose');
const { authToken, roleCheck } = require('../middleware/authMiddleware');
const Group = require('../model/Group');
const ChatRoom = require('../model/ChatRoom');

const router = express.Router();

// GET /groups - Get all groups (filtered by type, status, etc.)
router.get('/', authToken, async (req, res) => {
  try {
    const { type, status, search } = req.query;
    const filter = { isPublic: true };

    if (type) filter.groupType = type;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const groups = await Group.find(filter)
      .populate('creator', 'name email role avatarUrl')
      .populate('members', 'name email role avatarUrl')
      .sort({ createdAt: -1 });

    const myGroupIds = await Group.find({ members: req.user._id }).distinct('_id');

    res.json({
      groups: groups.map(g => ({
        id: g._id,
        name: g.name,
        description: g.description,
        group_type: g.groupType,
        creator: {
          id: g.creator._id,
          full_name: g.creator.name,
          email: g.creator.email,
          role: g.creator.role,
          avatar_url: g.creator.avatarUrl
        },
        members: g.members.map(m => ({
          id: m._id,
          name: m.name,
          email: m.email,
          role: m.role,
          avatar_url: m.avatarUrl
        })),
        member_count: g.members.length,
        max_members: g.maxMembers,
        tags: g.tags,
        is_public: g.isPublic,
        status: g.status,
        hackathon_id: g.hackathonId,
        created_at: g.createdAt
      })),
      myGroupIds: myGroupIds.map(id => id.toString())
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load groups', error: error.message });
  }
});

// GET /groups/:id - Get a specific group
router.get('/:id', authToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'name email role avatarUrl')
      .populate('members', 'name email role avatarUrl');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.isPublic && !group.members.some(m => m._id.equals(req.user._id)) && !group.creator._id.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      id: group._id,
      name: group.name,
      description: group.description,
      group_type: group.groupType,
      creator: {
        id: group.creator._id,
        full_name: group.creator.name,
        email: group.creator.email,
        role: group.creator.role
      },
      members: group.members.map(m => ({
        id: m._id,
        name: m.name,
        email: m.email,
        role: m.role,
        avatar_url: m.avatarUrl
      })),
      member_count: group.members.length,
      max_members: group.maxMembers,
      tags: group.tags,
      is_public: group.isPublic,
      status: group.status,
      hackathon_id: group.hackathonId,
      created_at: group.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load group', error: error.message });
  }
});

// POST /groups - Create a new group
router.post('/', authToken, async (req, res) => {
  try {
    const { name, description, groupType, maxMembers, tags, isPublic, hackathonId } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }

    const group = await Group.create({
      name,
      description,
      groupType: groupType || 'general',
      maxMembers: maxMembers || 10,
      tags: tags || [],
      isPublic: isPublic !== false,
      creator: req.user._id,
      members: [req.user._id],
      hackathonId: hackathonId || null
    });

    // Create a chat room for the group
    await ChatRoom.create({
      name: `${name} Chat`,
      description: `Chat room for ${name}`,
      group: group._id,
      roomType: 'group',
      members: [req.user._id],
      createdBy: req.user._id
    });

    const populated = await Group.findById(group._id)
      .populate('creator', 'name email role avatarUrl')
      .populate('members', 'name email role avatarUrl');

    res.status(201).json({
      id: populated._id,
      name: populated.name,
      description: populated.description,
      group_type: populated.groupType,
      creator: {
        id: populated.creator._id,
        full_name: populated.creator.name
      },
      member_count: populated.members.length,
      max_members: populated.maxMembers,
      tags: populated.tags,
      created_at: populated.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to create group', error: error.message });
  }
});

// POST /groups/:id/join - Join a group
router.post('/:id/join', authToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.members.some(m => m.equals(req.user._id))) {
      return res.status(400).json({ message: 'Already a member of this group' });
    }

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ message: 'Group is full' });
    }

    if (group.status !== 'active') {
      return res.status(400).json({ message: 'Group is not accepting new members' });
    }

    group.members.push(req.user._id);
    await group.save();

    // Add user to chat room
    const chatRoom = await ChatRoom.findOne({ group: group._id });
    if (chatRoom && !chatRoom.members.some(m => m.equals(req.user._id))) {
      chatRoom.members.push(req.user._id);
      await chatRoom.save();
    }

    res.json({ message: 'Successfully joined group' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to join group', error: error.message });
  }
});

// POST /groups/:id/leave - Leave a group
router.post('/:id/leave', authToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.creator.equals(req.user._id)) {
      return res.status(400).json({ message: 'Creator cannot leave the group. Transfer ownership or delete the group.' });
    }

    group.members = group.members.filter(m => !m.equals(req.user._id));
    await group.save();

    // Remove user from chat room
    const chatRoom = await ChatRoom.findOne({ group: group._id });
    if (chatRoom) {
      chatRoom.members = chatRoom.members.filter(m => !m.equals(req.user._id));
      await chatRoom.save();
    }

    res.json({ message: 'Successfully left group' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to leave group', error: error.message });
  }
});

// DELETE /groups/:id - Delete a group (creator only)
router.delete('/:id', authToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the creator can delete the group' });
    }

    // Delete associated chat room
    await ChatRoom.deleteMany({ group: group._id });

    await Group.findByIdAndDelete(req.params.id);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete group', error: error.message });
  }
});

module.exports = router;

