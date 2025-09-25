
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';

export default function Dashboard() {
  const { userRole, userProfile, currentUser } = useAuth();

  // Show loading state while user and profile are being determined
  if (!currentUser || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (userRole === 'admin') {
    return <AdminDashboard />;
  } else if (userRole === 'employee') {
    return <EmployeeDashboard />;
  } else {
    // Handle unknown role
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">Your account role is not recognized. Please contact an administrator.</p>
        </div>
      </div>
    );
  }
}
