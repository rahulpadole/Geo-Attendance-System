
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';

export default function Dashboard() {
  const { userRole } = useAuth();

  if (userRole === 'admin') {
    return <AdminDashboard />;
  } else {
    return <EmployeeDashboard />;
  }
}
