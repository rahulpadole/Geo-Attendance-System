
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function EmployeeDashboard() {
  const { userProfile } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);

  useEffect(() => {
    if (userProfile?.employeeId) {
      fetchTodayAttendance();
      fetchRecentAttendance();
    }
  }, [userProfile]);

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('employeeId', '==', userProfile.employeeId),
        where('date', '==', today)
      );

      const snapshot = await getDocs(attendanceQuery);
      if (!snapshot.empty) {
        setTodayAttendance(snapshot.docs[0].data());
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const fetchRecentAttendance = async () => {
    try {
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('employeeId', '==', userProfile.employeeId),
        orderBy('date', 'desc'),
        limit(5)
      );

      const snapshot = await getDocs(attendanceQuery);
      const attendance = snapshot.docs.map(doc => doc.data());
      setRecentAttendance(attendance);
    } catch (error) {
      console.error('Error fetching recent attendance:', error);
    }
  };

  return (
    <Layout title="Employee Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {userProfile?.name}!
          </h2>
          <p className="text-gray-600">Employee ID: {userProfile?.employeeId}</p>
        </div>

        {/* Today's Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Status</h3>
          {todayAttendance ? (
            <div className="space-y-2">
              <p className="text-green-600">
                ✓ Clock In: {todayAttendance.clockIn}
              </p>
              {todayAttendance.clockOut ? (
                <p className="text-blue-600">
                  ✓ Clock Out: {todayAttendance.clockOut}
                </p>
              ) : (
                <p className="text-orange-600">
                  ⚠ Not clocked out yet
                </p>
              )}
              {todayAttendance.hoursWorked && (
                <p className="text-gray-600">
                  Hours Worked: {todayAttendance.hoursWorked}
                </p>
              )}
            </div>
          ) : (
            <p className="text-red-600">No attendance record for today</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/clock-in"
            className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg text-center"
          >
            <h3 className="text-xl font-semibold mb-2">Clock In</h3>
            <p>Start your work day</p>
          </Link>
          
          <Link
            to="/clock-out"
            className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-lg text-center"
          >
            <h3 className="text-xl font-semibold mb-2">Clock Out</h3>
            <p>End your work day</p>
          </Link>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Attendance</h3>
          </div>
          <div className="p-6">
            {recentAttendance.length > 0 ? (
              <div className="space-y-3">
                {recentAttendance.map((record, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">{record.date}</span>
                    <div className="text-sm text-gray-600">
                      In: {record.clockIn} | Out: {record.clockOut || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No attendance records found</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
