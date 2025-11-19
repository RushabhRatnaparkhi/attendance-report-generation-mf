"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ReportsPage() {
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

  // Calculate attendance statistics for graph - USE CALCULATED_STATUS
  const getAttendanceStats = () => {
    const stats = {
      Present: 0,
      Absent: 0,
      Late: 0,
      Leave: 0
    };
    
    records.forEach(rec => {
      // Use CALCULATED_STATUS instead of STATUS
      const status = rec.CALCULATED_STATUS || rec.STATUS;
      if (status && stats.hasOwnProperty(status)) {
        stats[status]++;
      }
    });
    
    return stats;
  };

  // Download report as CSV
  const downloadReport = () => {
    if (records.length === 0) {
      alert("No records to download");
      return;
    }

    let csvContent = "";
    let headers = [];
    
    if (mode === 'attendance') {
      headers = ["Employee ID", "Name", "Date", "Original Status", "Calculated Status", "Check In", "Check Out", "Minutes Late"];
      csvContent = headers.join(",") + "\n";
      
      records.forEach(rec => {
        const row = [
          rec.EMP_ID || "",
          rec.EMP_NAME || "",
          rec.ATTENDANCE_DATE?.split('T')[0] || "",
          rec.ORIGINAL_STATUS || rec.STATUS || "",
          rec.CALCULATED_STATUS || rec.STATUS || "",
          rec.CHECK_IN_TIME || "",
          rec.CHECK_OUT_TIME || "",
          rec.MINUTES_LATE || 0
        ];
        csvContent += row.join(",") + "\n";
      });
    } else {
      headers = ["Record ID", "Primary Key (13-20)", "Full Record (80 bytes)", "Processed Date"];
      csvContent = headers.join(",") + "\n";
      
      records.forEach((rec, idx) => {
        const row = [
          rec.RECORD_ID || idx + 1,
          `"${rec.PRIMARY_KEY || rec.RECORD_DATA?.substring(12, 20) || 'N/A'}"`,
          `"${rec.RECORD_DATA || rec.FULL_RECORD || 'N/A'}"`,
          rec.PROCESSED_DATE ? new Date(rec.PROCESSED_DATE).toLocaleString() : 'N/A'
        ];
        csvContent += row.join(",") + "\n";
      });
    }

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${mode}_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const attendanceStats = mode === 'attendance' ? getAttendanceStats() : null;
  const total = attendanceStats ? Object.values(attendanceStats).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold text-white shadow-white">
              {mode === 'attendance' ? 'Attendance Report' : 'Assignment Report'}
            </h1>
          </div>
          {records.length > 0 && activeTab === 'records' && (
            <button
              onClick={downloadReport}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Report
            </button>
          )}
        </div>

        <p className="text-lg text-white shadow-white mb-6">
          {mode === 'attendance'
            ? 'Employee attendance records from CSV files'
            : 'Processed PS file records (JCL SORT simulation)'}
        </p>
        <p className="text-sm text-gray-300 italic mb-6">
          {mode === 'attendance'
            ? 'Shows unique attendance entries after removing duplicate EmpID+Date combinations'
            : 'Shows records after removing duplicates (columns 13-20) and sorting by primary key'}
        </p>

        {/* Info Banner */}
        <div className="glass-strong border-l-4 border-purple-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-purple-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-4 4a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-white shadow-white">
                <strong>JCL SORT Applied:</strong>{' '}
                {mode === 'attendance'
                  ? 'Attendance records are sorted by Employee ID (primary) and Date (secondary) in ascending order. Duplicates with same EmpID+Date are automatically removed using mainframe-style duplicate elimination logic.'
                  : 'Assignment records simulate mainframe JCL SORT. Fixed-length 80-byte records are processed: primary key extracted from columns 13-20, duplicates removed, and sorted in ascending order (SORT FIELDS=(13,8,CH,A)).'}
              </p>
            </div>
          </div>
        </div>

        {/* Attendance Statistics Graph */}
        {mode === 'attendance' && attendanceStats && total > 0 && (
          <div className="glass-strong p-6 rounded-lg shadow-lg mb-6">
            <h2 className="text-2xl font-bold text-white shadow-white mb-4">Attendance Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-600 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-white">{attendanceStats.Present}</div>
                <div className="text-sm text-white">Present</div>
                <div className="text-xs text-white mt-1">
                  {total > 0 ? ((attendanceStats.Present / total) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="bg-red-600 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-white">{attendanceStats.Absent}</div>
                <div className="text-sm text-white">Absent</div>
                <div className="text-xs text-white mt-1">
                  {total > 0 ? ((attendanceStats.Absent / total) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="bg-yellow-600 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-white">{attendanceStats.Late}</div>
                <div className="text-sm text-white">Late</div>
                <div className="text-xs text-white mt-1">
                  {total > 0 ? ((attendanceStats.Late / total) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="bg-blue-600 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-white">{attendanceStats.Leave}</div>
                <div className="text-sm text-white">Leave</div>
                <div className="text-xs text-white mt-1">
                  {total > 0 ? ((attendanceStats.Leave / total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
            {/* Bar Chart */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-white">Present</span>
                  <span className="text-sm text-white">{attendanceStats.Present}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-green-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${total > 0 ? (attendanceStats.Present / total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-white">Absent</span>
                  <span className="text-sm text-white">{attendanceStats.Absent}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-red-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${total > 0 ? (attendanceStats.Absent / total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-white">Late</span>
                  <span className="text-sm text-white">{attendanceStats.Late}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-yellow-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${total > 0 ? (attendanceStats.Late / total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-white">Leave</span>
                  <span className="text-sm text-white">{attendanceStats.Leave}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${total > 0 ? (attendanceStats.Leave / total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mode Selector */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setMode('attendance')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              mode === 'attendance'
                ? 'bg-green-600 text-white'
                : 'glass border border-purple-500 text-white hover:bg-purple-800'
            }`}
          >
            👥 Attendance Mode
          </button>
          <button
            onClick={() => setMode('assignment')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              mode === 'assignment'
                ? 'bg-blue-600 text-white'
                : 'glass border border-purple-500 text-white hover:bg-purple-800'
            }`}
          >
            📋 Assignment Mode
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-purple-500">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'records'
                ? 'border-b-2 border-green-600 text-green-400'
                : 'text-white hover:text-purple-300'
            }`}
          >
            {mode === 'attendance' ? 'Attendance Records' : 'Processed Records'} ({records.length})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'stats'
                ? 'border-b-2 border-blue-600 text-blue-400'
                : 'text-white hover:text-purple-300'
            }`}
          >
            Job History ({statistics.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="text-white mt-4">Loading report...</p>
          </div>
        ) : activeTab === 'records' ? (
          records.length > 0 ? (
            <div className="glass-strong shadow-lg rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className={mode === 'attendance' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}>
                    <tr>
                      {mode === 'attendance' ? (
                        <>
                          <th className="px-6 py-4 text-left text-base font-semibold">Employee ID</th>
                          <th className="px-6 py-4 text-left text-base font-semibold">Name</th>
                          <th className="px-6 py-4 text-left text-base font-semibold">Date</th>
                          <th className="px-6 py-4 text-left text-base font-semibold">Status</th>
                          <th className="px-6 py-4 text-left text-base font-semibold">Check In</th>
                          <th className="px-6 py-4 text-left text-base font-semibold">Check Out</th>
                          <th className="px-6 py-4 text-left text-base font-semibold">Minutes Late</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-4 text-left text-base font-semibold">Record ID</th>
                          <th className="px-6 py-4 text-left text-base font-semibold">Primary Key (13-20)</th>
                          <th className="px-6 py-4 text-left text-base font-semibold">Full Record (80 bytes)</th>
                          <th className="px-6 py-4 text-left text-base font-semibold">Processed Date</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500">
                    {records.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-purple-800">
                        {mode === 'attendance' ? (
                          <>
                            <td className="px-6 py-4 text-base font-mono font-bold text-white">
                              {rec.EMP_ID}
                            </td>
                            <td className="px-6 py-4 text-base font-bold text-white">{rec.EMP_NAME}</td>
                            <td className="px-6 py-4 text-base font-semibold text-white">
                              {rec.ATTENDANCE_DATE?.split('T')[0]}
                            </td>
                            <td className="px-6 py-4 text-base">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-bold ${
                                  (rec.CALCULATED_STATUS || rec.STATUS) === 'Present'
                                    ? 'bg-green-600 text-white'
                                    : (rec.CALCULATED_STATUS || rec.STATUS) === 'Absent'
                                    ? 'bg-red-600 text-white'
                                    : (rec.CALCULATED_STATUS || rec.STATUS) === 'Late'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-gray-600 text-white'
                                }`}
                              >
                                {rec.CALCULATED_STATUS || rec.STATUS}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-base font-mono font-semibold text-white">
                              {rec.CHECK_IN_TIME || '-'}
                            </td>
                            <td className="px-6 py-4 text-base font-mono font-semibold text-white">
                              {rec.CHECK_OUT_TIME || '-'}
                            </td>
                            <td className="px-6 py-4 text-base font-mono font-semibold text-white">
                              {rec.MINUTES_LATE > 0 ? (
                                <span className="text-red-400 font-bold">+{rec.MINUTES_LATE} min</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 text-base font-mono font-bold text-white">
                              {rec.RECORD_ID || idx + 1}
                            </td>
                            <td className="px-6 py-4 text-base font-mono font-bold text-purple-300">
                              {rec.PRIMARY_KEY || rec.RECORD_DATA?.substring(12, 20) || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm font-mono text-white break-all">
                              {rec.RECORD_DATA || rec.FULL_RECORD || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-base font-semibold text-white">
                              {rec.PROCESSED_DATE ? new Date(rec.PROCESSED_DATE).toLocaleString() : 'N/A'}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 glass-strong rounded-lg">
              <p className="text-white mb-4">No records found. Upload a file to get started.</p>
              <Link
                href="/upload"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Upload File
              </Link>
            </div>
          )
        ) : statistics.length > 0 ? (
          <div className="glass-strong shadow-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-base font-semibold">Batch ID</th>
                    <th className="px-6 py-4 text-left text-base font-semibold">Mode</th>
                    <th className="px-6 py-4 text-left textbase font-semibold">Total Records</th>
                    <th className="px-6 py-4 text-left text-base font-semibold">Duplicates</th>
                    <th className="px-6 py-4 text-left text-base font-semibold">Unique</th>
                    <th className="px-6 py-4 text-left text-base font-semibold">Status</th>
                    <th className="px-6 py-4 text-left textbase font-semibold">Return Code</th>
                    <th className="px-6 py-4 text-left textbase font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500">
                  {statistics.map((stat, idx) => (
                    <tr key={idx} className="hover:bg-purple-800">
                      <td className="px-6 py-4 text-base font-mono font-bold text-white">
                        {stat.BATCH_ID}
                      </td>
                      <td className="px-6 py-4 text-base">
                        <span
                          className={`px-3 py-1 rounded text-base font-bold ${
                            stat.MODE === 'attendance'
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {stat.MODE}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-base font-bold text-white">
                        {stat.TOTAL_RECORDS}
                      </td>
                      <td className="px-6 py-4 text-base text-red-400 font-bold">
                        {stat.DUPLICATES_REMOVED}
                      </td>
                      <td className="px-6 py-4 text-base text-green-400 font-bold">
                        {stat.UNIQUE_RECORDS}
                      </td>
                      <td className="px-6 py-4 text-base">
                        <span
                          className={`px-3 py-1 rounded text-base font-bold ${
                            stat.JOB_STATUS === 'COMPLETED'
                              ? 'bg-green-600 text-white'
                              : 'bg-red-600 text-white'
                          }`}
                        >
                          {stat.JOB_STATUS}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-base font-mono">
                        {stat.RETURN_CODE === 0 ? (
                          <span className="text-green-400 font-bold text-lg">CC 0000</span>
                        ) : (
                          <span className="text-red-400 font-bold text-lg">
                            CC {String(stat.RETURN_CODE).padStart(4, '0')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-base font-semibold text-white">
                        {new Date(stat.UPLOAD_TIMESTAMP).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 glass-strong rounded-lg">
            <p className="text-white">No job history available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}