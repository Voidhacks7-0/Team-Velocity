// routes/adminRoutes.js - Routes only admin can access
const express = require('express');
const mongoose = require('mongoose');
const { authToken, roleCheck } = require('../middleware/authMiddleware');
const ResourceCategory = require('../model/ResourceCategory');
const Resource = require('../model/Resource');
const ResourceRequest = require('../model/ResourceRequest');
const ResourceLog = require('../model/ResourceLog');
const User = require('../model/User');

const router = express.Router();

const adminOnly = [authToken, roleCheck('admin')];

// GET /admin/dashboard - Only admin can access
router.get('/dashboard', adminOnly, (req, res) => {
  res.json({
    message: 'Welcome to Admin Dashboard!',
    user: {
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

/**
 * Resource Categories
 */
router.get('/resource-categories', adminOnly, async (req, res) => {
  try {
    const categories = await ResourceCategory.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch categories', error: error.message });
  }
});

router.post('/resource-categories', adminOnly, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await ResourceCategory.create({ name, description });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create category', error: error.message });
  }
});

router.patch('/resource-categories/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = (({ name, description, isActive }) => ({ name, description, isActive }))(req.body);
    const category = await ResourceCategory.findByIdAndUpdate(id, updates, { new: true });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update category', error: error.message });
  }
});

router.delete('/resource-categories/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const category = await ResourceCategory.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const resourceUsingCategory = await Resource.exists({ category: id });
    if (resourceUsingCategory) {
      return res.status(400).json({ message: 'Cannot delete category that is in use by resources' });
    }

    await category.deleteOne();
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete category', error: error.message });
  }
});

/**
 * Resources CRUD
 */
router.get('/resources', adminOnly, async (req, res) => {
  try {
    const resources = await Resource.find()
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch resources', error: error.message });
  }
});

router.post('/resources', adminOnly, async (req, res) => {
  try {
    const {
      name,
      description,
      categoryId,
      location,
      status = 'available',
      totalQuantity = 1,
      allowBooking = true
    } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({ message: 'Name and category are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const category = await ResourceCategory.findById(categoryId);
    if (!category || !category.isActive) {
      return res.status(400).json({ message: 'Category is not active or does not exist' });
    }

    const resource = await Resource.create({
      name,
      description,
      category: categoryId,
      location,
      status,
      totalQuantity,
      availableQuantity: totalQuantity,
      allowBooking,
      createdBy: req.user._id
    });

    const populated = await resource.populate('category', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create resource', error: error.message });
  }
});

router.patch('/resources/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const updatableFields = [
      'name',
      'description',
      'location',
      'status',
      'totalQuantity',
      'allowBooking',
      'isActive'
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'totalQuantity') {
          const newTotal = Number(req.body[field]);
          if (Number.isNaN(newTotal) || newTotal < 0) {
            throw new Error('Total quantity must be a non-negative number');
          }
          const diff = newTotal - resource.totalQuantity;
          resource.availableQuantity = Math.max(0, resource.availableQuantity + diff);
          resource.totalQuantity = newTotal;
        } else {
          resource[field] = req.body[field];
        }
      }
    });

    if (req.body.categoryId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.categoryId)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }

      const category = await ResourceCategory.findById(req.body.categoryId);
      if (!category || !category.isActive) {
        return res.status(400).json({ message: 'Category is not active or does not exist' });
      }
      resource.category = req.body.categoryId;
    }

    resource.updatedBy = req.user._id;
    await resource.save();
    const populated = await resource.populate('category', 'name');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update resource', error: error.message });
  }
});

router.delete('/resources/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const hasActiveLoans = await ResourceRequest.exists({
      resource: id,
      status: { $in: ['approved', 'issued'] }
    });

    if (hasActiveLoans) {
      return res.status(400).json({ message: 'Cannot delete resource with active requests' });
    }

    await resource.deleteOne();
    res.json({ message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete resource', error: error.message });
  }
});

/**
 * Resource Requests workflow
 */
router.get('/resource-requests', adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }

    const requests = await ResourceRequest.find(query)
      .populate('requester', 'name email role')
      .populate({
        path: 'resource',
        populate: { path: 'category', select: 'name' }
      })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch requests', error: error.message });
  }
});

router.patch('/resource-requests/:id/status', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const allowedStatuses = ['approved', 'rejected'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const request = await ResourceRequest.findById(id).populate({
      path: 'resource',
      populate: { path: 'category', select: 'name' }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be updated' });
    }

    request.status = status;
    request.adminNote = adminNote;
    await request.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update request status', error: error.message });
  }
});

router.patch('/resource-requests/:id/issue', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { expectedReturnDate, adminNote, issueDate = new Date() } = req.body;
    const request = await ResourceRequest.findById(id).populate('resource');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (!['approved', 'issued'].includes(request.status)) {
      return res.status(400).json({ message: 'Only approved requests can be issued' });
    }

    const resource = await Resource.findById(request.resource._id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (resource.availableQuantity <= 0) {
      return res.status(400).json({ message: 'No inventory available' });
    }

    resource.availableQuantity -= 1;
    await resource.save();

    request.status = 'issued';
    request.issueDate = issueDate;
    request.expectedReturnDate = expectedReturnDate;
    request.adminNote = adminNote;
    await request.save();


    await ResourceLog.create({
      resource: resource._id,
      requester: request.requester,
      action: 'issued',
      issueDate,
      expectedReturnDate,
      adminNote
    });

    const populated = await request.populate({
      path: 'resource',
      populate: { path: 'category', select: 'name' }
    });

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Unable to issue resource', error: error.message });
  }
});

router.patch('/resource-requests/:id/return', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { conditionOnReturn, penalty = 0, adminNote } = req.body;
    const request = await ResourceRequest.findById(id).populate('resource');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'issued') {
      return res.status(400).json({ message: 'Only issued items can be marked as returned' });
    }

    const resource = await Resource.findById(request.resource._id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    resource.availableQuantity = Math.min(resource.totalQuantity, resource.availableQuantity + 1);
    await resource.save();

    request.status = 'returned';
    request.returnDate = new Date();
    request.conditionOnReturn = conditionOnReturn;
    request.penalty = penalty;
    request.adminNote = adminNote;
    await request.save();


    await ResourceLog.create({
      resource: resource._id,
      requester: request.requester,
      action: 'returned',
      issueDate: request.issueDate,
      expectedReturnDate: request.expectedReturnDate,
      returnDate: request.returnDate,
      conditionOnReturn,
      adminNote,
      penalty
    });

    const populated = await request.populate({
      path: 'resource',
      populate: { path: 'category', select: 'name' }
    });

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Unable to mark return', error: error.message });
  }
});

router.get('/resource-logs', adminOnly, async (req, res) => {
  try {
    const logs = await ResourceLog.find()
      .populate('requester', 'name email')
      .populate({
        path: 'resource',
        populate: { path: 'category', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch resource logs', error: error.message });
  }
});

/**
 * Users Management
 */
router.get('/users', authToken, roleCheck('admin'), async (req, res) => {
  try {
    const { role, department } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (department) filter.department = department;

    console.log(`[Admin] Fetching users with filter:`, filter);
    console.log(`[Admin] Query params:`, req.query);
    console.log(`[Admin] User making request:`, req.user?.email, req.user?.role);

    const users = await User.find(filter)
      .select('-password')
      .sort({ name: 1 });

    console.log(`[Admin] Found ${users.length} users`);

    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      phone: user.phone || '',
      avatarUrl: user.avatarUrl || ''
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('[Admin] Error fetching users:', error);
    console.error('[Admin] Error stack:', error.stack);
    res.status(500).json({ message: 'Unable to fetch users', error: error.message });
  }
});

module.exports = router;