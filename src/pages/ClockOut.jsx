
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Layout from '../components/Layout';

export default function ClockOut() {
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [alreadyClockedOut, setAlreadyClockedOut] = useState(false);

  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile?.employeeId) {
      checkTodaysAttendance();
    }
  }, [userProfile]);

  const checkTodaysAttendance = async () => {
    if (!currentUser || !userProfile?.employeeId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const attendanceRef = collection(db, 'attendance');
      const todayQuery = query(
        attendanceRef,
        where('employeeId', '==', userProfile?.employeeId),
        where('date', '==', today)
      );

      const snapshot = await getDocs(todayQuery);
      if (!snapshot.empty) {
        const attendance = snapshot.docs[0].data();
        setTodayAttendance({ id: snapshot.docs[0].id, ...attendance });
        
        if (attendance.clockOut) {
          setAlreadyClockedOut(true);
        }
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  };

  const calculateHours = (clockInTimestamp, clockOutTimestamp) => {
    // Use Firebase Timestamp objects for reliable calculation
    const clockInMs = clockInTimestamp?.toMillis ? clockInTimestamp.toMillis() : clockInTimestamp.getTime();
    const clockOutMs = clockOutTimestamp?.toMillis ? clockOutTimestamp.toMillis() : clockOutTimestamp.getTime();
    const diffMs = clockOutMs - clockInMs;
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, diffHours).toFixed(2);
  };

  const handleClockOut = async () => {
    if (!todayAttendance) {
      alert('No clock-in record found for today. Please clock in first.');
      return;
    }

    setLoading(true);

    try {
      const now = new Date();
      const clockOutTime = now.toLocaleTimeString();
      const hoursWorked = calculateHours(todayAttendance.clockInTimestamp, now);

      await updateDoc(doc(db, 'attendance', todayAttendance.id), {
        clockOut: clockOutTime,
        clockOutTimestamp: now,
        hoursWorked: hoursWorked
      });

      alert('Successfully clocked out!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error clocking out:', error);
      alert('Error clocking out: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (alreadyClockedOut) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 shadow-xl">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-blue-800 mb-4">Work Day Completed</h2>
              <p className="text-blue-700 mb-6">You have already clocked out for today.</p>
              
              <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700 font-medium">Clock In:</span>
                    <span className="text-green-800 font-semibold">{todayAttendance?.clockIn}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-red-700 font-medium">Clock Out:</span>
                    <span className="text-red-800 font-semibold">{todayAttendance?.clockOut}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-purple-700 font-medium">Hours Worked:</span>
                    <span className="text-purple-800 font-semibold">{todayAttendance?.hoursWorked}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transform transition duration-200 ease-in-out hover:scale-105"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!todayAttendance) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-8 shadow-xl">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-yellow-800 mb-4">No Clock-In Record</h2>
              <p className="text-yellow-700 mb-6">You haven't clocked in today. Please clock in first before attempting to clock out.</p>
              <button
                onClick={() => navigate('/clock-in')}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg transform transition duration-200 ease-in-out hover:scale-105"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Go to Clock In
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Clock Out</h2>
          <p className="text-gray-600">End your work day and record your hours</p>
        </div>

        {/* Today's Session Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Today's Work Session</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-green-800 font-semibold">Clock In Time</p>
                    <p className="text-green-600 text-sm">When you started work</p>
                  </div>
                </div>
                <span className="text-green-800 font-bold text-lg">{todayAttendance.clockIn}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-blue-800 font-semibold">Current Time</p>
                    <p className="text-blue-600 text-sm">Current time now</p>
                  </div>
                </div>
                <span className="text-blue-800 font-bold text-lg">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clock Out Button */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ready to finish your work day?</h3>
            <button
              onClick={handleClockOut}
              disabled={loading}
              className="w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transform transition duration-200 ease-in-out hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Clocking Out...
                </>
              ) : (
                <>
                  <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Clock Out
                </>
              )}
            </button>
            <p className="text-gray-500 text-sm mt-3">Your work hours will be automatically calculated</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
