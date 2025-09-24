import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, addDoc } from 'firebase/firestore';
import Layout from '../components/Layout';

export default function EmployeeDashboard() {
  const { currentUser } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInOffice, setIsInOffice] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [todayStatus, setTodayStatus] = useState(null);

  // Office location (you can make this configurable from admin panel)
  const OFFICE_LOCATION = {
    lat: 28.6139, // Default Delhi coordinates - will be configurable by admin
    lng: 77.2090,
    radius: 100 // 100 meters
  };

  useEffect(() => {
    fetchAttendanceRecords();
    checkTodayStatus();
  }, [currentUser]);

  const fetchAttendanceRecords = async () => {
    try {
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', currentUser.uid),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTodayStatus = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', currentUser.uid),
        where('date', '==', today)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const todayRecord = querySnapshot.docs[0].data();
        setTodayStatus(todayRecord);
      }
    } catch (error) {
      console.error('Error checking today status:', error);
    }
  };

  const checkLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation is not supported by this browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          
          // Calculate distance using Haversine formula
          const distance = calculateDistance(
            userLat, userLng, 
            OFFICE_LOCATION.lat, OFFICE_LOCATION.lng
          );
          
          if (distance <= OFFICE_LOCATION.radius) {
            setIsInOffice(true);
            setLocationError('');
            resolve(true);
          } else {
            setIsInOffice(false);
            setLocationError(`You are ${Math.round(distance)}m away from office. Please come to office premises.`);
            resolve(false);
          }
        },
        (error) => {
          setLocationError('Unable to get your location. Please enable location services.');
          reject(error);
        }
      );
    });
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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
        <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
        
        {/* Today's Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Today's Attendance</h2>
          {todayStatus ? (
            <div className="space-y-2">
              <p className="text-green-600">
                Clock In: {formatTime(todayStatus.clockIn)}
              </p>
              {todayStatus.clockOut ? (
                <p className="text-red-600">
                  Clock Out: {formatTime(todayStatus.clockOut)}
                </p>
              ) : (
                <p className="text-orange-600">Not clocked out yet</p>
              )}
            </div>
          ) : (
            <p className="text-gray-600">No attendance recorded for today</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/clock-in"
            className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg text-center transition-colors"
          >
            <h3 className="text-lg font-semibold">Clock In</h3>
            <p className="text-sm opacity-90">Start your work day</p>
          </Link>
          
          <Link
            to="/clock-out"
            className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-lg text-center transition-colors"
          >
            <h3 className="text-lg font-semibold">Clock Out</h3>
            <p className="text-sm opacity-90">End your work day</p>
          </Link>
        </div>

        {/* Attendance Records */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Your Attendance Records</h2>
          {loading ? (
            <p>Loading...</p>
          ) : attendanceRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Clock In</th>
                    <th className="px-4 py-2 text-left">Clock Out</th>
                    <th className="px-4 py-2 text-left">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record.id} className="border-t">
                      <td className="px-4 py-2">{formatDate(record.date)}</td>
                      <td className="px-4 py-2">{formatTime(record.clockIn)}</td>
                      <td className="px-4 py-2">{formatTime(record.clockOut)}</td>
                      <td className="px-4 py-2">{record.hoursWorked || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No attendance records found</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
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
