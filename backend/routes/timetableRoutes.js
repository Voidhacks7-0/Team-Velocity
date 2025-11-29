// routes/timetableRoutes.js - Routes for timetable management
const express = require('express');
const { authToken, roleCheck } = require('../middleware/authMiddleware');
const Class = require('../model/Class');

const router = express.Router();

// Helper function to generate default time slots (9 AM - 4 PM)
const generateDefaultTimeSlots = () => {
  return {
    monday: [
      { time: '09:00-10:00', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '10:00-10:15', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '10:15-11:15', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '11:15-11:30', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '11:30-12:30', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '12:30-13:30', type: 'lunch', subject: 'Lunch Break', faculty: null, room: '' },
      { time: '13:30-14:30', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '14:30-14:45', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '14:45-15:45', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '15:45-16:00', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '16:00-17:00', type: 'lab', subject: '', faculty: null, room: '' }
    ],
    tuesday: [
      { time: '09:00-10:00', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '10:00-10:15', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '10:15-11:15', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '11:15-11:30', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '11:30-12:30', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '12:30-13:30', type: 'lunch', subject: 'Lunch Break', faculty: null, room: '' },
      { time: '13:30-14:30', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '14:30-14:45', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '14:45-15:45', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '15:45-16:00', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '16:00-17:00', type: 'lab', subject: '', faculty: null, room: '' }
    ],
    wednesday: [
      { time: '09:00-10:00', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '10:00-10:15', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '10:15-11:15', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '11:15-11:30', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '11:30-12:30', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '12:30-13:30', type: 'lunch', subject: 'Lunch Break', faculty: null, room: '' },
      { time: '13:30-14:30', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '14:30-14:45', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '14:45-15:45', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '15:45-16:00', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '16:00-17:00', type: 'lab', subject: '', faculty: null, room: '' }
    ],
    thursday: [
      { time: '09:00-10:00', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '10:00-10:15', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '10:15-11:15', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '11:15-11:30', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '11:30-12:30', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '12:30-13:30', type: 'lunch', subject: 'Lunch Break', faculty: null, room: '' },
      { time: '13:30-14:30', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '14:30-14:45', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '14:45-15:45', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '15:45-16:00', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '16:00-17:00', type: 'lab', subject: '', faculty: null, room: '' }
    ],
    friday: [
      { time: '09:00-10:00', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '10:00-10:15', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '10:15-11:15', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '11:15-11:30', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '11:30-12:30', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '12:30-13:30', type: 'lunch', subject: 'Lunch Break', faculty: null, room: '' },
      { time: '13:30-14:30', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '14:30-14:45', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '14:45-15:45', type: 'lecture', subject: '', faculty: null, room: '' },
      { time: '15:45-16:00', type: 'break', subject: 'Break', faculty: null, room: '' },
      { time: '16:00-17:00', type: 'lab', subject: '', faculty: null, room: '' }
    ],
    saturday: []
  };
};

// GET /timetable/:classId - Get timetable for a class
router.get('/:classId', authToken, async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.classId)
      .populate('assignedFaculties.faculty', 'name email department')
      .populate('students', '_id');

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check access permissions
    if (req.user.role === 'faculty') {
      const isAssigned = classDoc.assignedFaculties.some(
        af => af.faculty._id.equals(req.user._id)
      );
      if (!isAssigned && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'student') {
      // Students can view if they are enrolled in the class
      const isEnrolled = classDoc.students.some(
        s => s._id.equals(req.user._id)
      );
      if (!isEnrolled) {
        return res.status(403).json({ message: 'Access denied. You are not enrolled in this class.' });
      }
    }

    // If timetable is empty, initialize with default structure
    let timetable = classDoc.timetable;
    if (!timetable || Object.keys(timetable).length === 0 || 
        !timetable.monday || timetable.monday.length === 0) {
      timetable = generateDefaultTimeSlots();
      // Save the default timetable
      classDoc.timetable = timetable;
      await classDoc.save();
    }

    // Format timetable slots with faculty IDs as strings
    const formattedTimetable = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    days.forEach(day => {
      formattedTimetable[day] = (timetable[day] || []).map((slot) => ({
        time: slot.time || '',
        type: slot.type || 'lecture',
        subject: slot.subject || '',
        faculty: slot.faculty ? (slot.faculty.toString ? slot.faculty.toString() : String(slot.faculty)) : null,
        room: slot.room || ''
      }));
    });

    res.json({
      class_id: classDoc._id.toString(),
      class_name: classDoc.name,
      class_code: classDoc.code,
      timetable: formattedTimetable,
      assigned_faculties: classDoc.assignedFaculties.map(af => ({
        id: af.faculty._id.toString(),
        name: af.faculty.name,
        email: af.faculty.email,
        department: af.faculty.department,
        subject: af.subject,
        role: af.role
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load timetable', error: error.message });
  }
});

// PUT /timetable/:classId - Update timetable for a class (admin and faculty only)
router.put('/:classId', authToken, async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.classId);

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Students cannot update timetables
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Access denied. Students cannot update timetables.' });
    }

    // Check access permissions
    if (req.user.role === 'faculty') {
      const isAssigned = classDoc.assignedFaculties.some(
        af => af.faculty.equals(req.user._id)
      );
      if (!isAssigned && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const { timetable } = req.body;

    if (!timetable) {
      return res.status(400).json({ message: 'Timetable data is required' });
    }

    // Validate timetable structure
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const validatedTimetable = {};
    const mongoose = require('mongoose');
    
    for (const day of days) {
      if (timetable[day] && Array.isArray(timetable[day])) {
        // Validate each slot and convert faculty ID to ObjectId if provided
        validatedTimetable[day] = timetable[day].map(slot => ({
          time: slot.time || '',
          type: slot.type || 'lecture',
          subject: slot.subject || '',
          faculty: slot.faculty && slot.faculty !== '' && mongoose.Types.ObjectId.isValid(slot.faculty) 
            ? new mongoose.Types.ObjectId(slot.faculty) 
            : null,
          room: slot.room || ''
        }));
      } else {
        validatedTimetable[day] = [];
      }
    }

    classDoc.timetable = validatedTimetable;
    await classDoc.save();

    const populated = await Class.findById(classDoc._id)
      .populate('assignedFaculties.faculty', 'name email department');

    res.json({
      message: 'Timetable updated successfully',
      timetable: classDoc.timetable
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update timetable', error: error.message });
  }
});

// POST /timetable/:classId/initialize - Initialize timetable with default structure
router.post('/:classId/initialize', authToken, roleCheck('admin'), async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.classId);

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const defaultTimetable = generateDefaultTimeSlots();
    classDoc.timetable = defaultTimetable;
    await classDoc.save();

    res.json({
      message: 'Timetable initialized with default structure',
      timetable: classDoc.timetable
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to initialize timetable', error: error.message });
  }
});

module.exports = router;

