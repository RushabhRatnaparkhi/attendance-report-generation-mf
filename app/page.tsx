import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-12 p-8 bg-black text-white">
      {/* Header */}
      <div className="text-center glass-navbar p-10 rounded-lg shadow-lg">
        <h1 className="text-5xl font-bold text-white shadow-white mb-4">
          Attendance Report Generation System
        </h1>
        <p className="text-lg text-white shadow-white">
          Using Mainframe JCL SORT Logic with DB2 Integration
        </p>
      </div>

      {/* Assignment Info */}
      <div className="glass-strong border-l-4 border-purple-500 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-white shadow-white mb-4">
          Project: Attendance Report Generation Using JCL SORT
        </h2>
        <div className="text-white shadow-white space-y-4">
          <p><strong>Objective:</strong> Generate employee attendance reports using mainframe-style processing</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Attendance Mode:</strong> Process CSV files with employee attendance data</li>
            <li><strong>Assignment Mode:</strong> Process 80-byte PS files (for mainframe simulation)</li>
          </ul>
          <p className="mt-4"><strong>JCL SORT Implementation:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>✅ Duplicate elimination based on primary key (EmpID + Date)</li>
            <li>✅ Sort by Employee ID ascending (SORT FIELDS=(1,8,CH,A))</li>
            <li>✅ Secondary sort by Date ascending</li>
            <li>✅ Store results in DB2 database</li>
            <li>✅ Job tracking with return codes (like z/OS JCL)</li>
          </ul>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass group border-2 border-purple-500 hover:bg-purple-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
          <div className="text-center">
            <div className="text-5xl mb-4 text-white shadow-white">📤</div>
            <h2 className="text-3xl font-semibold text-white shadow-white mb-4">
              Upload Attendance Data
            </h2>
            <p className="text-white shadow-white text-sm mb-4">
              Upload CSV or PS files for processing with JCL SORT logic
            </p>
          </div>
        </div>

        <div className="glass group border-2 border-purple-500 hover:bg-purple-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
          <div className="text-center">
            <div className="text-5xl mb-4 text-white shadow-white">📊</div>
            <h2 className="text-3xl font-semibold text-white shadow-white mb-4">
              View Attendance Reports
            </h2>
            <p className="text-white shadow-white text-sm mb-4">
              View sorted attendance records and processing statistics
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-strong p-6 rounded-lg shadow-lg border border-purple-500">
          <div className="text-3xl mb-4 text-white shadow-white">🔧</div>
          <h3 className="font-semibold text-white shadow-white mb-4">JCL SORT Logic</h3>
          <p className="text-white shadow-white text-sm">
            Simulates mainframe SORT utility with duplicate elimination
          </p>
        </div>
        
        <div className="glass-strong p-6 rounded-lg shadow-lg border border-purple-500">
          <div className="text-3xl mb-4 text-white shadow-white">💾</div>
          <h3 className="font-semibold text-white shadow-white mb-4">DB2 Integration</h3>
          <p className="text-white shadow-white text-sm">
            Stores processed records in local DB2 database instance
          </p>
        </div>
        
        <div className="glass-strong p-6 rounded-lg shadow-lg border border-purple-500">
          <div className="text-3xl mb-4 text-white shadow-white">📈</div>
          <h3 className="font-semibold text-white shadow-white mb-4">Job Tracking</h3>
          <p className="text-white shadow-white text-sm">
            Track processing statistics and return codes like z/OS
          </p>
        </div>
      </div>

      {/* Quick Start */}
      <div className="glass-strong border border-purple-500 rounded-lg p-8">
        <h3 className="text-3xl font-semibold text-white shadow-white mb-6">
          Quick Start
        </h3>
        <ol className="list-decimal list-inside space-y-4 text-white shadow-white">
          <li>Go to <strong className="text-white shadow-white">Upload</strong> page</li>
          <li>Click <strong className="text-white shadow-white">"Download Sample"</strong> to get test data</li>
          <li>Upload the sample file to process it</li>
          <li>View results in <strong className="text-white shadow-white">Reports</strong> page</li>
        </ol>
      </div>
    </div>
  );
}
