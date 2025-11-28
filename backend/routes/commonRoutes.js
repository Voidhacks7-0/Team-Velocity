// routes/commonRoutes.js - Routes any logged-in user can access
const express = require('express');
const mongoose = require('mongoose');
const { authToken, roleCheck } = require('../middleware/authMiddleware');
const Resource = require('../model/Resource');
const ResourceRequest = require('../model/ResourceRequest');
const Announcement = require('../model/Announcement');
const Event = require('../model/Event');
const Notification = require('../model/Notification');
const Group = require('../model/Group');

const router = express.Router();

// Helper to format resource with category info
const formatResource = (resourceDoc) => {
  const resource = resourceDoc.toObject({ virtuals: false });
  if (resource.category && typeof resource.category === 'object') {
    resource.category = {
      id: resource.category._id,
      name: resource.category.name
    };
  }
  return resource;
};

// GET /common - Any logged-in user (student, faculty, or admin) can access
router.get('/', authToken, (req, res) => {
  res.json({
    message: 'This is a common route accessible by all logged-in users',
    user: {
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// GET /common/resources - Active resources visible to everyone
router.get('/resources', authToken, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.user.role !== 'admin') {
      filter.allowBooking = true;
    }

    const resources = await Resource.find(filter)
      .populate('category', 'name')
      .sort({ name: 1 });

    res.json(resources.map(formatResource));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load resources', error: error.message });
  }
});

// GET /common/bookings - Logged-in user requests
router.get('/bookings', authToken, async (req, res) => {
  try {
    const bookings = await ResourceRequest.find({ requester: req.user._id })
      .populate({
        path: 'resource',
        populate: { path: 'category', select: 'name' }
      })
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch bookings', error: error.message });
  }
});

// POST /common/bookings - Create a resource request
router.post('/bookings', authToken, async (req, res) => {
  try {
    const { resourceId, purpose = 'General use', expectedReturnDate } = req.body;

    if (!resourceId || !mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({ message: 'Valid resource ID is required' });
    }

    if (!purpose) {
      return res.status(400).json({ message: 'Purpose is required' });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource || !resource.isActive || !resource.allowBooking) {
      return res.status(404).json({ message: 'Resource not available for booking' });
    }

    if (resource.availableQuantity <= 0) {
      return res.status(400).json({ message: 'Resource currently unavailable' });
    }

    const booking = await ResourceRequest.create({
      resource: resourceId,
      requester: req.user._id,
      purpose,
      status: 'pending',
      expectedReturnDate
    });

    const populated = await booking.populate({
      path: 'resource',
      populate: { path: 'category', select: 'name' }
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create booking', error: error.message });
  }
});

const formatAnnouncement = (doc) => ({
  id: doc._id,
  title: doc.title,
  content: doc.content,
  priority: doc.priority,
  is_pinned: doc.isPinned,
  created_at: doc.createdAt,
  author: {
    full_name: doc.authorName || doc.createdBy?.name || 'Campus Admin',
    role: doc.authorRole || doc.createdBy?.role || 'admin'
  }
});

const formatEvent = (doc) => ({
  id: doc._id,
  title: doc.title,
  description: doc.description,
  location: doc.location,
  start_time: doc.startsAt,
  end_time: doc.endsAt,
  event_type: doc.eventType || 'general'
});

// GET /common/dashboard - Provide summary cards + key lists
const serializeProfile = (userDoc) => ({
  id: userDoc._id,
  name: userDoc.name,
  email: userDoc.email,
  role: userDoc.role,
  phone: userDoc.phone || '',
  department: userDoc.department || '',
  avatarUrl: userDoc.avatarUrl || '',
  preferences: {
    language: userDoc.preferences?.language || 'en',
    theme: userDoc.preferences?.theme || 'light'
  }
});

router.get('/profile', authToken, (req, res) => {
  res.json(serializeProfile(req.user));
});

router.put('/profile', authToken, async (req, res) => {
  try {
    const user = req.user;
    const { name, phone, department, avatarUrl, preferences } = req.body;

    if (!user.preferences) {
      user.preferences = {};
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (department !== undefined) user.department = department;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    if (preferences) {
      if (preferences.language !== undefined) {
        user.preferences.language = preferences.language;
      }
      if (preferences.theme !== undefined) {
        user.preferences.theme = preferences.theme;
      }
    }

    await user.save();
    res.json(serializeProfile(user));
  } catch (error) {
    res.status(500).json({ message: 'Unable to update profile', error: error.message });
  }
});

router.get('/dashboard', authToken, async (req, res) => {
  try {
    const now = new Date();
    const weekAhead = new Date();
    weekAhead.setDate(now.getDate() + 7);

    const [recentAnnouncements, announcementsCount, upcomingEventsList, upcomingEventsCount, activeBookings] =
      await Promise.all([
        Announcement.find()
          .sort({ isPinned: -1, createdAt: -1 })
          .limit(3)
          .populate('createdBy', 'name role'),
        Announcement.countDocuments(),
        Event.find({ startsAt: { $gte: now } })
          .sort({ startsAt: 1 })
          .limit(3),
        Event.countDocuments({ startsAt: { $gte: now, $lte: weekAhead } }),
        ResourceRequest.countDocuments({
          requester: req.user._id,
          status: { $in: ['pending', 'approved', 'issued'] }
        })
      ]);

    res.json({
      stats: {
        announcements: announcementsCount,
        upcomingEvents: upcomingEventsCount,
        activeBookings,
        myGroups: 0
      },
      recentAnnouncements: recentAnnouncements.map(formatAnnouncement),
      upcomingEvents: upcomingEventsList.map(formatEvent)
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load dashboard data', error: error.message });
  }
});

router.get('/announcements', authToken, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ isPinned: -1, createdAt: -1 })
      .populate('createdBy', 'name role');

    res.json(announcements.map(formatAnnouncement));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load announcements', error: error.message });
  }
});

router.post('/announcements', authToken, roleCheck('faculty', 'admin'), async (req, res) => {
  try {
    const { title, content, priority = 'normal', is_pinned = false } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const announcement = await Announcement.create({
      title,
      content,
      priority,
      isPinned: is_pinned,
      createdBy: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role
    });

    const populated = await announcement.populate('createdBy', 'name role');
    await Notification.create({
      message: `New announcement: ${title}`,
      description: content.slice(0, 120),
      type: 'announcement',
      link: '/announcements',
      entityId: announcement._id,
      createdBy: req.user._id
    });
    res.status(201).json(formatAnnouncement(populated));
  } catch (error) {
    res.status(500).json({ message: 'Unable to create announcement', error: error.message });
  }
});

router.get('/events', authToken, async (req, res) => {
  try {
    const { start, end } = req.query;
    const filter = {};

    if (start) {
      const startDate = new Date(start);
      if (!Number.isNaN(startDate.getTime())) {
        filter.startsAt = { ...filter.startsAt, $gte: startDate };
      }
    }

    if (end) {
      const endDate = new Date(end);
      if (!Number.isNaN(endDate.getTime())) {
        filter.startsAt = { ...filter.startsAt, $lte: endDate };
      }
    }

    const events = await Event.find(filter).sort({ startsAt: 1 });
    res.json(events.map(formatEvent));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load events', error: error.message });
  }
});

router.get('/groups', authToken, async (req, res) => {
  try {
    const groups = await Group.find({ isPublic: true, status: 'active' })
      .populate('creator', 'name email role avatarUrl')
      .populate('members', 'name email role avatarUrl')
      .sort({ createdAt: -1 })
      .limit(20);

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
        member_count: g.members.length,
        max_members: g.maxMembers,
        tags: g.tags,
        created_at: g.createdAt
      })),
      myGroupIds: myGroupIds.map(id => id.toString())
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load groups', error: error.message });
  }
});

router.post('/groups/:groupId/join', authToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.members.some(m => m.equals(req.user._id))) {
      return res.status(400).json({ message: 'Already a member of this group' });
    }

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ message: 'Group is full' });
    }

    group.members.push(req.user._id);
    await group.save();

    res.json({ message: 'Successfully joined group' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to join group', error: error.message });
  }
});

router.get('/notifications', authToken, async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('createdBy', 'name role');

    const formatted = notifications.map((doc) => ({
      id: doc._id,
      message: doc.message,
      description: doc.description,
      type: doc.type,
      link: doc.link,
      created_at: doc.createdAt,
      createdBy: doc.createdBy ? { name: doc.createdBy.name, role: doc.createdBy.role } : null,
      isRead: doc.readBy?.some((reader) => reader.equals(req.user._id)) || false
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load notifications', error: error.message });
  }
});

router.post('/notifications/:id/read', authToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification id' });
    }

    await Notification.findByIdAndUpdate(
      id,
      { $addToSet: { readBy: req.user._id } },
      { new: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update notification', error: error.message });
  }
});

module.exports = router;