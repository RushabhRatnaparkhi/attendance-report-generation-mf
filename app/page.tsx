import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center space-y-8">
      <h1 className="text-3xl font-bold text-blue-700">Attendance Report System</h1>
      <p className="text-gray-600">
        A modern web-based interface integrated with Mainframe backend concepts.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
        <Link
          href="/upload"
          className="border-2 border-blue-500 hover:bg-blue-50 p-6 rounded-xl shadow-sm transition"
        >
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Upload Attendance</h2>
          <p className="text-gray-500 text-sm">
            Upload raw attendance data (CSV or text file) for processing and sorting.
          </p>
        </Link>

        <Link
          href="/report"
          className="border-2 border-green-500 hover:bg-green-50 p-6 rounded-xl shadow-sm transition"
        >
          <h2 className="text-xl font-semibold text-green-600 mb-2">View Reports</h2>
          <p className="text-gray-500 text-sm">
            Generate and view attendance reports after sorting and duplicate removal.
          </p>
        </Link>
      </div>
    </div>
  );
}
