"use client";
import { useState } from "react";
import Link from "next/link";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'attendance' | 'assignment'>('attendance');
  const [status, setStatus] = useState("");
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setStatus(`⏳ Processing file in ${mode} mode...`);
    setJobDetails(null);
    setStatistics(null);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setStatus(data.success ? "✅ Processing complete! Job finished successfully." : "❌ Job failed.");
      setJobDetails(data.jobDetails);
      setStatistics(data.statistics);
    } catch (err: any) {
      console.error(err);
      setStatus("❌ Error: " + err.message);
    }
  };

  const downloadSample = async () => {
    try {
      const res = await fetch(`/api/generate-sample?mode=${mode}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mode === 'attendance' ? 'sample-attendance.csv' : 'sample-ps-file.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading sample:", err);
      alert("Failed to download sample file");
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-2 text-center">
        Upload File for Processing
      </h1>
      <p className="text-center text-gray-600 mb-8">
        Choose between Attendance or Assignment mode
      </p>

      {/* Mode Selector */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Processing Mode
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMode('attendance')}
            className={`p-4 rounded-lg border-2 transition ${
              mode === 'attendance'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-300 hover:border-green-300'
            }`}
          >
            <div className="text-3xl mb-2">👥</div>
            <div className="font-semibold text-gray-800">Attendance Mode</div>
            <div className="text-xs text-gray-600 mt-1">
              Upload CSV with employee attendance
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => setMode('assignment')}
            className={`p-4 rounded-lg border-2 transition ${
              mode === 'assignment'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300'
            }`}
          >
            <div className="text-3xl mb-2">📋</div>
            <div className="font-semibold text-gray-800">Assignment Mode</div>
            <div className="text-xs text-gray-600 mt-1">
              Process PS files (80-byte records)
            </div>
          </button>
        </div>
      </div>

      {/* Sample Data Download */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm text-yellow-700">
              <strong>Need test data?</strong> Download a sample {mode === 'attendance' ? 'CSV' : 'PS'} file for testing
            </p>
          </div>
          <button
            onClick={downloadSample}
            className="ml-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Download Sample
          </button>
        </div>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="space-y-6 bg-white shadow-lg rounded-lg p-6 border">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {mode === 'attendance' ? 'Select CSV File' : 'Select PS File (80-byte fixed-length records)'}
          </label>
          <input
            type="file"
            accept={mode === 'attendance' ? '.csv,.txt' : '.txt,.ps'}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border border-gray-300 p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {mode === 'attendance' 
              ? 'Expected format: EmpID,Name,Date,Status or EmpID,Name,Date,Status,CheckIn,CheckOut' 
              : 'Expected format: 80 bytes per line, primary key in columns 13-20'}
          </p>
        </div>
        
        <button
          type="submit"
          disabled={!file}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {file ? `Process File (${mode === 'attendance' ? 'Attendance' : 'JCL SORT'})` : "Select a file first"}
        </button>
      </form>

      {/* Status */}
      {status && (
        <div className={`mt-6 p-4 rounded-lg ${status.includes('✅') ? 'bg-green-50 text-green-800' : status.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
          <p className="font-medium">{status}</p>
        </div>
      )}

      {/* Job Details */}
      {jobDetails && (
        <div className="mt-6 bg-gray-800 text-green-400 p-6 rounded-lg font-mono text-sm">
          <h2 className="text-lg font-bold mb-4 text-white">═══ Job Output ═══</h2>
          <div className="space-y-1">
            <p>Job Name: {jobDetails.jobname}</p>
            <p>Job ID:   {jobDetails.jobid}</p>
            <p>Status:   {jobDetails.status}</p>
            <p>Return Code: {jobDetails.returnCode === 0 ? 'CC 0000 (Success)' : `CC ${String(jobDetails.returnCode).padStart(4, '0')} (Error)`}</p>
          </div>
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div className="mt-6 bg-white shadow-lg rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Processing Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.totalRecords}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Duplicates Removed</p>
              <p className="text-2xl font-bold text-red-600">{statistics.duplicatesRemoved}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Unique Records</p>
              <p className="text-2xl font-bold text-green-600">{statistics.uniqueRecords}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Inserted to DB2</p>
              <p className="text-2xl font-bold text-purple-600">{statistics.recordsInserted}</p>
            </div>
          </div>
          
          <Link
            href={`/report?mode=${mode}`}
            className="mt-6 block w-full bg-green-600 text-white text-center px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
          >
            View Report →
          </Link>
        </div>
      )}
    </div>
  );
}
