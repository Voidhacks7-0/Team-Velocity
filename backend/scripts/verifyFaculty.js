require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../model/User');

async function verifyFaculty() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const faculties = await User.find({ role: 'faculty' })
      .select('name email department')
      .sort({ department: 1, name: 1 });

    console.log(`📊 Total Faculties: ${faculties.length}\n`);
    console.log('📚 By Department:\n');

    const byDept = {};
    faculties.forEach(f => {
      const dept = f.department || 'Unknown';
      if (!byDept[dept]) byDept[dept] = [];
      byDept[dept].push(f.name);
    });

    Object.keys(byDept).sort().forEach(dept => {
      console.log(`${dept} (${byDept[dept].length}):`);
      byDept[dept].forEach(name => console.log(`  - ${name}`));
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyFaculty();

