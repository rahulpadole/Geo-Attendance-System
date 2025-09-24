import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import Layout from '../../components/Layout';

export default function Reports() {
  const [reportData, setReportData] = useState({
    totalEmployees: 0,
    monthlyAttendance: [],
    employeeStats: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substr(0, 7));

  useEffect(() => {
    generateReports();
  }, [selectedMonth]);

  const generateReports = async () => {
    try {
      // Get all employees
      const employeesQuery = query(
        collection(db, 'users'),
        where('role', '==', 'employee'),
        where('isActive', '==', true)
      );
      const employeesSnapshot = await getDocs(employeesQuery);
      const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get attendance for selected month
      const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
      const allAttendance = attendanceSnapshot.docs.map(doc => doc.data());

      const monthAttendance = allAttendance.filter(record => 
        record.date.startsWith(selectedMonth)
      );

      // Calculate employee stats
      const employeeStats = employees.map(employee => {
        const employeeAttendance = monthAttendance.filter(record => 
          record.employeeId === employee.employeeId
        );

        const totalDays = employeeAttendance.length;
        const totalHours = employeeAttendance.reduce((sum, record) => {
          return sum + (parseFloat(record.hoursWorked) || 0);
        }, 0);

        return {
          ...employee,
          totalDays,
          totalHours: totalHours.toFixed(2),
          averageHours: totalDays > 0 ? (totalHours / totalDays).toFixed(2) : '0.00'
        };
      });

      setReportData({
        totalEmployees: employees.length,
        monthlyAttendance: monthAttendance,
        employeeStats
      });
    } catch (error) {
      console.error('Error generating reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const headers = ['Employee ID', 'Name', 'Total Days', 'Total Hours', 'Average Hours/Day'];
    const csvContent = [
      headers.join(','),
      ...reportData.employeeStats.map(emp => [
        emp.employeeId,
        emp.name,
        emp.totalDays,
        emp.totalHours,
        emp.averageHours
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monthly-report-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Reports">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Monthly Reports</h1>
          <button
            onClick={exportReport}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Export Report
          </button>
        </div>

        {/* Month Selector */}
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Month
          </label>
          <input
            type="month"
            className="px-3 py-2 border border-gray-300 rounded-md"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Employees</h3>
            <p className="text-3xl font-bold text-blue-600">{reportData.totalEmployees}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Attendance Days</h3>
            <p className="text-3xl font-bold text-green-600">{reportData.monthlyAttendance.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Average Daily Attendance</h3>
            <p className="text-3xl font-bold text-purple-600">
              {reportData.totalEmployees > 0 
                ? Math.round(reportData.monthlyAttendance.length / reportData.totalEmployees)
                : 0}
            </p>
          </div>
        </div>

        {/* Employee Statistics */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Employee Statistics</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Worked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Hours/Day
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.employeeStats.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {employee.employeeId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.totalDays}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.totalHours}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.averageHours}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {reportData.employeeStats.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No employee data found for selected month
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}