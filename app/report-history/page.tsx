export default function ReportHistory() {
  const reports = [
    { id: 1, name: "Attendance Report - October 2025", date: "2025-10-31", status: "Completed" },
    { id: 2, name: "Attendance Report - September 2025", date: "2025-09-30", status: "Completed" },
    { id: 3, name: "Assignment Report - Q3 2025", date: "2025-09-15", status: "Completed" },
    { id: 4, name: "Attendance Report - August 2025", date: "2025-08-31", status: "Completed" },
  ];

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center glass-navbar p-10 rounded-lg shadow-lg mb-12">
          <h1 className="text-5xl font-bold text-white shadow-white mb-4">
            Report History
          </h1>
          <p className="text-lg text-white shadow-white">
            View previously generated reports and their statuses.
          </p>
        </div>

        {/* Report List */}
        <div className="glass-strong p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-semibold text-white shadow-white mb-6">
            Generated Reports
          </h2>
          <ul className="space-y-6">
            {reports.map((report) => (
              <li
                key={report.id}
                className="flex justify-between items-center p-6 rounded-lg border border-purple-500 hover:bg-purple-800 transition-all"
              >
                <div>
                  <h3 className="text-xl font-bold text-white shadow-white">
                    {report.name}
                  </h3>
                  <p className="text-sm text-gray-300 shadow-white">
                    Generated on: {report.date}
                  </p>
                </div>
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                    report.status === "Completed"
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {report.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}