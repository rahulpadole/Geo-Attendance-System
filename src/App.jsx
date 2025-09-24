import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import all pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ClockIn from './pages/ClockIn';
import ClockOut from './pages/ClockOut';
import AdminSetup from './pages/AdminSetup';

// Admin pages
import AddEmployee from './pages/admin/AddEmployee';
import ManageEmployees from './pages/admin/ManageEmployees';
import OfficeLocation from './pages/admin/OfficeLocation';
import AttendanceRecords from './pages/admin/AttendanceRecords';
import Reports from './pages/admin/Reports';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin-setup" element={<AdminSetup />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            <Route path="/clock-in" element={
              <ProtectedRoute requiredRole="employee">
                <ClockIn />
              </ProtectedRoute>
            } />

            <Route path="/clock-out" element={
              <ProtectedRoute requiredRole="employee">
                <ClockOut />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/add-employee" element={
              <ProtectedRoute requiredRole="admin">
                <AddEmployee />
              </ProtectedRoute>
            } />

            <Route path="/admin/manage-employees" element={
              <ProtectedRoute requiredRole="admin">
                <ManageEmployees />
              </ProtectedRoute>
            } />

            <Route path="/admin/office-location" element={
              <ProtectedRoute requiredRole="admin">
                <OfficeLocation />
              </ProtectedRoute>
            } />

            <Route path="/admin/attendance-records" element={
              <ProtectedRoute requiredRole="admin">
                <AttendanceRecords />
              </ProtectedRoute>
            } />

            <Route path="/admin/reports" element={
              <ProtectedRoute requiredRole="admin">
                <Reports />
              </ProtectedRoute>
            } />

            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;