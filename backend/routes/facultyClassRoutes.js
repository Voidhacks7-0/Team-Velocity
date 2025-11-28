// routes/facultyClassRoutes.js - Faculty-specific class operations
const express = require('express');
const { authToken, roleCheck } = require('../middleware/authMiddleware');
const Class = require('../model/Class');
const Resource = require('../model/Resource');
const ResourceRequest = require('../model/ResourceRequest');

const router = express.Router();

// GET /faculty/classes - Get classes assigned to the logged-in faculty
router.get('/classes', authToken, roleCheck('faculty'), async (req, res) => {
  try {
    const classes = await Class.find({
      'assignedFaculties.faculty': req.user._id,
      status: 'active'
    })
      .populate('assignedFaculties.faculty', 'name email')
      .populate('students', 'name email')
      .sort({ department: 1, semester: 1 });

    res.json(classes.map(cls => {
      const myAssignment = cls.assignedFaculties.find(
        af => af.faculty._id.equals(req.user._id)
      );

      return {
        id: cls._id,
        name: cls.name,
        code: cls.code,
        department: cls.department,
        semester: cls.semester,
        academic_year: cls.academicYear,
        my_assignment: {
          subject: myAssignment?.subject,
          role: myAssignment?.role
        },
        student_count: cls.students.length,
        timetable: cls.timetable,
        created_at: cls.createdAt
      };
    }));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load classes', error: error.message });
  }
});

// GET /faculty/classes/:id/resources - Get resources for a specific class
router.get('/classes/:id/resources', authToken, roleCheck('faculty'), async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Verify faculty is assigned to this class
    const isAssigned = classDoc.assignedFaculties.some(
      af => af.faculty.equals(req.user._id)
    );

    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this class' });
    }

    const resources = await Resource.find({
      $or: [
        { assignedClass: classDoc._id },
        { department: classDoc.department, assignedClass: null }
      ],
      isActive: true
    })
      .populate('category', 'name')
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
      department: r.department
    })));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load resources', error: error.message });
  }
});

// POST /faculty/classes/:id/resources - Assign resource to class
router.post('/classes/:id/resources', authToken, roleCheck('faculty'), async (req, res) => {
  try {
    const { resourceId } = req.body;

    if (!resourceId) {
      return res.status(400).json({ message: 'Resource ID is required' });
    }

    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Verify faculty is assigned to this class
    const isAssigned = classDoc.assignedFaculties.some(
      af => af.faculty.equals(req.user._id)
    );

    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this class' });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check if resource belongs to same department or is general
    if (resource.department && resource.department !== 'General' && resource.department !== classDoc.department) {
      return res.status(400).json({ message: 'Resource does not belong to this department' });
    }

    resource.assignedClass = classDoc._id;
    resource.assignedBy = req.user._id;
    resource.department = classDoc.department;
    await resource.save();

    res.json({
      message: 'Resource assigned to class successfully',
      resource: {
        id: resource._id,
        name: resource.name,
        assigned_class: {
          id: classDoc._id,
          name: classDoc.name
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to assign resource', error: error.message });
  }
});

// DELETE /faculty/classes/:id/resources/:resourceId - Unassign resource from class
router.delete('/classes/:id/resources/:resourceId', authToken, roleCheck('faculty'), async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Verify faculty is assigned to this class
    const isAssigned = classDoc.assignedFaculties.some(
      af => af.faculty.equals(req.user._id)
    );

    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this class' });
    }

    const resource = await Resource.findById(req.params.resourceId);
    if (!resource || !resource.assignedClass || !resource.assignedClass.equals(classDoc._id)) {
      return res.status(404).json({ message: 'Resource not found or not assigned to this class' });
    }

    resource.assignedClass = null;
    resource.assignedBy = null;
    await resource.save();

    res.json({ message: 'Resource unassigned from class successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to unassign resource', error: error.message });
  }
});

// GET /faculty/classes/:id/students - Get students in assigned class
router.get('/classes/:id/students', authToken, roleCheck('faculty'), async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id)
      .populate('students', 'name email department phone');

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Verify faculty is assigned
    const isAssigned = classDoc.assignedFaculties.some(
      af => af.faculty.equals(req.user._id)
    );

    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this class' });
    }

    res.json({
      class_id: classDoc._id,
      class_name: classDoc.name,
      class_code: classDoc.code,
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

// GET /faculty/classes/:id/requests - Get resource requests for this class
router.get('/classes/:id/requests', authToken, roleCheck('faculty'), async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Verify faculty is assigned
    const isAssigned = classDoc.assignedFaculties.some(
      af => af.faculty.equals(req.user._id)
    );

    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this class' });
    }

    // Get resources assigned to this class
    const classResources = await Resource.find({ assignedClass: classDoc._id }).distinct('_id');

    const requests = await ResourceRequest.find({
      resource: { $in: classResources },
      requester: { $in: classDoc.students }
    })
      .populate('resource', 'name description')
      .populate('requester', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests.map(req => ({
      id: req._id,
      resource: {
        id: req.resource._id,
        name: req.resource.name,
        description: req.resource.description
      },
      requester: {
        id: req.requester._id,
        name: req.requester.name,
        email: req.requester.email
      },
      purpose: req.purpose,
      status: req.status,
      created_at: req.createdAt
    })));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load requests', error: error.message });
  }
});

module.exports = router;

