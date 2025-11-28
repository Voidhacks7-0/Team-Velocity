const express = require('express');
const mongoose = require('mongoose');
const { authToken, roleCheck } = require('../middleware/authMiddleware');
const Event = require('../model/Event');
const EventRegistration = require('../model/EventRegistration');
const EventRegistrationLog = require('../model/EventRegistrationLog');
const Notification = require('../model/Notification');

const router = express.Router();

/**
 * GET /events
 * Visible to all authenticated users. Returns events plus registration flag.
 */
router.get('/', authToken, async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ startsAt: 1 })
      .lean();

    const eventIds = events.map((event) => event._id);

    const registrations = await EventRegistration.find({
      event: { $in: eventIds }
    })
      .populate('user', 'name email')
      .lean();

    const registeredIds = new Set(
      registrations
        .filter((reg) => reg.user && reg.user._id.equals(req.user._id))
        .map((reg) => reg.event.toString())
    );

    const grouped = registrations.reduce((acc, reg) => {
      const key = reg.event.toString();
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        id: reg._id,
        name: reg.user?.name,
        email: reg.user?.email,
        registeredAt: reg.createdAt
      });
      return acc;
    }, {});

    const enriched = events.map((event) => {
      const eventId = event._id.toString();
      return {
        ...event,
        attendeesCount: grouped[eventId]?.length || 0,
        attendees: {
          hasRegistered: registeredIds.has(eventId),
          list: req.user.role === 'admin' ? grouped[eventId] || [] : undefined
        }
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch events', error: error.message });
  }
});

/**
 * POST /events
 * Admins can create events.
 */
router.post('/', authToken, roleCheck('admin'), async (req, res) => {
  try {
    const { title, description, location, startsAt, endsAt, capacity, eventType = 'general' } = req.body;

    if (!title || !startsAt || !endsAt) {
      return res.status(400).json({ message: 'Title, start time, and end time are required' });
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid start or end time' });
    }

    if (startDate >= endDate) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }

    const event = await Event.create({
      title,
      description,
      location,
      startsAt: startDate,
      endsAt: endDate,
      capacity: capacity || 0,
      eventType,
      createdBy: req.user._id
    });
    await Notification.create({
      message: `New event: ${title}`,
      description: description?.slice(0, 120),
      type: 'event',
      link: '/events',
      entityId: event._id,
      createdBy: req.user._id
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create event', error: error.message });
  }
});

/**
 * POST /events/:eventId/register
 * Students/faculty register for an event.
 */
router.post('/:eventId/register', authToken, roleCheck('student', 'faculty'), async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.capacity > 0 && event.attendeesCount >= event.capacity) {
      return res.status(400).json({ message: 'Event is full' });
    }

    const registration = new EventRegistration({
      event: eventId,
      user: req.user._id
    });

    await registration.save();

    event.attendeesCount += 1;
    await event.save();

    await EventRegistrationLog.create({
      event: eventId,
      user: req.user._id
    });

    res.status(201).json({ message: 'Registered successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }
    res.status(500).json({ message: 'Unable to register for event', error: error.message });
  }
});

router.get('/:eventId/logs', authToken, roleCheck('admin'), async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const logs = await EventRegistrationLog.find({ event: eventId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch event logs', error: error.message });
  }
});

module.exports = router;

