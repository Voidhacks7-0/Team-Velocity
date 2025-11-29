// models/Class.js - Class/Section management
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  department: {
    type: String,
    required: true,
    enum: ['CSE', 'IT', 'AD', 'Civil', 'Mechanical'],
    trim: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  assignedFaculties: [{
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    subject: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ['primary', 'secondary', 'assistant'],
      default: 'primary'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  timetable: {
    monday: [{
      time: String,
      type: {
        type: String,
        enum: ['lecture', 'lab', 'break', 'lunch'],
        default: 'lecture'
      },
      subject: String,
      faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      room: String
    }],
    tuesday: [{
      time: String,
      type: {
        type: String,
        enum: ['lecture', 'lab', 'break', 'lunch'],
        default: 'lecture'
      },
      subject: String,
      faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      room: String
    }],
    wednesday: [{
      time: String,
      type: {
        type: String,
        enum: ['lecture', 'lab', 'break', 'lunch'],
        default: 'lecture'
      },
      subject: String,
      faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      room: String
    }],
    thursday: [{
      time: String,
      type: {
        type: String,
        enum: ['lecture', 'lab', 'break', 'lunch'],
        default: 'lecture'
      },
      subject: String,
      faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      room: String
    }],
    friday: [{
      time: String,
      type: {
        type: String,
        enum: ['lecture', 'lab', 'break', 'lunch'],
        default: 'lecture'
      },
      subject: String,
      faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      room: String
    }],
    saturday: [{
      time: String,
      type: {
        type: String,
        enum: ['lecture', 'lab', 'break', 'lunch'],
        default: 'lecture'
      },
      subject: String,
      faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      room: String
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

classSchema.pre('save', function preSave(next) {
  this.updatedAt = Date.now();
  next();
});

classSchema.index({ department: 1, semester: 1 });
classSchema.index({ 'assignedFaculties.faculty': 1 });

module.exports = mongoose.model('Class', classSchema);

