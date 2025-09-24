
import React from 'react';
import Layout from '../../components/Layout';

export default function Reports() {
  const downloadCSV = () => {
    alert('CSV download functionality would be implemented here');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Download Reports</h1>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Export Options</h2>
          
          <div className="space-y-4">
            <button
              onClick={downloadCSV}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
            >
              Download Attendance CSV
            </button>
            
            <p className="text-gray-600 text-sm">
              This feature will export all attendance records to a CSV file.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
