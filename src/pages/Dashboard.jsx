import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';

export default function Dashboard() {
  const { userRole } = useAuth();

  if (userRole === 'admin') {
    return <AdminDashboard />;
  } else if (userRole === 'employee') {
    return <EmployeeDashboard />;
  }

  return (
    <div className="text-center py-8">
      <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
      <p className="mt-2 text-gray-600">You don't have permission to access this dashboard.</p>
    </div>
  );
}
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';

export default function Dashboard() {
  const { userRole } = useAuth();

  if (userRole === 'admin') {
    return <AdminDashboard />;
  } else if (userRole === 'employee') {
    return <EmployeeDashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600">Invalid user role.</p>
      </div>
    </div>
  );
}
