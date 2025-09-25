import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import Layout from '../components/Layout';

export default function ClockIn() {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [stream, setStream] = useState(null);
  const streamRef = useRef(null);
  const [officeLocation, setOfficeLocation] = useState(null);
  const [alreadyClockedIn, setAlreadyClockedIn] = useState(false);

  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getOfficeLocation();
    if (userProfile?.employeeId) {
      checkTodaysAttendance();
    }
  }, [userProfile]);

  // Separate effect for stream cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getOfficeLocation = async () => {
    try {
      const settingsRef = collection(db, 'settings');
      const settingsSnapshot = await getDocs(settingsRef);

      if (!settingsSnapshot.empty) {
        const settings = settingsSnapshot.docs[0].data();
        setOfficeLocation({
          latitude: settings.latitude,
          longitude: settings.longitude,
          radius: settings.radius || 100
        });
      }
    } catch (error) {
      console.error('Error fetching office location:', error);
    }
  };

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
        if (attendance.clockIn && !attendance.clockOut) {
          setAlreadyClockedIn(true);
        }
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  };

  const getCurrentLocation = () => {
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        setLocationError('Error getting location: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const startCamera = async () => {
    setPhotoError('');

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      streamRef.current = mediaStream;

      const video = document.getElementById('video');
      if (video) {
        video.srcObject = mediaStream;
      }
    } catch (error) {
      setPhotoError('Error accessing camera: ' + error.message);
    }
  };

  const capturePhoto = () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('hidden-canvas');

    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        setPhoto(blob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          setStream(null);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const handleClockIn = async () => {
    if (!userProfile?.employeeId) {
      alert('User profile not loaded. Please wait and try again.');
      return;
    }

    if (!location) {
      setLocationError('Please get your location first');
      return;
    }

    if (!photo) {
      setPhotoError('Please take a selfie first');
      return;
    }

    if (!officeLocation) {
      alert('Office location not configured. Please contact admin.');
      return;
    }

    // Check if user is within office radius
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      officeLocation.latitude,
      officeLocation.longitude
    );

    if (distance > officeLocation.radius) {
      alert(`You are ${Math.round(distance)}m away from office. You must be within ${officeLocation.radius}m to clock in.`);
      return;
    }

    setLoading(true);

    try {
      // Upload photo to Firebase Storage
      const photoRef = ref(storage, `attendance-photos/${currentUser.uid}/${Date.now()}.jpg`);
      await uploadBytes(photoRef, photo);
      const photoURL = await getDownloadURL(photoRef);

      // Create attendance record
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const attendanceData = {
        employeeId: userProfile.employeeId,
        employeeName: userProfile.name,
        date: today,
        clockIn: now.toLocaleTimeString(),
        clockInTimestamp: now,
        location: location,
        selfieURL: photoURL,
        hoursWorked: null
      };

      await setDoc(doc(db, 'attendance', `${userProfile.employeeId}_${today}`), attendanceData);

      alert('Successfully clocked in!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error clocking in:', error);
      alert('Error clocking in: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (alreadyClockedIn) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-xl font-bold text-yellow-800 mb-4">Already Clocked In</h2>
          <p className="text-yellow-700">You have already clocked in for today. Use the Clock Out page to end your work day.</p>
          <button
            onClick={() => navigate('/clock-out')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Go to Clock Out
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Clock In</h2>

        {/* Location Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">1. Verify Location</h3>
          {!location ? (
            <button
              onClick={getCurrentLocation}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Get Current Location
            </button>
          ) : (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">✓ Location verified</p>
              <p className="text-sm text-green-600">
                Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
              </p>
            </div>
          )}
          {locationError && (
            <p className="text-red-600 text-sm mt-2">{locationError}</p>
          )}
        </div>

        {/* Camera Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">2. Take Selfie</h3>
          {!stream && !photo && (
            <button
              onClick={startCamera}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
            >
              Start Camera
            </button>
          )}

          {stream && (
            <div className="text-center">
              <video
                id="video"
                autoPlay
                playsInline
                className="w-full max-w-xs mx-auto rounded-md"
              />
              <button
                onClick={capturePhoto}
                className="mt-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md"
              >
                Capture Photo
              </button>
            </div>
          )}

          {photo && (
            <div className="text-center">
              <canvas id="canvas" className="w-full max-w-xs mx-auto rounded-md" />
              <p className="text-green-600 mt-2">✓ Photo captured</p>
              <button
                onClick={() => {
                  setPhoto(null);
                  startCamera();
                }}
                className="mt-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm"
              >
                Retake Photo
              </button>
            </div>
          )}

          {photoError && (
            <p className="text-red-600 text-sm mt-2">{photoError}</p>
          )}
        </div>

        {/* Clock In Button */}
        <button
          onClick={handleClockIn}
          disabled={loading || !location || !photo}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-md font-semibold"
        >
          {loading ? 'Clocking In...' : 'Clock In'}
        </button>

        <canvas id="hidden-canvas" style={{ display: 'none' }} />
      </div>
    </Layout>
  );
}