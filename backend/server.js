// server.js - Main entry point
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const commonRoutes = require('./routes/commonRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('dev')); // Log requests to console

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/auth', authRoutes);
app.use('/student', studentRoutes);
app.use('/faculty', facultyRoutes);
app.use('/admin', adminRoutes);
app.use('/common', commonRoutes);
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.originalUrl}`, {
    body: req.body,
    user: req.user ? { id: req.user._id, role: req.user.role } : null
  });
  next();
});

app.use('/events', eventRoutes);

// Basic route to test server
app.get('/', (req, res) => {
  res.json({ message: 'Campus Connect API is running!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});