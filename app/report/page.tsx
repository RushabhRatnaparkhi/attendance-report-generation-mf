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
        <h1 className="text-3xl font-bold text-green-700 mb-2">
          {mode === 'attendance' ? 'Attendance Report' : 'Assignment Report'}
        </h1>
        <p className="text-gray-600">
          {mode === 'attendance' 
            ? 'View employee attendance records' 
            : 'Results after duplicate removal and sorting by primary key'}
        </p>
      </div>

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

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
          <p className="text-gray-600 mt-4">Loading report...</p>
        </div>
      ) : (
        <div>
          {records.length > 0 ? (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className={mode === 'attendance' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}>
                    <tr>
                      {mode === 'attendance' ? (
                        <>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Employee ID</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Record ID</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Primary Key</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Full Record</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {records.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {mode === 'attendance' ? (
                          <>
                            <td className="px-4 py-3 text-sm font-mono font-semibold text-blue-600">{rec.EMP_ID}</td>
                            <td className="px-4 py-3 text-sm">{rec.EMP_NAME}</td>
                            <td className="px-4 py-3 text-sm">{rec.ATTENDANCE_DATE?.split('T')[0]}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                rec.STATUS === 'Present' ? 'bg-green-100 text-green-800' :
                                rec.STATUS === 'Absent' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {rec.STATUS}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-sm">{rec.RECORD_ID}</td>
                            <td className="px-4 py-3 text-sm font-mono font-semibold text-blue-600">{rec.PRIMARY_KEY}</td>
                            <td className="px-4 py-3 text-sm font-mono text-gray-600">{rec.COLUMNS_1_12}{rec.PRIMARY_KEY}{rec.COLUMNS_21_80}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
          )}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/upload"
          className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-medium"
        >
          ← Back to Upload
        </Link>
      </div>
    </div>
  );
}
