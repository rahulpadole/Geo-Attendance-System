
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { currentUser, userRole, logout } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Employee Attendance System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {currentUser.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
            <p className="text-gray-600 mb-8">Role: {userRole}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {userRole === 'admin' && (
                <>
                  <a
                    href="/admin/employees"
                    className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg shadow-md block"
                  >
                    <h3 className="text-lg font-semibold mb-2">Manage Employees</h3>
                    <p className="text-blue-100">Add and manage employee accounts</p>
                  </a>
                  <a
                    href="/admin/attendance"
                    className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg shadow-md block"
                  >
                    <h3 className="text-lg font-semibold mb-2">Attendance Records</h3>
                    <p className="text-green-100">View all attendance data</p>
                  </a>
                  <a
                    href="/admin/location"
                    className="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-lg shadow-md block"
                  >
                    <h3 className="text-lg font-semibold mb-2">Office Location</h3>
                    <p className="text-purple-100">Configure office settings</p>
                  </a>
                </>
              )}
              
              {userRole === 'employee' && (
                <>
                  <a
                    href="/clock-in"
                    className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg shadow-md block"
                  >
                    <h3 className="text-lg font-semibold mb-2">Clock In</h3>
                    <p className="text-green-100">Start your work day</p>
                  </a>
                  <a
                    href="/clock-out"
                    className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-lg shadow-md block"
                  >
                    <h3 className="text-lg font-semibold mb-2">Clock Out</h3>
                    <p className="text-red-100">End your work day</p>
                  </a>
                  <a
                    href="/profile"
                    className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg shadow-md block"
                  >
                    <h3 className="text-lg font-semibold mb-2">Profile</h3>
                    <p className="text-blue-100">View your information</p>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
