
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
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {userProfile?.name}!</h1>
          <p className="text-lg text-gray-600">Employee ID: <span className="font-medium text-gray-800">{userProfile?.employeeId}</span></p>
        </div>

        {/* Today's Status */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-8 py-6 border-b border-blue-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-blue-900">Today's Status</h3>
            </div>
          </div>
          <div className="p-8">
            {todayAttendance ? (
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-green-800 font-semibold">Clock In: {todayAttendance.clockIn}</p>
                    <p className="text-green-600 text-sm">Successfully checked in today</p>
                  </div>
                </div>

                {todayAttendance.clockOut ? (
                  <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-blue-800 font-semibold">Clock Out: {todayAttendance.clockOut}</p>
                      <p className="text-blue-600 text-sm">Work day completed</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <div className="h-10 w-10 bg-orange-500 rounded-full flex items-center justify-center mr-4">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-orange-800 font-semibold">Not clocked out yet</p>
                      <p className="text-orange-600 text-sm">Remember to clock out when you finish work</p>
                    </div>
                  </div>
                )}

                {todayAttendance.hoursWorked && (
                  <div className="flex items-center p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <div className="h-10 w-10 bg-purple-500 rounded-full flex items-center justify-center mr-4">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-purple-800 font-semibold">Hours Worked: {todayAttendance.hoursWorked}</p>
                      <p className="text-purple-600 text-sm">Total work time for today</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-600 font-medium">No attendance record for today</p>
                <p className="text-gray-500 text-sm mt-1">Start your work day by clocking in</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/clock-in"
            className="group bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-8 rounded-2xl text-center shadow-xl transform transition duration-200 ease-in-out hover:scale-105 border border-green-300"
          >
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Clock In</h3>
              <p className="text-green-100">Start your work day</p>
            </div>
          </Link>
          
          <Link
            to="/clock-out"
            className="group bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-8 rounded-2xl text-center shadow-xl transform transition duration-200 ease-in-out hover:scale-105 border border-red-300"
          >
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Clock Out</h3>
              <p className="text-red-100">End your work day</p>
            </div>
          </Link>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h6m-6 4h6m-6 4h6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Recent Attendance</h3>
            </div>
          </div>
          <div className="p-8">
            {recentAttendance.length > 0 ? (
              <div className="space-y-4">
                {recentAttendance.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{record.date}</span>
                        <p className="text-sm text-gray-500">Work day record</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        <span className="text-green-600 font-medium">In: {record.clockIn}</span>
                        {record.clockOut && (
                          <span className="ml-2 text-red-600 font-medium">Out: {record.clockOut}</span>
                        )}
                        {!record.clockOut && (
                          <span className="ml-2 text-orange-600 font-medium">Out: N/A</span>
                        )}
                      </div>
                      {record.hoursWorked && (
                        <p className="text-xs text-purple-600 font-medium">{record.hoursWorked} hours</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h6m-6 4h6m-6 4h6" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No attendance records found</p>
                <p className="text-gray-400 text-sm mt-1">Your recent activity will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
