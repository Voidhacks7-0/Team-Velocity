# Scripts

## Create Mock Faculty Data

This script creates 25 faculty members across 5 departments (CSE, IT, AD, Civil, Mechanical) with 5 faculty in each department.

### Usage

```bash
npm run create-faculty
```

Or directly:

```bash
node scripts/createMockFaculty.js
```

### Default Credentials

- **Password for all faculty**: `faculty123`
- **Email format**: `{firstname}.{lastname}@svvv.edu.in`

### Departments

- **CSE**: Computer Science Engineering
- **IT**: Information Technology
- **AD**: Applied Data Science
- **Civil**: Civil Engineering
- **Mechanical**: Mechanical Engineering

### Notes

- The script will skip faculty that already exist (based on email)
- All faculty are created with role `faculty`
- Each faculty gets a random phone number
- Department is set based on the faculty list

---

## Create Mock Students Data

This script creates students for each department and semester, and automatically assigns them to matching classes.

### Usage

```bash
npm run create-students
```

Or directly:

```bash
node scripts/createMockStudents.js
```

### Default Credentials

- **Password for all students**: `student123`
- **Email format**: `{firstname}.{lastname}.{dept}{semester}{number}@student.svvv.edu.in`

### Features

- Creates ~25 students per semester per department
- Automatically assigns students to classes matching their department and semester
- Uses existing students if they already exist
- Assigns existing students to appropriate classes
- Distributes students across multiple classes if multiple classes exist for same dept/semester

### Notes

- Students are created for semesters 1-8
- Students are assigned to classes that match their department and semester
- The script will skip students that already exist (based on email)
- All students are created with role `student`
- Each student gets a random phone number
- Department and semester are set based on the class structure

