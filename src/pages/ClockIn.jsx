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
        <div className="max-w-lg mx-auto">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-8 shadow-xl">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-yellow-800 mb-4">Already Clocked In</h2>
              <p className="text-yellow-700 mb-6">You have already clocked in for today. Use the Clock Out page to end your work day.</p>
              <button
                onClick={() => navigate('/clock-out')}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg transform transition duration-200 ease-in-out hover:scale-105"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Go to Clock Out
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Clock In to Work</h2>
          <p className="text-gray-600">Complete the steps below to start your workday</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${location ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-gray-400'}`}>
              {location ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-sm font-medium">1</span>
              )}
            </div>
            <div className={`w-12 h-1 rounded-full ${location ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${photo ? 'bg-green-500 border-green-500 text-white' : location ? 'border-blue-500 text-blue-500' : 'border-gray-300 text-gray-400'}`}>
              {photo ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-sm font-medium">2</span>
              )}
            </div>
            <div className={`w-12 h-1 rounded-full ${photo ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${location && photo ? 'border-green-500 text-green-500' : 'border-gray-300 text-gray-400'}`}>
              <span className="text-sm font-medium">3</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Location Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Step 1: Verify Your Location</h3>
              </div>
            </div>
            <div className="p-6">
              {!location ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">We need to verify you're at the office location to clock in.</p>
                  <button
                    onClick={getCurrentLocation}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transform transition duration-200 ease-in-out hover:scale-105"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    Get Current Location
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-green-800 font-medium">Location verified successfully!</p>
                      <p className="text-green-600 text-sm">
                        Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {locationError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 text-sm">{locationError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Camera Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Step 2: Take Your Selfie</h3>
              </div>
            </div>
            <div className="p-6">
              {!stream && !photo && (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Take a selfie to verify your identity for clock-in.</p>
                  <button
                    onClick={startCamera}
                    disabled={!location}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-lg transform transition duration-200 ease-in-out hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    Start Camera
                  </button>
                  {!location && (
                    <p className="text-gray-400 text-sm mt-2">Complete location verification first</p>
                  )}
                </div>
              )}

              {stream && (
                <div className="text-center">
                  <div className="relative inline-block">
                    <video
                      id="video"
                      autoPlay
                      playsInline
                      className="w-64 h-48 object-cover rounded-xl shadow-lg border-4 border-white"
                    />
                    <div className="absolute inset-0 rounded-xl border-2 border-purple-400 pointer-events-none"></div>
                  </div>
                  <button
                    onClick={capturePhoto}
                    className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg transform transition duration-200 ease-in-out hover:scale-105"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    Capture Photo
                  </button>
                </div>
              )}

              {photo && (
                <div className="text-center">
                  <canvas id="canvas" className="w-64 h-48 object-cover rounded-xl shadow-lg mx-auto border-4 border-white" />
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-center">
                      <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-green-800 font-medium">Photo captured successfully!</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPhoto(null);
                      startCamera();
                    }}
                    className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-sm transition duration-200"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retake Photo
                  </button>
                </div>
              )}

              {photoError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 text-sm">{photoError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clock In Button */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Complete Clock In</h3>
              <button
                onClick={handleClockIn}
                disabled={loading || !location || !photo}
                className="w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transform transition duration-200 ease-in-out hover:scale-105 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Clocking In...
                  </>
                ) : (
                  <>
                    <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Clock In to Work
                  </>
                )}
              </button>
              {(!location || !photo) && (
                <p className="text-gray-400 text-sm mt-3">Complete all steps above to clock in</p>
              )}
            </div>
          </div>
        </div>

        <canvas id="hidden-canvas" style={{ display: 'none' }} />
      </div>
    </Layout>
  );
}