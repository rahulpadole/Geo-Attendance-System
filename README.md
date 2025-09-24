# Employee Attendance System

A comprehensive web application for employee attendance management with geolocation verification and photo capture.

## Features

### Employee Features
- **Secure Login**: Role-based authentication system
- **Geolocation Verification**: Ensures employees are at office location before clocking in
- **Selfie Capture**: Photo verification for attendance
- **Clock In/Out**: Easy time tracking with automatic hours calculation
- **Attendance History**: View personal attendance records
- **Profile Management**: Update personal information

### Admin Features
- **Dashboard Overview**: Real-time attendance statistics
- **Employee Management**: Add, edit, and manage employee accounts
- **Attendance Records**: View all employee attendance data
- **Location Settings**: Configure office location and radius
- **Data Export**: Download attendance reports
- **Profile Management**: Admin account settings

## Technology Stack

- **Frontend**: React.js with React Router
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage (for selfie photos)
- **Geolocation**: Browser Geolocation API
- **Camera**: MediaDevices API

## Setup Instructions

### 1. Firebase Configuration
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication with Email/Password
3. Enable Firestore Database
4. Enable Storage
5. Get your Firebase configuration keys

### 2. Environment Variables
The following environment variables are required:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_PROJECT_ID`

### 3. Create First Admin User
1. Start the application: `npm run dev`
2. Navigate to `/admin-setup` in your browser
3. Fill out the admin registration form with your desired credentials
4. This page will only work if no admin accounts exist in the system

### 4. Application Setup
1. Login as admin
2. Go to Admin Dashboard > Office Location to set your office coordinates
3. Add employees through Admin Dashboard > Manage Employees

## Usage

### For Employees
1. Login with provided credentials
2. Go to Clock In page
3. Allow location and camera permissions
4. System will verify you're at office location
5. Take selfie for verification
6. Click Clock In to start work day
7. Use Clock Out page to end work day

### For Admins
1. Login with admin credentials
2. Access admin dashboard for overview
3. Manage employees through employee management section
4. View and export attendance records
5. Configure office location settings

## Database Schema

### Users Collection
- `uid`: User ID (document ID)
- `email`: User email
- `name`: Full name
- `role`: 'admin' or 'employee'
- `employeeId`: Employee identifier
- `isActive`: Account status
- `createdAt`: Account creation date

### Attendance Collection
- `employeeId`: Reference to user
- `employeeName`: Employee name
- `date`: Attendance date (YYYY-MM-DD)
- `clockIn`: Clock in time
- `clockOut`: Clock out time
- `clockInTimestamp`: Full timestamp
- `clockOutTimestamp`: Full timestamp
- `location`: GPS coordinates
- `selfieURL`: Photo URL in Firebase Storage
- `hoursWorked`: Calculated hours

### Office Settings Collection
- `latitude`: Office latitude
- `longitude`: Office longitude
- `radius`: Allowed radius in meters

## Security Features

- Role-based access control
- Geolocation verification
- Photo verification
- Secure Firebase authentication
- Protected routes

## Browser Requirements

- Modern browser with geolocation support
- Camera access for selfie capture
- JavaScript enabled

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Support

For technical support or questions about the attendance system, contact your system administrator.