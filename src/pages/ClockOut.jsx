
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
