import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import AdminSetup from './pages/AdminSetup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ClockIn from './pages/ClockIn';
import ClockOut from './pages/ClockOut';

// Admin Pages
import ManageEmployees from './pages/admin/ManageEmployees';
import AddEmployee from './pages/admin/AddEmployee';
import OfficeLocation from './pages/admin/OfficeLocation';
import AttendanceRecords from './pages/admin/AttendanceRecords';
import Reports from './pages/admin/Reports';

// CSS
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            
            {/* Protected Routes */}
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
            
            {/* Employee Routes */}
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
            <Route path="/admin/employees" element={
              <ProtectedRoute requiredRole="admin">
                <ManageEmployees />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/employees/add" element={
              <ProtectedRoute requiredRole="admin">
                <AddEmployee />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/location" element={
              <ProtectedRoute requiredRole="admin">
                <OfficeLocation />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/attendance" element={
              <ProtectedRoute requiredRole="admin">
                <AttendanceRecords />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/reports" element={
              <ProtectedRoute requiredRole="admin">
                <Reports />
              </ProtectedRoute>
            } />
            
            {/* Unauthorized Route */}
            <Route path="/unauthorized" element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                  <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
                  <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
                    Go back to Dashboard
                  </a>
                </div>
              </div>
            } />
            
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
