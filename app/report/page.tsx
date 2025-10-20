"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ReportPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'attendance' | 'assignment'>(
    (searchParams.get('mode') as 'attendance' | 'assignment') || 'attendance'
  );
  const [records, setRecords] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'records' | 'stats'>('records');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/report?mode=${mode}`);
        const data = await res.json();
        
        if (data.success) {
          setRecords(data.records || []);
          setStatistics(data.statistics || []);
        }
      } catch (err) {
        console.error("Error fetching report:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [mode]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-green-700 mb-3">
          {mode === 'attendance' ? '📊 Attendance Report' : '📋 Assignment Report'}
        </h1>
        <p className="text-lg text-gray-700 mb-2">
          {mode === 'attendance' 
            ? 'Employee attendance records from CSV files' 
            : 'Processed PS file records (JCL SORT simulation)'}
        </p>
        <p className="text-sm text-gray-500 italic">
          {mode === 'attendance' 
            ? 'Shows unique attendance entries after removing duplicate EmpID+Date combinations' 
            : 'Shows records after removing duplicates (columns 13-20) and sorting by primary key'}
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              <strong>JCL SORT Applied:</strong> {mode === 'attendance' 
                ? 'Attendance records are sorted by Employee ID (primary) and Date (secondary) in ascending order. Duplicates with same EmpID+Date are automatically removed using mainframe-style duplicate elimination logic.'
                : 'Assignment records simulate mainframe JCL SORT. Fixed-length 80-byte records are processed: primary key extracted from columns 13-20, duplicates removed, and sorted in ascending order (SORT FIELDS=(13,8,CH,A)).'}
            </p>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setMode('attendance')}
          className={`px-6 py-3 rounded-lg font-medium transition ${
            mode === 'attendance'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          👥 Attendance Mode
        </button>
        <button
          onClick={() => setMode('assignment')}
          className={`px-6 py-3 rounded-lg font-medium transition ${
            mode === 'assignment'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📋 Assignment Mode
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('records')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'records'
              ? 'border-b-2 border-green-600 text-green-700'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {mode === 'attendance' ? 'Attendance Records' : 'Processed Records'} ({records.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'stats'
              ? 'border-b-2 border-blue-600 text-blue-700'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Job History ({statistics.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
          <p className="text-gray-600 mt-4">Loading report...</p>
        </div>
      ) : activeTab === 'records' ? (
        /* Records Table */
        records.length > 0 ? (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              {mode === 'attendance' ? (
                /* Attendance Records Table */
                <table className="min-w-full">
                  <thead className="bg-green-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-base font-semibold">Employee ID</th>
                      <th className="px-6 py-4 text-left text-base font-semibold">Name</th>
                      <th className="px-6 py-4 text-left text-base font-semibold">Date</th>
                      <th className="px-6 py-4 text-left text-base font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-base font-semibold">Check In</th>
                      <th className="px-6 py-4 text-left text-base font-semibold">Check Out</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {records.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-base font-mono font-bold text-black bg-white">
                          {rec.EMP_ID}
                        </td>
                        <td className="px-6 py-4 text-base font-bold text-black bg-white">{rec.EMP_NAME}</td>
                        <td className="px-6 py-4 text-base font-semibold text-black bg-white">{rec.ATTENDANCE_DATE?.split('T')[0]}</td>
                        <td className="px-6 py-4 text-base">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            rec.STATUS === 'Present' ? 'bg-green-100 text-green-800' :
                            rec.STATUS === 'Absent' ? 'bg-red-100 text-red-800' :
                            rec.STATUS === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {rec.STATUS}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-base font-mono font-semibold text-black bg-white">{rec.CHECK_IN_TIME || '-'}</td>
                        <td className="px-6 py-4 text-base font-mono font-semibold text-black bg-white">{rec.CHECK_OUT_TIME || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                /* Assignment Records Table */
                <table className="min-w-full">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-base font-semibold">Record ID</th>
                      <th className="px-6 py-4 text-left text-base font-semibold">Primary Key (Cols 13-20)</th>
                      <th className="px-6 py-4 text-left text-base font-semibold">Columns 1-12</th>
                      <th className="px-6 py-4 text-left text-base font-semibold">Columns 21-80</th>
                      <th className="px-6 py-4 text-left text-base font-semibold">Batch ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {records.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-base font-medium text-black">{rec.RECORD_ID}</td>
                        <td className="px-6 py-4 text-base font-mono font-bold text-black bg-blue-50">
                          {rec.PRIMARY_KEY}
                        </td>
                        <td className="px-6 py-4 text-base font-mono text-black">
                          {rec.COLUMNS_1_12}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-black truncate max-w-xs">
                          {rec.COLUMNS_21_80}
                        </td>
                        <td className="px-6 py-4 text-base font-mono text-black">{rec.UPLOAD_BATCH}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No records found. Upload a file to get started.</p>
            <Link
              href="/upload"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Upload File
            </Link>
          </div>
        )
      ) : (
        /* Statistics Table */
        statistics.length > 0 ? (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-base font-semibold">Batch ID</th>
                    <th className="px-6 py-4 text-left text-base font-semibold">Mode</th>
                    <th className="px-6 py-4 text-left text-base font-semibold">Total Records</th>
                    <th className="px-6 py-4 text-left text-base font-semibold">Duplicates</th>
                    <th className="px-6 py-4 text-left text-base font-semibold">Unique</th>
                    <th className="px-6 py-4 text-left text-base font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-base font-semibold">Return Code</th>
                    <th className="px-6 py-4 text-left text-base font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {statistics.map((stat, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-base font-mono font-bold text-black bg-white">{stat.BATCH_ID}</td>
                      <td className="px-6 py-4 text-base">
                        <span className={`px-3 py-1 rounded text-base font-bold ${
                          stat.MODE === 'attendance' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {stat.MODE}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-base font-bold text-black bg-white">{stat.TOTAL_RECORDS}</td>
                      <td className="px-6 py-4 text-base text-red-600 font-bold bg-white">
                        {stat.DUPLICATES_REMOVED}
                      </td>
                      <td className="px-6 py-4 text-base text-green-600 font-bold bg-white">
                        {stat.UNIQUE_RECORDS}
                      </td>
                      <td className="px-6 py-4 text-base">
                        <span className={`px-3 py-1 rounded text-base font-bold ${
                          stat.JOB_STATUS === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {stat.JOB_STATUS}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-base font-mono">
                        {stat.RETURN_CODE === 0 ? (
                          <span className="text-green-600 font-bold text-lg">CC 0000</span>
                        ) : (
                          <span className="text-red-600 font-bold text-lg">CC {String(stat.RETURN_CODE).padStart(4, '0')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-base font-semibold text-black bg-white">
                        {new Date(stat.UPLOAD_TIMESTAMP).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No job history available yet.</p>
          </div>
        )
      )}
    </div>
  );
}
