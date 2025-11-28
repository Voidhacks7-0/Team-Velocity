// server.js - Main entry point
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

// Import routes
try {
  var authRoutes = require('./routes/authRoutes');
  var studentRoutes = require('./routes/studentRoutes');
  var facultyRoutes = require('./routes/facultyRoutes');
  var adminRoutes = require('./routes/adminRoutes');
  var commonRoutes = require('./routes/commonRoutes');
  var eventRoutes = require('./routes/eventRoutes');
  var groupRoutes = require('./routes/groupRoutes');
  var forumRoutes = require('./routes/forumRoutes');
  var projectRoutes = require('./routes/projectRoutes');
  var chatRoutes = require('./routes/chatRoutes');
  var classRoutes = require('./routes/classRoutes');
  var facultyClassRoutes = require('./routes/facultyClassRoutes');
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('dev')); // Log requests to console

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Basic route to test server
app.get('/', (req, res) => {
  res.json({ message: 'Campus Connect API is running!' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/student', studentRoutes);
app.use('/faculty', facultyRoutes);
app.use('/faculty', facultyClassRoutes);
app.use('/admin', adminRoutes);
app.use('/common', commonRoutes);
app.use('/events', eventRoutes);
app.use('/groups', groupRoutes);
app.use('/forums', forumRoutes);
app.use('/projects', projectRoutes);
app.use('/chats', chatRoutes);
app.use('/classes', classRoutes);

// Logging middleware (after routes)
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.originalUrl}`, {
    body: req.body,
    user: req.user ? { id: req.user._id, role: req.user.role } : null
  });
  next();
});

// 404 handler (must be last)
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});