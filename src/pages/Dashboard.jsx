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