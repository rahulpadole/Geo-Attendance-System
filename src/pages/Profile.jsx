
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function Profile() {
  const { currentUser, userProfile } = useAuth();

  return (
    <Layout title="Profile">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">User Profile</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <p className="mt-1 text-gray-900">{userProfile?.name || 'N/A'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-gray-900">{currentUser?.email || 'N/A'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Employee ID</label>
            <p className="mt-1 text-gray-900">{userProfile?.employeeId || 'N/A'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <p className="mt-1 text-gray-900 capitalize">{userProfile?.role || 'N/A'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Status</label>
            <p className="mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                userProfile?.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {userProfile?.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
