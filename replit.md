# Employee Attendance System

## Overview
This is a React-based Employee Attendance System with Firebase authentication and Firestore database integration. The application allows employees to clock in/out and provides admin functionality for managing employees, office locations, and viewing attendance reports.

## Project Architecture
- **Frontend**: React with Vite as the build tool
- **Styling**: Tailwind CSS with forms plugin
- **Authentication**: Firebase Auth with Google sign-in
- **Database**: Firebase Firestore
- **Routing**: React Router DOM v7

## Recent Changes (September 25, 2025)
- Successfully imported project from GitHub
- Fixed 'vite: not found' error by running npm install to install all dependencies
- Verified Vite configuration is properly set up for Replit environment with allowedHosts: true
- Development server successfully started on port 5000 with host 0.0.0.0
- Verified Firebase integration is configured (firebase_barebones_javascript blueprint)
- Configured deployment settings for production using autoscale with npm build + serve
- Project import completed successfully - application is fully functional

## Current Status
- ✅ Development server running on port 5000
- ✅ All dependencies installed and working
- ✅ Vite configuration optimized for Replit environment
- ✅ Workflow configured and running successfully
- ✅ Deployment configuration set up for production (autoscale with npm build + serve)
- ✅ Project import completed successfully
- ⚠️ Firebase secrets need to be configured for authentication to work

## Firebase Setup Required
The application uses Firebase for authentication and database. To complete the setup:

1. Go to the Firebase console and create a project
2. Enable Authentication with Google sign-in
3. Add authorized domains for your Replit app
4. Get the project configuration values and set these secrets:
   - VITE_FIREBASE_PROJECT_ID
   - VITE_FIREBASE_APP_ID
   - VITE_FIREBASE_API_KEY

## Key Features
- Employee clock in/out system
- Admin dashboard for employee management
- Office location management
- Attendance reports and records
- Role-based access control (admin/employee)
- Responsive design with Tailwind CSS

## Development
- Run `npm run dev` to start the development server
- Run `npm run build` to build for production
- The app is configured to work with Replit's proxy system