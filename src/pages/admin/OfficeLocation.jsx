
import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import Layout from '../../components/Layout';

export default function OfficeLocation() {
  const [location, setLocation] = useState({
    latitude: '',
    longitude: '',
    radius: 100
  });
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    fetchOfficeLocation();
  }, []);

  const fetchOfficeLocation = async () => {
    try {
      const settingsSnapshot = await getDocs(collection(db, 'settings'));
      if (!settingsSnapshot.empty) {
        const settings = settingsSnapshot.docs[0].data();
        setLocation({
          latitude: settings.latitude || '',
          longitude: settings.longitude || '',
          radius: settings.radius || 100
        });
      }
    } catch (error) {
      console.error('Error fetching office location:', error);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocation({
          ...location,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        });
      },
      (error) => {
        alert('Error getting location: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const settingsData = {
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        radius: parseInt(location.radius),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'settings', 'office'), settingsData);
      alert('Office location updated successfully!');
    } catch (error) {
      console.error('Error updating office location:', error);
      alert('Error updating office location: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Office Location Settings">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Office Location Settings</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Office Coordinates
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={location.latitude}
                  onChange={(e) => setLocation({...location, latitude: e.target.value})}
                  placeholder="e.g., 40.7128"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={location.longitude}
                  onChange={(e) => setLocation({...location, longitude: e.target.value})}
                  placeholder="e.g., -74.0060"
                />
              </div>
            </div>
            
            <button
              type="button"
              onClick={getCurrentLocation}
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
            >
              Use Current Location
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Radius (meters)
            </label>
            <input
              type="number"
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={location.radius}
              onChange={(e) => setLocation({...location, radius: e.target.value})}
              placeholder="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Employees must be within this radius to clock in/out
            </p>
          </div>

          {currentLocation && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-medium">Current Location Detected:</p>
              <p className="text-green-700 text-sm">
                Lat: {currentLocation.latitude.toFixed(6)}, 
                Lng: {currentLocation.longitude.toFixed(6)}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
          >
            {loading ? 'Updating...' : 'Update Office Location'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
