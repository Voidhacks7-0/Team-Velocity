// routes/commonRoutes.js - Routes any logged-in user can access
const express = require('express');
const mongoose = require('mongoose');
const { authToken, roleCheck } = require('../middleware/authMiddleware');
const Resource = require('../model/Resource');
const ResourceRequest = require('../model/ResourceRequest');

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

/**
 * The following placeholder routes still return static data.
 * They will be replaced with database-backed implementations
 * as the corresponding modules are built out.
 */

const placeholderAnnouncements = [
  {
    id: 'ann-1',
    title: 'Semester Kickoff Town Hall',
    content: 'Join the leadership team for a live Q&A about spring initiatives.',
    priority: 'high',
    is_pinned: true,
    created_at: new Date('2025-01-05T14:00:00Z').toISOString(),
    author: {
      full_name: 'Dean Harper',
      role: 'admin'
    }
  }
];

const placeholderEvents = [
  {
    id: 'event-1',
    title: 'Capstone Demo Day',
    description: 'Senior teams showcase prototypes and pitch to industry mentors.',
    start_time: new Date('2025-01-12T15:00:00Z').toISOString(),
    end_time: new Date('2025-01-12T18:00:00Z').toISOString(),
    location: 'Innovation Lab',
    event_type: 'workshop',
    creator: { full_name: 'Innovation Office', role: 'faculty' }
  }
];

const placeholderGroups = [
  {
    id: 'group-1',
    name: 'AI Research Circle',
    description: 'Weekly reading group to discuss breakthroughs in machine learning.',
    group_type: 'Academic',
    is_public: true,
    creator: { full_name: 'Prof. Priya Patel' },
    members: []
  }
];

router.get('/dashboard', authToken, (req, res) => {
  res.json({
    stats: {
      announcements: placeholderAnnouncements.length,
      upcomingEvents: placeholderEvents.length,
      activeBookings: 0,
      myGroups: 0
    },
    recentAnnouncements: placeholderAnnouncements,
    upcomingEvents: placeholderEvents
  });
});

router.get('/announcements', authToken, (req, res) => {
  res.json(placeholderAnnouncements);
});

router.post('/announcements', authToken, roleCheck('faculty', 'admin'), (req, res) => {
  const { title, content, priority = 'normal', is_pinned = false } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  const newAnnouncement = {
    id: `ann-${Date.now()}`,
    title,
    content,
    priority,
    is_pinned,
    created_at: new Date().toISOString(),
    author: {
      full_name: req.user.name,
      role: req.user.role
    }
  };

  placeholderAnnouncements.unshift(newAnnouncement);
  res.status(201).json(newAnnouncement);
});

router.get('/events', authToken, (req, res) => {
  res.json(placeholderEvents);
});

router.get('/groups', authToken, (req, res) => {
  res.json({
    groups: placeholderGroups,
    myGroupIds: []
  });
});

router.post('/groups/:groupId/join', authToken, (req, res) => {
  const { groupId } = req.params;
  const group = placeholderGroups.find((item) => item.id === groupId);

  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  if (group.members.includes(req.user.id)) {
    return res.status(400).json({ message: 'Already a member of this group' });
  }

  group.members.push(req.user.id);
  res.json({ groupId: group.id });
});

module.exports = router;