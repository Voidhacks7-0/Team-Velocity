// routes/commonRoutes.js - Routes any logged-in user can access
const express = require('express');
const { authToken, roleCheck } = require('../middleware/authMiddleware');
const User = require('../model/User');

const router = express.Router();

// In-memory demo data to keep the UI connected until real collections exist
const announcements = [
  {
    id: 'ann-1',
    title: 'Semester Kickoff Town Hall',
    content: 'Join the leadership team for a live Q&A about spring initiatives, funding opportunities, and campus improvements.',
    priority: 'high',
    is_pinned: true,
    created_at: new Date('2025-01-05T14:00:00Z').toISOString(),
    author: {
      full_name: 'Dean Harper',
      role: 'admin'
    }
  },
  {
    id: 'ann-2',
    title: 'Faculty-Student Mixer',
    content: 'Grab coffee with faculty mentors this Friday at the Innovation Hub.',
    priority: 'normal',
    is_pinned: false,
    created_at: new Date('2025-01-08T16:30:00Z').toISOString(),
    author: {
      full_name: 'Campus Life',
      role: 'faculty'
    }
  },
  {
    id: 'ann-3',
    title: 'Research Grant Applications',
    content: 'Final reminder: interdisciplinary micro-grant proposals are due Monday at 5 PM.',
    priority: 'urgent',
    is_pinned: false,
    created_at: new Date('2025-01-09T10:15:00Z').toISOString(),
    author: {
      full_name: 'Research Office',
      role: 'admin'
    }
  }
];

const events = [
  {
    id: 'event-1',
    title: 'Capstone Demo Day',
    description: 'Senior teams showcase prototypes and pitch to industry mentors.',
    start_time: new Date('2025-01-12T15:00:00Z').toISOString(),
    end_time: new Date('2025-01-12T18:00:00Z').toISOString(),
    location: 'Innovation Lab',
    event_type: 'workshop',
    creator: { full_name: 'Innovation Office', role: 'faculty' }
  },
  {
    id: 'event-2',
    title: 'Community Hack Night',
    description: 'Open build night for students exploring new tools.',
    start_time: new Date('2025-01-11T00:00:00Z').toISOString(),
    end_time: new Date('2025-01-11T03:00:00Z').toISOString(),
    location: 'Library Studio 3A',
    event_type: 'general',
    creator: { full_name: 'Tech Guild', role: 'student' }
  },
  {
    id: 'event-3',
    title: 'Faculty Office Hours Marathon',
    description: 'Meet with advisors from every department in one place.',
    start_time: new Date('2025-01-15T17:00:00Z').toISOString(),
    end_time: new Date('2025-01-15T20:00:00Z').toISOString(),
    location: 'Student Success Center',
    event_type: 'meeting',
    creator: { full_name: 'Student Success', role: 'faculty' }
  }
];

const resources = [
  {
    id: 'res-1',
    name: 'Innovation Lab',
    description: 'High-end prototyping lab equipped with 3D printers and laser cutters.',
    resource_type: 'Lab',
    location: 'Building B, Room 210',
    is_available: true
  },
  {
    id: 'res-2',
    name: 'Media Studio',
    description: 'Sound-proof studio for podcasts, livestreams, and media production.',
    resource_type: 'Studio',
    location: 'Library Lower Level',
    is_available: true
  },
  {
    id: 'res-3',
    name: 'Conference Hall A',
    description: '120-seat hall with dual projectors for presentations and panel talks.',
    resource_type: 'Space',
    location: 'Campus Center 2nd Floor',
    is_available: true
  }
];

const groups = [
  {
    id: 'group-1',
    name: 'AI Research Circle',
    description: 'Weekly reading group to discuss breakthroughs in machine learning.',
    group_type: 'Academic',
    is_public: true,
    creator: { full_name: 'Prof. Priya Patel' },
    members: []
  },
  {
    id: 'group-2',
    name: 'Green Campus Collective',
    description: 'Student-led organization focused on sustainability projects.',
    group_type: 'Community',
    is_public: true,
    creator: { full_name: 'Avery Lin' },
    members: []
  },
  {
    id: 'group-3',
    name: 'Women in Tech',
    description: 'Mentorship network supporting women and non-binary technologists.',
    group_type: 'Professional',
    is_public: true,
    creator: { full_name: 'Center for Inclusive Excellence' },
    members: []
  }
];

// bookings persist per server instance for demo purposes
const bookings = [];

const attachResource = (booking) => ({
  ...booking,
  resource: resources.find((resource) => resource.id === booking.resource_id) || null
});

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

// Profile details for current user
router.get('/profile', authToken, (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    phone: req.user.phone || '',
    department: req.user.department || '',
    avatarUrl: req.user.avatarUrl || '',
    preferences: req.user.preferences || { language: 'en', theme: 'light' },
    createdAt: req.user.createdAt,
    updatedAt: req.user.updatedAt
  });
});

router.put('/profile', authToken, async (req, res) => {
  const {
    name,
    phone = '',
    department = '',
    avatarUrl = '',
    preferences = {}
  } = req.body;

  const updates = {
    ...(name ? { name } : {}),
    phone,
    department,
    avatarUrl,
    preferences: {
      language: preferences.language || req.user.preferences?.language || 'en',
      theme: preferences.theme || req.user.preferences?.theme || 'light'
    },
    updatedAt: Date.now()
  };

  try {
    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = updatedUser;

    res.json({
      message: 'Profile updated successfully',
      profile: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone || '',
        department: updatedUser.department || '',
        avatarUrl: updatedUser.avatarUrl || '',
        preferences: updatedUser.preferences || { language: 'en', theme: 'light' },
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// GET /common/dashboard - Provide summary cards + key lists
router.get('/dashboard', authToken, (req, res) => {
  const now = new Date();
  const upcomingEvents = events
    .filter((event) => new Date(event.start_time) >= now)
    .slice(0, 3);
  const recentAnnouncements = announcements.slice(0, 3);
  const userBookings = bookings.filter((booking) => booking.user_id === req.user.id);
  const userGroups = groups.filter((group) => group.members.includes(req.user.id));

  res.json({
    stats: {
      announcements: announcements.length,
      upcomingEvents: upcomingEvents.length,
      activeBookings: userBookings.filter((booking) =>
        ['pending', 'approved'].includes(booking.status)
      ).length,
      myGroups: userGroups.length
    },
    recentAnnouncements,
    upcomingEvents
  });
});

// Announcements CRUD-lite
router.get('/announcements', authToken, (req, res) => {
  res.json(announcements);
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

  announcements.unshift(newAnnouncement);
  res.status(201).json(newAnnouncement);
});

// Events feed (+ optional date filtering)
router.get('/events', authToken, (req, res) => {
  const { start, end } = req.query;
  let filteredEvents = [...events];

  if (start) {
    const startDate = new Date(start);
    filteredEvents = filteredEvents.filter(
      (event) => new Date(event.start_time) >= startDate
    );
  }

  if (end) {
    const endDate = new Date(end);
    filteredEvents = filteredEvents.filter(
      (event) => new Date(event.start_time) <= endDate
    );
  }

  res.json(filteredEvents);
});

// Resource catalog + bookings
router.get('/resources', authToken, (req, res) => {
  res.json(resources.filter((resource) => resource.is_available));
});

router.get('/bookings', authToken, (req, res) => {
  const userBookings = bookings
    .filter((booking) => booking.user_id === req.user.id)
    .map(attachResource);
  res.json(userBookings);
});

router.post('/bookings', authToken, (req, res) => {
  const { resourceId, startTime, endTime, purpose = 'General use' } = req.body;
  if (!resourceId) {
    return res.status(400).json({ message: 'Resource ID is required' });
  }

  const resource = resources.find((item) => item.id === resourceId);
  if (!resource) {
    return res.status(404).json({ message: 'Resource not found' });
  }

  const newBooking = {
    id: `book-${Date.now()}`,
    resource_id: resourceId,
    user_id: req.user.id,
    start_time: startTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    end_time:
      endTime || new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    purpose,
    status: 'pending'
  };

  bookings.unshift(newBooking);
  res.status(201).json(attachResource(newBooking));
});

// Groups directory
router.get('/groups', authToken, (req, res) => {
  const membershipIds = groups
    .filter((group) => group.members.includes(req.user.id))
    .map((group) => group.id);

  res.json({
    groups: groups.map((group) => ({
      ...group,
      member_count: group.members.length
    })),
    myGroupIds: membershipIds
  });
});

router.post('/groups/:groupId/join', authToken, (req, res) => {
  const { groupId } = req.params;
  const group = groups.find((item) => item.id === groupId);

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