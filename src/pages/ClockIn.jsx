
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Layout from '../components/Layout';

export default function ClockIn() {
  const { currentUser } = useAuth();
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [alreadyClockedIn, setAlreadyClockedIn] = useState(false);

  useEffect(() => {
    checkTodaysAttendance();
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const checkTodaysAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('employeeId', '==', currentUser.uid),
        where('date', '==', today)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      setAlreadyClockedIn(attendanceSnapshot.size > 0);
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationLoading(false);
          setMessage({ type: 'success', text: 'Location captured successfully!' });
        },
        (error) => {
          setLocationLoading(false);
          setMessage({ type: 'error', text: 'Failed to get location. Please enable location services.' });
        }
      );
    } else {
      setLocationLoading(false);
      setMessage({ type: 'error', text: 'Geolocation is not supported by this browser.' });
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setCameraStream(stream);
      const video = document.getElementById('camera-preview');
      video.srcObject = stream;
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to access camera. Please enable camera permissions.' });
    }
  };

  const capturePhoto = () => {
    const video = document.getElementById('camera-preview');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      setPhoto(blob);
      setMessage({ type: 'success', text: 'Photo captured successfully!' });
      // Stop camera after capturing
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    });
  };

  const handleClockIn = async () => {
    if (!location) {
      setMessage({ type: 'error', text: 'Please capture your location first.' });
      return;
    }

    if (!photo) {
      setMessage({ type: 'error', text: 'Please take a selfie first.' });
      return;
    }

    setLoading(true);
    
    try {
      // Upload photo to Firebase Storage
      const photoRef = ref(storage, `selfies/${currentUser.uid}/${Date.now()}.jpg`);
      await uploadBytes(photoRef, photo);
      const photoURL = await getDownloadURL(photoRef);

      // Save attendance record
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      
      await addDoc(collection(db, 'attendance'), {
        employeeId: currentUser.uid,
        employeeName: currentUser.displayName || currentUser.email,
        date: today,
        clockIn: now.toLocaleTimeString(),
        clockInTimestamp: now.getTime(),
        location: location,
        selfieURL: photoURL,
        createdAt: now
      });

      setMessage({ type: 'success', text: 'Successfully clocked in!' });
      setAlreadyClockedIn(true);
    } catch (error) {
      console.error('Error clocking in:', error);
      setMessage({ type: 'error', text: 'Failed to clock in. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (alreadyClockedIn) {
    return (
      <Layout title="Clock In">
        <div className="max-w-md mx-auto">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Already Clocked In</h3>
            <p className="text-sm text-gray-600 mb-4">
              You have already clocked in for today. You can clock out when you're done with work.
            </p>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Clock In">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Clock In</h2>
            <p className="text-gray-600">Please capture your location and take a selfie to clock in.</p>
          </div>

          {message.text && (
            <div className={`rounded-md p-4 mb-6 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {message.type === 'success' ? (
                    <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {message.text}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Location Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Step 1: Capture Location</h3>
                {location && (
                  <div className="flex items-center text-green-600">
                    <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">Captured</span>
                  </div>
                )}
              </div>
              
              {location ? (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-800">
                    <strong>Latitude:</strong> {location.latitude.toFixed(6)}<br />
                    <strong>Longitude:</strong> {location.longitude.toFixed(6)}
                  </p>
                </div>
              ) : (
                <button
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
                >
                  {locationLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Get Current Location
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Camera Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Step 2: Take Selfie</h3>
                {photo && (
                  <div className="flex items-center text-green-600">
                    <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">Captured</span>
                  </div>
                )}
              </div>

              {!cameraStream && !photo && (
                <button
                  onClick={startCamera}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Start Camera
                </button>
              )}

              {cameraStream && (
                <div className="text-center">
                  <video
                    id="camera-preview"
                    autoPlay
                    muted
                    className="w-full max-w-md mx-auto rounded-lg mb-4"
                  ></video>
                  <button
                    onClick={capturePhoto}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                  >
                    Capture Photo
                  </button>
                </div>
              )}

              {photo && (
                <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                  <svg className="h-8 w-8 text-green-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <p className="text-sm text-green-800 font-medium">Selfie captured successfully!</p>
                </div>
              )}
            </div>

            {/* Clock In Button */}
            <div className="pt-6">
              <button
                onClick={handleClockIn}
                disabled={!location || !photo || loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center text-lg"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
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
                    Clock In
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
