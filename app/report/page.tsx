"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface AttendanceRecord {
  EMP_ID: string;
  EMP_NAME: string;
  ATTENDANCE_DATE: string;
  STATUS: string;
  CHECK_IN_TIME: string | null;
  CHECK_OUT_TIME: string | null;
  CALCULATED_STATUS: string;
  IS_LATE: boolean;
  MINUTES_LATE: number;
  ORIGINAL_STATUS: string;
}

interface AssignmentRecord {
  PRIMARY_KEY: string;
  RECORD_DATA: string;
  PROCESSED_DATE: string;
}

interface Statistics {
  BATCH_ID: string;
  MODE: string;
  TOTAL_RECORDS: number;
  DUPLICATES_REMOVED: number;
  UNIQUE_RECORDS: number;
  PRESENT_COUNT?: number;
  LATE_COUNT?: number;
  ABSENT_COUNT?: number;
  JOB_STATUS: string;
  RETURN_CODE: number;
  UPLOAD_TIMESTAMP: string;
}

export default function ReportPage() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as "attendance" | "assignment") || "attendance";
  
  const [mode, setMode] = useState<"attendance" | "assignment">(initialMode);
  const [records, setRecords] = useState<AttendanceRecord[] | AssignmentRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[] | AssignmentRecord[]>([]);
  const [statistics, setStatistics] = useState<Statistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [mode]);

  useEffect(() => {
    // Apply filter when selectedStatus changes
    if (mode === 'attendance' && selectedStatus) {
      const attendanceRecords = records as AttendanceRecord[];
      
      if (selectedStatus === 'Present') {
        setFilteredRecords(attendanceRecords.filter(r => 
          r.CALCULATED_STATUS === 'Present' && !r.IS_LATE
        ));
      } else if (selectedStatus === 'Late') {
        setFilteredRecords(attendanceRecords.filter(r => 
          r.CALCULATED_STATUS === 'Late' || r.IS_LATE
        ));
      } else if (selectedStatus === 'Absent') {
        setFilteredRecords(attendanceRecords.filter(r => 
          r.CALCULATED_STATUS === 'Absent' || r.STATUS === 'Absent'
        ));
      } else if (selectedStatus === 'Leave') {
        setFilteredRecords(attendanceRecords.filter(r => 
          r.STATUS === 'Leave'
        ));
      }
    } else {
      // Show all records
      setFilteredRecords(records);
    }
  }, [selectedStatus, records, mode]);

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    setSelectedStatus(null); // Reset filter when changing mode
    
    try {
      const res = await fetch(`/api/report?mode=${mode}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch report");
      }

      // ✅ Sort records on client-side (backup sorting)
      let sortedRecords = data.records || [];
      
      if (mode === 'attendance' && sortedRecords.length > 0) {
        sortedRecords = sortedRecords.sort((a: AttendanceRecord, b: AttendanceRecord) => {
          // Primary sort: Employee ID (ascending)
          if (a.EMP_ID !== b.EMP_ID) {
            return a.EMP_ID.localeCompare(b.EMP_ID);
          }
          // Secondary sort: Date (ascending)
          return a.ATTENDANCE_DATE.localeCompare(b.ATTENDANCE_DATE);
        });
      }

      setRecords(sortedRecords);
      setFilteredRecords(sortedRecords);
      setStatistics(data.statistics || []);
    } catch (err: any) {
      console.error("Report fetch error:", err);
      setError(err.message || "Failed to load report");
      setRecords([]);
      setFilteredRecords([]);
      setStatistics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status: string) => {
    if (selectedStatus === status) {
      // Toggle off if clicking the same status
      setSelectedStatus(null);
    } else {
      setSelectedStatus(status);
    }
  };

  const calculateStats = () => {
    if (mode !== 'attendance' || records.length === 0) return null;
    
    const attendanceRecords = records as AttendanceRecord[];
    
    const present = attendanceRecords.filter(r => 
      r.CALCULATED_STATUS === 'Present' && !r.IS_LATE
    ).length;
    
    const late = attendanceRecords.filter(r => 
      r.CALCULATED_STATUS === 'Late' || r.IS_LATE
    ).length;
    
    const absent = attendanceRecords.filter(r => 
      r.CALCULATED_STATUS === 'Absent' || r.STATUS === 'Absent'
    ).length;
    
    const leave = attendanceRecords.filter(r => 
      r.STATUS === 'Leave'
    ).length;

    return { present, late, absent, leave, total: attendanceRecords.length };
  };

  const stats = calculateStats();

  // Pie chart data with 3D effect
  const pieChartData = stats ? {
    labels: ['Present', 'Late', 'Absent', 'Leave'],
    datasets: [
      {
        label: 'Attendance',
        data: [stats.present, stats.late, stats.absent, stats.leave],
        backgroundColor: [
          'rgba(34, 197, 94, 0.9)',   // Green for Present
          'rgba(234, 179, 8, 0.9)',   // Yellow for Late
          'rgba(239, 68, 68, 0.9)',   // Red for Absent
          'rgba(59, 130, 246, 0.9)',  // Blue for Leave
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
        ],
        borderWidth: 3,
        // 3D effect with shadows
        hoverOffset: 15,
        offset: [8, 8, 8, 8], // Creates 3D separation
      },
    ],
  } : null;

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'white',
          font: {
            size: 16,
            weight: 'bold' as const,
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 2,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} employees (${percentage}%)`;
          }
        }
      },
      // ✅ DATA LABELS - Shows numbers on the chart
      datalabels: {
        color: 'white',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        formatter: (value: number, context: any) => {
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          // Show count and percentage
          return `${value}\n(${percentage}%)`;
        },
        anchor: 'center' as const,
        align: 'center' as const,
        offset: 0,
        // Add shadow for better readability
        textStrokeColor: 'rgba(0, 0, 0, 0.8)',
        textStrokeWidth: 3,
      }
    },
    // 3D effect with animation
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  // Download report as CSV
  const downloadReport = () => {
    if (mode === 'attendance') {
      const attendanceRecords = filteredRecords as AttendanceRecord[];
      
      let csvContent = 'Employee ID,Employee Name,Date,Check In,Check Out,Status,Late By (min)\n';
      
      attendanceRecords.forEach(record => {
        const lateMinutes = record.IS_LATE && record.MINUTES_LATE > 0 ? record.MINUTES_LATE : '-';
        csvContent += `${record.EMP_ID},${record.EMP_NAME},${record.ATTENDANCE_DATE},${record.CHECK_IN_TIME || '-'},${record.CHECK_OUT_TIME || '-'},${record.CALCULATED_STATUS},${lateMinutes}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      const assignmentRecords = filteredRecords as AssignmentRecord[];
      
      let txtContent = 'ASSIGNMENT REPORT\n';
      txtContent += '='.repeat(80) + '\n\n';
      
      assignmentRecords.forEach((record, index) => {
        txtContent += `Record ${index + 1}\n`;
        txtContent += `Primary Key: ${record.PRIMARY_KEY}\n`;
        txtContent += `Data: ${record.RECORD_DATA}\n`;
        txtContent += '-'.repeat(80) + '\n';
      });

      const blob = new Blob([txtContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assignment-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold text-white">📊 View Reports</h1>
          <div className="flex gap-4">
            {/* Download Report Button */}
            {!loading && !error && filteredRecords.length > 0 && (
              <button
                onClick={downloadReport}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Report
              </button>
            )}
            <Link
              href="/upload"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              📤 Upload New File
            </Link>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="glass-strong p-6 rounded-lg mb-6">
          <label className="block text-lg font-semibold mb-4 text-white">
            Select Report Type:
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setMode("attendance")}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                mode === "attendance"
                  ? "bg-green-600 text-white"
                  : "glass border border-purple-500 text-white hover:bg-purple-800"
              }`}
            >
              👥 Attendance Report
            </button>
            <button
              onClick={() => setMode("assignment")}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                mode === "assignment"
                  ? "bg-blue-600 text-white"
                  : "glass border border-purple-500 text-white hover:bg-purple-800"
              }`}
            >
              📋 Assignment Report
            </button>
          </div>
        </div>

        {/* Statistics Cards - Attendance Mode Only */}
        {mode === "attendance" && stats && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {/* Total */}
              <div className="glass-strong p-6 rounded-lg border-2 border-purple-500">
                <div className="text-4xl font-bold text-white mb-2">{stats.total}</div>
                <div className="text-sm text-gray-300">Total Records</div>
              </div>

              {/* Present - Clickable */}
              <button
                onClick={() => handleStatusFilter('Present')}
                className={`glass-strong p-6 rounded-lg border-2 transition-all ${
                  selectedStatus === 'Present' 
                    ? 'border-green-500 bg-green-900/30 scale-105' 
                    : 'border-green-500 hover:bg-green-900/20 hover:scale-105'
                }`}
              >
                <div className="text-4xl font-bold text-green-400 mb-2">{stats.present}</div>
                <div className="text-sm text-gray-300">
                  {selectedStatus === 'Present' ? '✓ Present' : 'Present'}
                </div>
              </button>

              {/* Late - Clickable */}
              <button
                onClick={() => handleStatusFilter('Late')}
                className={`glass-strong p-6 rounded-lg border-2 transition-all ${
                  selectedStatus === 'Late' 
                    ? 'border-yellow-500 bg-yellow-900/30 scale-105' 
                    : 'border-yellow-500 hover:bg-yellow-900/20 hover:scale-105'
                }`}
              >
                <div className="text-4xl font-bold text-yellow-400 mb-2">{stats.late}</div>
                <div className="text-sm text-gray-300">
                  {selectedStatus === 'Late' ? '✓ Late' : 'Late'}
                </div>
              </button>

              {/* Absent - Clickable */}
              <button
                onClick={() => handleStatusFilter('Absent')}
                className={`glass-strong p-6 rounded-lg border-2 transition-all ${
                  selectedStatus === 'Absent' 
                    ? 'border-red-500 bg-red-900/30 scale-105' 
                    : 'border-red-500 hover:bg-red-900/20 hover:scale-105'
                }`}
              >
                <div className="text-4xl font-bold text-red-400 mb-2">{stats.absent}</div>
                <div className="text-sm text-gray-300">
                  {selectedStatus === 'Absent' ? '✓ Absent' : 'Absent'}
                </div>
              </button>

              {/* Leave - Clickable */}
              <button
                onClick={() => handleStatusFilter('Leave')}
                className={`glass-strong p-6 rounded-lg border-2 transition-all ${
                  selectedStatus === 'Leave' 
                    ? 'border-blue-500 bg-blue-900/30 scale-105' 
                    : 'border-blue-500 hover:bg-blue-900/20 hover:scale-105'
                }`}
              >
                <div className="text-4xl font-bold text-blue-400 mb-2">{stats.leave}</div>
                <div className="text-sm text-gray-300">
                  {selectedStatus === 'Leave' ? '✓ Leave' : 'Leave'}
                </div>
              </button>
            </div>

            {/* 3D Pie Chart - Larger Size */}
            <div className="glass-strong p-10 rounded-lg border-2 border-purple-500 mb-6">
              <h3 className="text-3xl font-bold text-white mb-8 text-center">📊 Attendance Distribution</h3>
              <div className="max-w-2xl mx-auto h-[500px]">
                {pieChartData && <Pie data={pieChartData} options={pieChartOptions} />}
              </div>
            </div>
          </>
        )}

        {/* Active Filter Badge */}
        {selectedStatus && (
          <div className="mb-4 flex items-center gap-3">
            <div className="glass-strong px-4 py-2 rounded-lg border border-purple-500 flex items-center gap-2">
              <span className="text-white">Filtering by:</span>
              <span className="font-bold text-purple-400">{selectedStatus}</span>
              <span className="text-gray-400">({filteredRecords.length} records)</span>
            </div>
            <button
              onClick={() => setSelectedStatus(null)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              ✕ Clear Filter
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="glass-strong p-12 rounded-lg text-center">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-12 w-12 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-xl text-white">Loading report data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="glass-strong p-6 rounded-lg border-2 border-red-500">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-red-400 mb-1">Error Loading Report</h3>
                <p className="text-white">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && filteredRecords.length === 0 && (
          <div className="glass-strong p-12 rounded-lg text-center border-2 border-purple-500">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {selectedStatus ? `No ${selectedStatus} Records Found` : 'No Data Available'}
            </h3>
            <p className="text-gray-300 mb-6">
              {selectedStatus 
                ? `There are no employees with "${selectedStatus}" status in the current data.`
                : `Upload a ${mode} file to see the report here.`
              }
            </p>
            {selectedStatus ? (
              <button
                onClick={() => setSelectedStatus(null)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                Show All Records
              </button>
            ) : (
              <Link
                href="/upload"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                📤 Upload File
              </Link>
            )}
          </div>
        )}

        {/* Attendance Report Table */}
        {!loading && !error && mode === "attendance" && filteredRecords.length > 0 && (
          <div className="glass-strong rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Employee ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Employee Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Check In</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Check Out</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Late By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-800/30">
                  {(filteredRecords as AttendanceRecord[]).map((record, index) => (
                    <tr key={index} className="hover:bg-purple-900/20 transition">
                      <td className="px-6 py-4 text-white font-mono">{record.EMP_ID}</td>
                      <td className="px-6 py-4 text-white">{record.EMP_NAME}</td>
                      <td className="px-6 py-4 text-white">{record.ATTENDANCE_DATE}</td>
                      <td className="px-6 py-4 text-white font-mono">
                        {record.CHECK_IN_TIME || "-"}
                      </td>
                      <td className="px-6 py-4 text-white font-mono">
                        {record.CHECK_OUT_TIME || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            record.CALCULATED_STATUS === "Present" && !record.IS_LATE
                              ? "bg-green-900/50 text-green-300 border border-green-500"
                              : record.CALCULATED_STATUS === "Late" || record.IS_LATE
                              ? "bg-yellow-900/50 text-yellow-300 border border-yellow-500"
                              : record.STATUS === "Leave"
                              ? "bg-blue-900/50 text-blue-300 border border-blue-500"
                              : "bg-red-900/50 text-red-300 border border-red-500"
                          }`}
                        >
                          {record.CALCULATED_STATUS === "Late" || record.IS_LATE
                            ? "Late"
                            : record.STATUS === "Leave"
                            ? "Leave"
                            : record.CALCULATED_STATUS || record.STATUS}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">
                        {record.IS_LATE && record.MINUTES_LATE > 0
                          ? `${record.MINUTES_LATE} min`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assignment Report Table */}
        {!loading && !error && mode === "assignment" && filteredRecords.length > 0 && (
          <div className="glass-strong rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">#</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Primary Key</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Record Data (80 bytes)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-800/30">
                  {(filteredRecords as AssignmentRecord[]).map((record, index) => (
                    <tr key={index} className="hover:bg-purple-900/20 transition">
                      <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                      <td className="px-6 py-4 text-white font-mono font-bold">{record.PRIMARY_KEY}</td>
                      <td className="px-6 py-4 text-white font-mono text-sm break-all">
                        {record.RECORD_DATA}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload Statistics */}
        {statistics.length > 0 && (
          <div className="glass-strong p-6 rounded-lg mt-6">
            <h2 className="text-2xl font-bold text-white mb-4">📈 Upload History</h2>
            <div className="space-y-4">
              {statistics.slice(0, 5).map((stat, index) => (
                <div key={index} className="glass p-4 rounded-lg border border-purple-500">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-mono text-sm text-gray-300">{stat.BATCH_ID}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(stat.UPLOAD_TIMESTAMP).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      stat.JOB_STATUS === 'COMPLETED' 
                        ? 'bg-green-900/50 text-green-300' 
                        : 'bg-red-900/50 text-red-300'
                    }`}>
                      {stat.JOB_STATUS}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Total:</span>
                      <span className="text-white font-bold ml-2">{stat.TOTAL_RECORDS}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Unique:</span>
                      <span className="text-white font-bold ml-2">{stat.UNIQUE_RECORDS}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Duplicates:</span>
                      <span className="text-white font-bold ml-2">{stat.DUPLICATES_REMOVED}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}