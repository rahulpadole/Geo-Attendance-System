import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Layout from '../../components/Layout';

export default function OfficeLocation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationData, setLocationData] = useState({
    latitude: '',
    longitude: '',
    radius: 100,
    address: ''
  });
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    fetchOfficeLocation();
  }, []);

  const fetchOfficeLocation = async () => {
    try {
      const locationDoc = await getDoc(doc(db, 'settings', 'officeLocation'));
      if (locationDoc.exists()) {
        const data = locationDoc.data();
        setLocationData({
          latitude: data.latitude || '',
          longitude: data.longitude || '',
          radius: data.radius || 100,
          address: data.address || ''
        });
      }
    } catch (error) {
      console.error('Error fetching office location:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocationData(prev => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString()
        }));
        setCurrentLocation({ lat, lng });
        alert('Current location captured successfully!');
      },
      (error) => {
        alert('Unable to get your current location. Please enter coordinates manually.');
        console.error('Geolocation error:', error);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 
      }
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate coordinates
      const lat = parseFloat(locationData.latitude);
      const lng = parseFloat(locationData.longitude);
      const radius = parseInt(locationData.radius);

      if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
        alert('Please enter valid coordinates and radius.');
        return;
      }

      if (lat < -90 || lat > 90) {
        alert('Latitude must be between -90 and 90 degrees.');
        return;
      }

      if (lng < -180 || lng > 180) {
        alert('Longitude must be between -180 and 180 degrees.');
        return;
      }

      if (radius < 10 || radius > 1000) {
        alert('Radius must be between 10 and 1000 meters.');
        return;
      }

      await setDoc(doc(db, 'settings', 'officeLocation'), {
        latitude: lat,
        longitude: lng,
        radius: radius,
        address: locationData.address,
        updatedAt: serverTimestamp()
      });

      alert('Office location updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving office location:', error);
      alert('Failed to save office location. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading office location...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Office Location Settings</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="font-semibold text-blue-900 mb-2">Current Location Helper</h2>
            <p className="text-blue-700 text-sm mb-3">
              Click the button below to automatically capture your current location coordinates.
            </p>
            <button
              type="button"
              onClick={getCurrentLocation}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Use Current Location
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude *
              </label>
              <input
                type="number"
                name="latitude"
                value={locationData.latitude}
                onChange={handleInputChange}
                step="any"
                required
                placeholder="e.g. 28.6139"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude *
              </label>
              <input
                type="number"
                name="longitude"
                value={locationData.longitude}
                onChange={handleInputChange}
                step="any"
                required
                placeholder="e.g. 77.2090"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allowed Radius (meters) *
            </label>
            <input
              type="number"
              name="radius"
              value={locationData.radius}
              onChange={handleInputChange}
              min="10"
              max="1000"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Employees must be within this radius to clock in (10-1000 meters)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Office Address (Optional)
            </label>
            <textarea
              name="address"
              value={locationData.address}
              onChange={handleInputChange}
              rows="3"
              placeholder="Enter the office address for reference"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Important Notes:</h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Employees will only be able to clock in when they are within the specified radius</li>
              <li>• Make sure to test the location settings with employees before finalizing</li>
              <li>• Use a reasonable radius that accounts for building size and GPS accuracy</li>
            </ul>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Location Settings'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}