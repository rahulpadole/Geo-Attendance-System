
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Layout from '../components/Layout';

export default function ClockOut() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attendanceRecord, setAttendanceRecord] = useState(null);

  useEffect(() => {
    checkTodayAttendance();
  }, [currentUser]);

  const checkTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', currentUser.uid),
        where('date', '==', today)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const record = querySnapshot.docs[0];
        const data = record.data();
        if (!data.clockOut) {
          setAttendanceRecord({ id: record.id, ...data });
        }
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  };

  const calculateHours = (clockIn, clockOut) => {
    const start = new Date(`1970-01-01T${clockIn}`);
    const end = new Date(`1970-01-01T${clockOut}`);
    const diff = (end - start) / (1000 * 60 * 60);
    return Math.round(diff * 100) / 100;
  };

  const handleClockOut = async (e) => {
    e.preventDefault();
    
    if (!attendanceRecord) {
      setError('No clock-in record found for today.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const now = new Date();
      const clockOutTime = now.toTimeString().split(' ')[0];
      const hoursWorked = calculateHours(attendanceRecord.clockIn, clockOutTime);

      await updateDoc(doc(db, 'attendance', attendanceRecord.id), {
        clockOut: clockOutTime,
        clockOutTimestamp: serverTimestamp(),
        hoursWorked: hoursWorked,
        status: 'completed'
      });

      setSuccess(`Successfully clocked out! Hours worked: ${hoursWorked}`);
      setAttendanceRecord(null);
    } catch (error) {
      setError('Error clocking out. Please try again.');
    }
    
    setLoading(false);
  };

  if (!attendanceRecord) {
    return (
      <Layout>
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Clock Out</h2>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            You need to clock in first before you can clock out.
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Clock Out</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Today's Session</h3>
            <p><strong>Clock In:</strong> {attendanceRecord.clockIn}</p>
            <p><strong>Date:</strong> {attendanceRecord.date}</p>
          </div>

          <form onSubmit={handleClockOut}>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:bg-gray-400"
            >
              {loading ? 'Clocking Out...' : 'Clock Out'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
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
    checkTodaysAttendance();
  }, []);

  const checkTodaysAttendance = async () => {
    if (!currentUser) return;

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

  const calculateHours = (clockIn, clockOut) => {
    const clockInTime = new Date(`1970-01-01 ${clockIn}`);
    const clockOutTime = new Date(`1970-01-01 ${clockOut}`);
    const diffMs = clockOutTime - clockInTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours.toFixed(2);
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
      const hoursWorked = calculateHours(todayAttendance.clockIn, clockOutTime);

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
        <div className="max-w-md mx-auto mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-bold text-blue-800 mb-4">Already Clocked Out</h2>
          <p className="text-blue-700">You have already clocked out for today.</p>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-blue-600">
              Clock In: {todayAttendance?.clockIn}
            </p>
            <p className="text-sm text-blue-600">
              Clock Out: {todayAttendance?.clockOut}
            </p>
            <p className="text-sm text-blue-600">
              Hours Worked: {todayAttendance?.hoursWorked}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Go to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  if (!todayAttendance) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-xl font-bold text-yellow-800 mb-4">No Clock-In Record</h2>
          <p className="text-yellow-700">You haven't clocked in today. Please clock in first.</p>
          <button
            onClick={() => navigate('/clock-in')}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
          >
            Go to Clock In
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Clock Out</h2>

        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Today's Session</h3>
          <p className="text-green-700">
            Clock In: {todayAttendance.clockIn}
          </p>
          <p className="text-green-700">
            Current Time: {new Date().toLocaleTimeString()}
          </p>
        </div>

        <button
          onClick={handleClockOut}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-md font-semibold"
        >
          {loading ? 'Clocking Out...' : 'Clock Out'}
        </button>
      </div>
    </Layout>
  );
}
