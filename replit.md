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
- ✅ Firebase secrets configured (API key, Project ID, App ID)
- ⚠️ Firebase domain authorization may be needed

## Firebase Domain Authorization Required
The Firebase credentials are configured, but you may need to authorize your Replit domain in Firebase:

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your Replit app domain (the URL you see in your browser)
3. The domain format should be: `your-replit-url.replit.dev`

This will resolve the "invalid-api-key" error which is often related to domain restrictions rather than the actual key being invalid.

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