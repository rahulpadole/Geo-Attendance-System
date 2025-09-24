import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import Layout from '../components/Layout';

export default function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0
  });

  useEffect(() => {
    fetchEmployees();
    fetchTodayAttendance();
  }, []);

  const fetchEmployees = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'employee'),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      const employeeList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeeList);
      setStats(prev => ({ ...prev, totalEmployees: employeeList.length }));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchTodayAttendance = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const q = query(
        collection(db, 'attendance'),
        where('date', '==', today)
      );
      const querySnapshot = await getDocs(q);
      const todayRecords = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAttendanceRecords(todayRecords);
      setStats(prev => ({
        ...prev,
        presentToday: todayRecords.length,
        absentToday: prev.totalEmployees - todayRecords.length
      }));
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-500 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Total Employees</h3>
            <p className="text-3xl font-bold">{stats.totalEmployees}</p>
          </div>
          <div className="bg-green-500 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Present Today</h3>
            <p className="text-3xl font-bold">{stats.presentToday}</p>
          </div>
          <div className="bg-red-500 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Absent Today</h3>
            <p className="text-3xl font-bold">{stats.absentToday}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/admin/employees"
            className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg text-center transition-colors"
          >
            <h3 className="font-semibold">Manage Employees</h3>
            <p className="text-sm opacity-90">Add/Remove employees</p>
          </Link>
          
          <Link
            to="/admin/attendance"
            className="bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-lg text-center transition-colors"
          >
            <h3 className="font-semibold">Attendance Records</h3>
            <p className="text-sm opacity-90">View all records</p>
          </Link>
          
          <Link
            to="/admin/location"
            className="bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-lg text-center transition-colors"
          >
            <h3 className="font-semibold">Office Location</h3>
            <p className="text-sm opacity-90">Set office coordinates</p>
          </Link>
          
          <Link
            to="/admin/reports"
            className="bg-teal-500 hover:bg-teal-600 text-white p-4 rounded-lg text-center transition-colors"
          >
            <h3 className="font-semibold">Download Reports</h3>
            <p className="text-sm opacity-90">Export attendance data</p>
          </Link>
        </div>

        {/* Today's Attendance */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Today's Attendance</h2>
          {loading ? (
            <p>Loading...</p>
          ) : attendanceRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Employee</th>
                    <th className="px-4 py-2 text-left">Clock In</th>
                    <th className="px-4 py-2 text-left">Clock Out</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => {
                    const employee = employees.find(emp => emp.id === record.employeeId);
                    return (
                      <tr key={record.id} className="border-t">
                        <td className="px-4 py-2">{employee?.name || 'Unknown'}</td>
                        <td className="px-4 py-2">{formatTime(record.clockIn)}</td>
                        <td className="px-4 py-2">{formatTime(record.clockOut)}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-sm ${
                            record.clockOut 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {record.clockOut ? 'Completed' : 'Working'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No attendance records for today</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
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
