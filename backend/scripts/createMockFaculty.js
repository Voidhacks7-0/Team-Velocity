// scripts/createMockFaculty.js - Create mock faculty data
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../model/User');

const departments = ['CSE', 'IT', 'AD', 'Civil', 'Mechanical'];
const facultyNames = {
  CSE: [
    { name: 'Dr. Rajesh Kumar', email: 'rajesh.kumar@svvv.edu.in' },
    { name: 'Prof. Priya Sharma', email: 'priya.sharma@svvv.edu.in' },
    { name: 'Dr. Amit Patel', email: 'amit.patel@svvv.edu.in' },
    { name: 'Prof. Sneha Desai', email: 'sneha.desai@svvv.edu.in' },
    { name: 'Dr. Vikram Singh', email: 'vikram.singh@svvv.edu.in' }
  ],
  IT: [
    { name: 'Dr. Anjali Mehta', email: 'anjali.mehta@svvv.edu.in' },
    { name: 'Prof. Ravi Verma', email: 'ravi.verma@svvv.edu.in' },
    { name: 'Dr. Kavita Joshi', email: 'kavita.joshi@svvv.edu.in' },
    { name: 'Prof. Manoj Tiwari', email: 'manoj.tiwari@svvv.edu.in' },
    { name: 'Dr. Sunita Reddy', email: 'sunita.reddy@svvv.edu.in' }
  ],
  AD: [
    { name: 'Dr. Arjun Malhotra', email: 'arjun.malhotra@svvv.edu.in' },
    { name: 'Prof. Divya Nair', email: 'divya.nair@svvv.edu.in' },
    { name: 'Dr. Karan Gupta', email: 'karan.gupta@svvv.edu.in' },
    { name: 'Prof. Meera Iyer', email: 'meera.iyer@svvv.edu.in' },
    { name: 'Dr. Neha Kapoor', email: 'neha.kapoor@svvv.edu.in' }
  ],
  Civil: [
    { name: 'Dr. Suresh Yadav', email: 'suresh.yadav@svvv.edu.in' },
    { name: 'Prof. Anuradha Rao', email: 'anuradha.rao@svvv.edu.in' },
    { name: 'Dr. Pradeep Mishra', email: 'pradeep.mishra@svvv.edu.in' },
    { name: 'Prof. Radha Krishnan', email: 'radha.krishnan@svvv.edu.in' },
    { name: 'Dr. Umesh Pandey', email: 'umesh.pandey@svvv.edu.in' }
  ],
  Mechanical: [
    { name: 'Dr. Harish Choudhary', email: 'harish.choudhary@svvv.edu.in' },
    { name: 'Prof. Indira Menon', email: 'indira.menon@svvv.edu.in' },
    { name: 'Dr. Jitendra Shah', email: 'jitendra.shah@svvv.edu.in' },
    { name: 'Prof. Lakshmi Nair', email: 'lakshmi.nair@svvv.edu.in' },
    { name: 'Dr. Mohan Das', email: 'mohan.das@svvv.edu.in' }
  ]
};

async function createMockFaculty() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const defaultPassword = await bcrypt.hash('faculty123', 10);
    let created = 0;
    let skipped = 0;

    for (const dept of departments) {
      console.log(`\n📚 Creating faculty for ${dept} department...`);
      
      for (const faculty of facultyNames[dept]) {
        try {
          // Check if faculty already exists
          const existing = await User.findOne({ email: faculty.email });
          if (existing) {
            console.log(`⏭️  Skipping ${faculty.name} - already exists`);
            skipped++;
            continue;
          }

          // Create faculty user
          const newFaculty = await User.create({
            name: faculty.name,
            email: faculty.email,
            password: defaultPassword,
            role: 'faculty',
            department: dept,
            phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            preferences: {
              language: 'en',
              theme: 'light'
            }
          });

          console.log(`✅ Created: ${faculty.name} (${dept})`);
          created++;
        } catch (error) {
          if (error.code === 11000) {
            console.log(`⏭️  Skipping ${faculty.name} - duplicate email`);
            skipped++;
          } else {
            console.error(`❌ Error creating ${faculty.name}:`, error.message);
          }
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created: ${created} faculty members`);
    console.log(`   ⏭️  Skipped: ${skipped} (already exist)`);
    console.log(`\n🎉 Mock faculty data creation completed!`);
    console.log(`\n📝 Default password for all faculty: faculty123`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createMockFaculty();

