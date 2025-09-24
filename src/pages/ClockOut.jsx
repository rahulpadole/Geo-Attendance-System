import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import Layout from '../components/Layout';

export default function ClockOut() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [canClockOut, setCanClockOut] = useState(false);

  useEffect(() => {
    checkTodayRecord();
  }, []);

  const checkTodayRecord = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', currentUser.uid),
        where('date', '==', today)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const record = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        setTodayRecord(record);
        
        if (record.clockIn && !record.clockOut) {
          setCanClockOut(true);
        }
      }
    } catch (error) {
      console.error('Error checking today record:', error);
    }
  };

  const calculateHours = (clockIn, clockOut) => {
    const clockInTime = new Date(`1970-01-01T${clockIn}`);
    const clockOutTime = new Date(`1970-01-01T${clockOut}`);
    const diffMs = clockOutTime - clockInTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours.toFixed(2);
  };

  const handleClockOut = async () => {
    if (!todayRecord || !canClockOut) return;

    setLoading(true);
    
    try {
      const clockOutTime = new Date();
      const clockOutTimeString = clockOutTime.toTimeString().split(' ')[0];
      const hoursWorked = calculateHours(todayRecord.clockIn, clockOutTimeString);

      await updateDoc(doc(db, 'attendance', todayRecord.id), {
        clockOut: clockOutTimeString,
        clockOutTimestamp: serverTimestamp(),
        hoursWorked: hoursWorked
      });

      alert(`Successfully clocked out! You worked ${hoursWorked} hours today.`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error clocking out:', error);
      alert('Failed to clock out. Please try again.');
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
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Clock Out</h1>
        
        {todayRecord ? (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Today's Record</h2>
              <p><strong>Clock In:</strong> {formatTime(todayRecord.clockIn)}</p>
              {todayRecord.clockOut ? (
                <>
                  <p><strong>Clock Out:</strong> {formatTime(todayRecord.clockOut)}</p>
                  <p><strong>Hours Worked:</strong> {todayRecord.hoursWorked}</p>
                  <div className="mt-4 text-center">
                    <p className="text-green-600 font-semibold">You have already clocked out today!</p>
                  </div>
                </>
              ) : (
                <p className="text-orange-600">Currently working...</p>
              )}
            </div>

            {canClockOut ? (
              <div className="text-center space-y-4">
                <p className="text-gray-600">Ready to end your work day?</p>
                <button
                  onClick={handleClockOut}
                  disabled={loading}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Clocking Out...' : 'Clock Out'}
                </button>
              </div>
            ) : todayRecord.clockOut ? (
              <div className="text-center">
                <p className="text-gray-600">You have completed your work day.</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-red-600">You need to clock in first before you can clock out.</p>
                <button
                  onClick={() => navigate('/clock-in')}
                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                >
                  Go to Clock In
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-gray-600">No attendance record found for today.</p>
            <button
              onClick={() => navigate('/clock-in')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Clock In First
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </Layout>
  );
}
import React from 'react';

const ClockOut = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">Clock Out</h2>
        <p className="text-gray-600 text-center mb-6">
          This feature will calculate your work hours for today.
        </p>
        <div className="text-center">
          <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold">
            Clock Out (Coming Soon)
          </button>
        </div>
        <div className="mt-4 text-center">
          <a href="/dashboard" className="text-blue-500 hover:text-blue-600">
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default ClockOut;
