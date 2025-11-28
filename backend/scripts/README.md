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

