
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import Layout from '../components/Layout';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    totalAttendanceRecords: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total employees
      const employeesSnapshot = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'employee'))
      );
      
      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const attendanceSnapshot = await getDocs(
        query(collection(db, 'attendance'), where('date', '==', today))
      );

      // Get total attendance records
      const allAttendanceSnapshot = await getDocs(collection(db, 'attendance'));

      setStats({
        totalEmployees: employeesSnapshot.size,
        presentToday: attendanceSnapshot.size,
        totalAttendanceRecords: allAttendanceSnapshot.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Employees</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalEmployees}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Present Today</h3>
            <p className="text-3xl font-bold text-green-600">{stats.presentToday}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Records</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalAttendanceRecords}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/admin/add-employee"
                className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg text-center"
              >
                Add Employee
              </Link>
              
              <Link
                to="/admin/manage-employees"
                className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg text-center"
              >
                Manage Employees
              </Link>
              
              <Link
                to="/admin/attendance-records"
                className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg text-center"
              >
                View Attendance
              </Link>
              
              <Link
                to="/admin/office-location"
                className="bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-lg text-center"
              >
                Office Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
