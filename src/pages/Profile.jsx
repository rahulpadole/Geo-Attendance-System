
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function Profile() {
  const { currentUser, userRole, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Profile</h2>
        
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-2">Account Information</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{currentUser?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="text-gray-900 capitalize">{userRole}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <p className="text-gray-900 text-sm font-mono">{currentUser?.uid}</p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleLogout}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
            >
              {loading ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
