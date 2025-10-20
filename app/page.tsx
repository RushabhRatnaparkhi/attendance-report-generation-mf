import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-700 mb-2">
          Mainframe Assignment System
        </h1>
        <p className="text-lg text-gray-600">
          JCL SORT Simulation with DB2 Integration
        </p>
      </div>

      {/* Assignment Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-blue-800 mb-3">
          📋 Assignment #1: PS File Processing
        </h2>
        <div className="text-gray-700 space-y-2">
          <p><strong>Objective:</strong> Process a Physical Sequential (PS) file with 100 records</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Each record: 80 bytes fixed-length</li>
            <li>Primary key: Columns 13-20 (8 bytes)</li>
            <li>Data: 100 records (90 unique + 10 duplicates) in random order</li>
          </ul>
          <p className="mt-3"><strong>Tasks:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>✓ Eliminate duplicate records (SUM FIELDS=NONE)</li>
            <li>✓ Sort by primary key ascending (SORT FIELDS=(13,8,CH,A))</li>
            <li>✓ Store results in DB2 database</li>
          </ul>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/upload"
          className="group border-2 border-blue-500 hover:bg-blue-50 p-8 rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <div className="text-center">
            <div className="text-5xl mb-4">📤</div>
            <h2 className="text-2xl font-semibold text-blue-600 mb-3">
              Upload PS File
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Upload your 80-byte fixed-length PS file for processing
            </p>
            <div className="bg-blue-100 text-blue-800 text-xs font-mono p-3 rounded">
              Simulates: SORT FIELDS=(13,8,CH,A)<br/>
              SUM FIELDS=NONE
            </div>
          </div>
        </Link>

        <Link
          href="/report"
          className="group border-2 border-green-500 hover:bg-green-50 p-8 rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <div className="text-center">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-2xl font-semibold text-green-600 mb-3">
              View Reports
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              View sorted records and job processing statistics
            </p>
            <div className="bg-green-100 text-green-800 text-xs font-mono p-3 rounded">
              Results stored in DB2<br/>
              Sorted by PRIMARY_KEY
            </div>
          </div>
        </Link>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="text-3xl mb-2">🔧</div>
          <h3 className="font-semibold text-gray-800 mb-2">JCL SORT Logic</h3>
          <p className="text-sm text-gray-600">
            Simulates mainframe SORT utility with duplicate elimination
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="text-3xl mb-2">💾</div>
          <h3 className="font-semibold text-gray-800 mb-2">DB2 Integration</h3>
          <p className="text-sm text-gray-600">
            Stores processed records in local DB2 database instance
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="text-3xl mb-2">📈</div>
          <h3 className="font-semibold text-gray-800 mb-2">Job Tracking</h3>
          <p className="text-sm text-gray-600">
            Track processing statistics and return codes like z/OS
          </p>
        </div>
      </div>

      {/* Quick Start */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">
          🚀 Quick Start
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Go to <strong>Upload</strong> page</li>
          <li>Click <strong>"Download Sample"</strong> to get test data</li>
          <li>Upload the sample file to process it</li>
          <li>View results in <strong>Reports</strong> page</li>
        </ol>
      </div>
    </div>
  );
}
