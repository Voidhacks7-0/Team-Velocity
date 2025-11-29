// scripts/createMockStudents.js - Create mock student data and assign to classes
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../model/User');
const Class = require('../model/Class');

const departments = ['CSE', 'IT', 'AD', 'Civil', 'Mechanical'];
const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

// Generate student names for each department
const generateStudentNames = (dept, semester, count) => {
  const names = [];
  const firstNames = [
    'Aarav', 'Aditya', 'Aman', 'Aniket', 'Arjun', 'Ayush', 'Dhruv', 'Harsh', 'Ishaan', 'Karan',
    'Kunal', 'Manav', 'Nikhil', 'Pranav', 'Rahul', 'Rohan', 'Sahil', 'Shubham', 'Vikram', 'Yash',
    'Aanya', 'Ananya', 'Diya', 'Isha', 'Kavya', 'Meera', 'Neha', 'Priya', 'Riya', 'Sanya',
    'Shreya', 'Sneha', 'Tanvi', 'Vidya', 'Zara'
  ];
  const lastNames = [
    'Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Verma', 'Yadav', 'Joshi', 'Mehta', 'Shah',
    'Desai', 'Nair', 'Rao', 'Iyer', 'Malhotra', 'Choudhary', 'Pandey', 'Mishra', 'Reddy', 'Krishnan'
  ];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${dept.toLowerCase()}${semester}${i + 1}@student.svvv.edu.in`;
    names.push({ name, email });
  }
  return names;
};

async function createMockStudents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const defaultPassword = await bcrypt.hash('student123', 10);
    let totalCreated = 0;
    let totalSkipped = 0;
    const studentsByClass = {};

    // Get all existing classes
    const classes = await Class.find({ status: 'active' })
      .populate('assignedFaculties.faculty');

    console.log(`📚 Found ${classes.length} active classes\n`);

    // Create students for each department and semester
    for (const dept of departments) {
      for (const semester of semesters) {
        // Find classes for this department and semester
        const matchingClasses = classes.filter(
          cls => cls.department === dept && cls.semester === semester
        );

        if (matchingClasses.length === 0) {
          console.log(`⏭️  No classes found for ${dept} Semester ${semester}, skipping...`);
          continue;
        }

        // Create 20-30 students per semester (distributed across classes)
        const totalStudentsNeeded = 25; // Total students per semester
        const studentsPerClass = Math.ceil(totalStudentsNeeded / matchingClasses.length);
        const studentNames = generateStudentNames(dept, semester, studentsPerClass * matchingClasses.length);

        console.log(`\n📚 Creating students for ${dept} Semester ${semester}...`);
        console.log(`   Found ${matchingClasses.length} class(es), creating ~${studentsPerClass} students per class`);

        let studentIndex = 0;

        for (const classDoc of matchingClasses) {
          const classStudents = [];

          for (let i = 0; i < studentsPerClass && studentIndex < studentNames.length; i++) {
            const studentInfo = studentNames[studentIndex];
            
            try {
              // Check if student already exists
              const existing = await User.findOne({ email: studentInfo.email });
              if (existing) {
                if (existing.role === 'student') {
                  classStudents.push(existing._id);
                  console.log(`   ⏭️  Using existing: ${studentInfo.name}`);
                  totalSkipped++;
                } else {
                  console.log(`   ⏭️  Skipping ${studentInfo.name} - email exists with different role`);
                  totalSkipped++;
                }
                studentIndex++;
                continue;
              }

              // Create new student
              const newStudent = await User.create({
                name: studentInfo.name,
                email: studentInfo.email,
                password: defaultPassword,
                role: 'student',
                department: dept,
                phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                preferences: {
                  language: 'en',
                  theme: 'light'
                }
              });

              classStudents.push(newStudent._id);
              console.log(`   ✅ Created: ${studentInfo.name}`);
              totalCreated++;
              studentIndex++;
            } catch (error) {
              if (error.code === 11000) {
                console.log(`   ⏭️  Skipping ${studentInfo.name} - duplicate email`);
                totalSkipped++;
                studentIndex++;
              } else {
                console.error(`   ❌ Error creating ${studentInfo.name}:`, error.message);
              }
            }
          }

          // Assign students to class
          if (classStudents.length > 0) {
            // Add students to class (avoid duplicates)
            classStudents.forEach(studentId => {
              if (!classDoc.students.some(s => s.equals(studentId))) {
                classDoc.students.push(studentId);
              }
            });
            await classDoc.save();
            studentsByClass[classDoc.name] = classStudents.length;
            console.log(`   📝 Assigned ${classStudents.length} students to ${classDoc.name}`);
          }
        }
      }
    }

    // Also assign existing students to appropriate classes
    console.log(`\n📝 Assigning existing students to classes...`);
    const existingStudents = await User.find({ role: 'student' });
    let existingAssigned = 0;

    for (const student of existingStudents) {
      if (!student.department) continue;

      const matchingClasses = classes.filter(
        cls => cls.department === student.department && cls.status === 'active'
      );

      for (const classDoc of matchingClasses) {
        if (!classDoc.students.some(s => s.equals(student._id))) {
          classDoc.students.push(student._id);
          await classDoc.save();
          existingAssigned++;
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created: ${totalCreated} new students`);
    console.log(`   ⏭️  Skipped: ${totalSkipped} (already exist)`);
    console.log(`   📝 Assigned: ${existingAssigned} existing students to classes`);
    console.log(`\n📚 Students by class:`);
    Object.entries(studentsByClass).forEach(([className, count]) => {
      console.log(`   ${className}: ${count} students`);
    });
    console.log(`\n🎉 Mock student data creation completed!`);
    console.log(`\n📝 Default password for all students: student123`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createMockStudents();

