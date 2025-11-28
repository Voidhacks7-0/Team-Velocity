// routes/classRoutes.js - Routes for class management
const express = require('express');
const mongoose = require('mongoose');
const { authToken, roleCheck } = require('../middleware/authMiddleware');
const Class = require('../model/Class');
const User = require('../model/User');
const Resource = require('../model/Resource');

const router = express.Router();

// GET /classes - Get all classes (admin) or classes assigned to faculty
router.get('/', authToken, async (req, res) => {
  try {
    let filter = {};

    // Faculty can only see their assigned classes
    if (req.user.role === 'faculty') {
      filter['assignedFaculties.faculty'] = req.user._id;
    }

    const classes = await Class.find(filter)
      .populate('assignedFaculties.faculty', 'name email role department')
      .populate('createdBy', 'name email')
      .populate('students', 'name email')
      .sort({ department: 1, semester: 1, name: 1 });

    res.json(classes.map(cls => ({
      id: cls._id,
      name: cls.name,
      code: cls.code,
      department: cls.department,
      semester: cls.semester,
      academic_year: cls.academicYear,
      assigned_faculties: cls.assignedFaculties.map(af => ({
        faculty: {
          id: af.faculty._id,
          name: af.faculty.name,
          email: af.faculty.email,
          department: af.faculty.department
        },
        subject: af.subject,
        role: af.role,
        assigned_at: af.assignedAt
      })),
      student_count: cls.students.length,
      timetable: cls.timetable,
      status: cls.status,
      created_by: {
        id: cls.createdBy._id,
        name: cls.createdBy.name
      },
      created_at: cls.createdAt,
      updated_at: cls.updatedAt
    })));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load classes', error: error.message });
  }
});

// GET /classes/:id - Get a specific class
router.get('/:id', authToken, async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id)
      .populate('assignedFaculties.faculty', 'name email role department')
      .populate('createdBy', 'name email')
      .populate('students', 'name email department');

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Faculty can only access their assigned classes
    if (req.user.role === 'faculty') {
      const isAssigned = classDoc.assignedFaculties.some(
        af => af.faculty._id.equals(req.user._id)
      );
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied. You are not assigned to this class.' });
      }
    }

    res.json({
      id: classDoc._id,
      name: classDoc.name,
      code: classDoc.code,
      department: classDoc.department,
      semester: classDoc.semester,
      academic_year: classDoc.academicYear,
      assigned_faculties: classDoc.assignedFaculties.map(af => ({
        faculty: {
          id: af.faculty._id,
          name: af.faculty.name,
          email: af.faculty.email,
          department: af.faculty.department
        },
        subject: af.subject,
        role: af.role,
        assigned_at: af.assignedAt
      })),
      students: classDoc.students.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        department: s.department
      })),
      timetable: classDoc.timetable,
      status: classDoc.status,
      created_by: {
        id: classDoc.createdBy._id,
        name: classDoc.createdBy.name
      },
      created_at: classDoc.createdAt,
      updated_at: classDoc.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load class', error: error.message });
  }
});

// POST /classes - Create a new class (admin only)
router.post('/', authToken, roleCheck('admin'), async (req, res) => {
  try {
    const { name, code, department, semester, academicYear } = req.body;

    if (!name || !code || !department || !semester || !academicYear) {
      return res.status(400).json({ message: 'Name, code, department, semester, and academic year are required' });
    }

    const existingClass = await Class.findOne({ code: code.toUpperCase() });
    if (existingClass) {
      return res.status(400).json({ message: 'Class code already exists' });
    }

    const classDoc = await Class.create({
      name,
      code: code.toUpperCase(),
      department,
      semester,
      academicYear,
      createdBy: req.user._id,
      timetable: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: []
      }
    });

    const populated = await Class.findById(classDoc._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      id: populated._id,
      name: populated.name,
      code: populated.code,
      department: populated.department,
      semester: populated.semester,
      academic_year: populated.academicYear,
      created_at: populated.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to create class', error: error.message });
  }
});

// POST /classes/:id/assign-faculty - Assign faculty to class (admin only)
router.post('/:id/assign-faculty', authToken, roleCheck('admin'), async (req, res) => {
  try {
    const { facultyId, subject, role } = req.body;

    if (!facultyId || !subject) {
      return res.status(400).json({ message: 'Faculty ID and subject are required' });
    }

    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(400).json({ message: 'Invalid faculty ID' });
    }

    // Check if faculty is already assigned
    const alreadyAssigned = classDoc.assignedFaculties.some(
      af => af.faculty.equals(facultyId)
    );
    if (alreadyAssigned) {
      return res.status(400).json({ message: 'Faculty is already assigned to this class' });
    }

    classDoc.assignedFaculties.push({
      faculty: facultyId,
      subject,
      role: role || 'primary',
      assignedAt: new Date()
    });

    await classDoc.save();

    const populated = await Class.findById(classDoc._id)
      .populate('assignedFaculties.faculty', 'name email department');

    res.json({
      message: 'Faculty assigned successfully',
      class: {
        id: populated._id,
        assigned_faculties: populated.assignedFaculties.map(af => ({
          faculty: {
            id: af.faculty._id,
            name: af.faculty.name,
            email: af.faculty.email
          },
          subject: af.subject,
          role: af.role
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to assign faculty', error: error.message });
  }
});

// DELETE /classes/:id/assign-faculty/:facultyId - Remove faculty from class (admin only)
router.delete('/:id/assign-faculty/:facultyId', authToken, roleCheck('admin'), async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    classDoc.assignedFaculties = classDoc.assignedFaculties.filter(
      af => !af.faculty.equals(req.params.facultyId)
    );

    await classDoc.save();

    res.json({ message: 'Faculty removed from class successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to remove faculty', error: error.message });
  }
});

// PUT /classes/:id/timetable - Update timetable (admin or assigned faculty)
router.put('/:id/timetable', authToken, async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Faculty can only update if assigned
    if (req.user.role === 'faculty') {
      const isAssigned = classDoc.assignedFaculties.some(
        af => af.faculty.equals(req.user._id)
      );
      if (!isAssigned && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const { timetable } = req.body;
    if (timetable) {
      classDoc.timetable = timetable;
      await classDoc.save();
    }

    res.json({ message: 'Timetable updated successfully', timetable: classDoc.timetable });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update timetable', error: error.message });
  }
});

// GET /classes/:id/resources - Get resources assigned to this class
router.get('/:id/resources', authToken, async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Faculty can only access if assigned
    if (req.user.role === 'faculty') {
      const isAssigned = classDoc.assignedFaculties.some(
        af => af.faculty.equals(req.user._id)
      );
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const resources = await Resource.find({
      $or: [
        { assignedClass: classDoc._id },
        { department: classDoc.department, assignedClass: null }
      ]
    })
      .populate('category', 'name')
      .populate('assignedBy', 'name email')
      .sort({ name: 1 });

    res.json(resources.map(r => ({
      id: r._id,
      name: r.name,
      description: r.description,
      category: r.category ? { id: r.category._id, name: r.category.name } : null,
      location: r.location,
      status: r.status,
      total_quantity: r.totalQuantity,
      available_quantity: r.availableQuantity,
      department: r.department,
      assigned_by: r.assignedBy ? {
        id: r.assignedBy._id,
        name: r.assignedBy.name
      } : null
    })));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load class resources', error: error.message });
  }
});

// GET /classes/:id/students - Get students in class
router.get('/:id/students', authToken, async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id)
      .populate('students', 'name email department phone');

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Faculty can only access if assigned
    if (req.user.role === 'faculty') {
      const isAssigned = classDoc.assignedFaculties.some(
        af => af.faculty.equals(req.user._id)
      );
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({
      class_id: classDoc._id,
      class_name: classDoc.name,
      students: classDoc.students.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        department: s.department,
        phone: s.phone
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load students', error: error.message });
  }
});

// POST /classes/:id/students - Add students to class (admin only)
router.post('/:id/students', authToken, roleCheck('admin'), async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Student IDs array is required' });
    }

    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Verify all are students
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student'
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({ message: 'Some IDs are not valid students' });
    }

    // Add students (avoid duplicates)
    studentIds.forEach(studentId => {
      if (!classDoc.students.some(s => s.equals(studentId))) {
        classDoc.students.push(studentId);
      }
    });

    await classDoc.save();

    const populated = await Class.findById(classDoc._id)
      .populate('students', 'name email department');

    res.json({
      message: 'Students added successfully',
      students: populated.students.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to add students', error: error.message });
  }
});

// DELETE /classes/:id - Delete class (admin only)
router.delete('/:id', authToken, roleCheck('admin'), async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Unassign resources from this class
    await Resource.updateMany(
      { assignedClass: classDoc._id },
      { assignedClass: null, assignedBy: null }
    );

    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete class', error: error.message });
  }
});

module.exports = router;

