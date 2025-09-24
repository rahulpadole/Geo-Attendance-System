import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Layout from '../components/Layout';

export default function ClockIn() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [step, setStep] = useState('location'); // location, selfie, confirm
  const [isInOffice, setIsInOffice] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selfieData, setSelfieData] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Office location - in real app, this would be fetched from admin settings
  const OFFICE_LOCATION = {
    lat: 28.6139,
    lng: 77.2090,
    radius: 100
  };

  useEffect(() => {
    checkLocation();
    return () => {
      // Cleanup camera stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const checkLocation = () => {
    setLoading(true);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        setUserLocation({ lat: userLat, lng: userLng });
        
        const distance = calculateDistance(
          userLat, userLng, 
          OFFICE_LOCATION.lat, OFFICE_LOCATION.lng
        );
        
        if (distance <= OFFICE_LOCATION.radius) {
          setIsInOffice(true);
          setLocationError('');
        } else {
          setIsInOffice(false);
          setLocationError(`You are ${Math.round(distance)}m away from office. Please come to office premises to clock in.`);
        }
        setLoading(false);
      },
      (error) => {
        setLocationError('Unable to get your location. Please enable location services and try again.');
        setLoading(false);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 
      }
    );
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please allow camera permissions.');
    }
  };

  const takeSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        setSelfieData(blob);
        setStep('confirm');
        
        // Stop camera stream
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const retakeSelfie = () => {
    setSelfieData(null);
    setStep('selfie');
    startCamera();
  };

  const submitClockIn = async () => {
    if (!isInOffice || !selfieData) return;

    setLoading(true);
    
    try {
      // Check if already clocked in today
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', currentUser.uid),
        where('date', '==', today)
      );
      const existingRecords = await getDocs(q);
      
      if (!existingRecords.empty) {
        alert('You have already clocked in today!');
        navigate('/dashboard');
        return;
      }

      // Upload selfie to Firebase Storage
      const selfieRef = ref(storage, `selfies/${currentUser.uid}/${Date.now()}.jpg`);
      await uploadBytes(selfieRef, selfieData);
      const selfieURL = await getDownloadURL(selfieRef);

      // Create attendance record
      const clockInTime = new Date();
      await addDoc(collection(db, 'attendance'), {
        employeeId: currentUser.uid,
        employeeName: currentUser.name,
        date: today,
        clockIn: clockInTime.toTimeString().split(' ')[0],
        clockInTimestamp: clockInTime.toISOString(),
        location: userLocation,
        selfieURL: selfieURL,
        clockOut: null,
        clockOutTimestamp: null,
        hoursWorked: null
      });

      alert('Successfully clocked in!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error clocking in:', error);
      alert('Failed to clock in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const proceedToSelfie = () => {
    if (isInOffice) {
      setStep('selfie');
      startCamera();
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Clock In</h1>
        
        {/* Step 1: Location Verification */}
        {step === 'location' && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-4">Location Verification</h2>
              {loading ? (
                <div className="text-blue-600">
                  <p>Checking your location...</p>
                </div>
              ) : isInOffice ? (
                <div className="text-green-600">
                  <p className="mb-2">✓ You are at the office location</p>
                  <button
                    onClick={proceedToSelfie}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
                  >
                    Continue to Selfie
                  </button>
                </div>
              ) : (
                <div className="text-red-600">
                  <p className="mb-4">{locationError}</p>
                  <button
                    onClick={checkLocation}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                  >
                    Retry Location Check
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Selfie Capture */}
        {step === 'selfie' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center">Take Your Selfie</h2>
            <div className="text-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-sm mx-auto rounded-lg"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="mt-4">
                <button
                  onClick={takeSelfie}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                >
                  Capture Selfie
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center">Confirm Clock In</h2>
            {selfieData && (
              <div className="text-center">
                <img
                  src={URL.createObjectURL(selfieData)}
                  alt="Your selfie"
                  className="w-full max-w-sm mx-auto rounded-lg mb-4"
                />
                <div className="space-x-4">
                  <button
                    onClick={retakeSelfie}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    Retake
                  </button>
                  <button
                    onClick={submitClockIn}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Clocking In...' : 'Clock In'}
                  </button>
                </div>
              </div>
            )}
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