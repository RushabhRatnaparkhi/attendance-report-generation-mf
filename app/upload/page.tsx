"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface JobDetails {
  batchId: string;
  jobStatus: string;
  returnCode: string;
  mode: string;
  recordsProcessed: number;
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<'attendance' | 'assignment'>('attendance');
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [enqueueResults, setEnqueueResults] = useState<Array<{ fileName: string; jobId?: string | null; ok: boolean; message?: string }>>([]);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!files || files.length === 0) {
      setError("Please select one or more files to upload");
      return;
    }

    setUploading(true);
    setStatus("📤 Uploading file...");
    setError("");
    setJobDetails(null);
    setEnqueueResults([]);

    try {
      const results = [];
      for (const f of files) {
        const formData = new FormData();
        formData.append('file', f);
        formData.append('mode', mode);

        setStatus(`📤 Uploading ${f.name} ...`);
        try {
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          const text = await res.text();
          let data = {};
          try { data = text ? JSON.parse(text) : {}; } catch (e) { data = {}; }

          if (res.ok && data.success) {
            results.push({ fileName: f.name, jobId: data.jobId || null, ok: true, message: data.message || 'enqueued' });
            // attach last successful jobDetails for convenience
            setJobDetails(data.jobDetails || null);
          } else {
            results.push({ fileName: f.name, jobId: data.jobId || null, ok: false, message: data.error || 'failed' });
          }
        } catch (err: any) {
          results.push({ fileName: f.name, ok: false, message: err?.message || 'network error' });
        }
        // small delay between files
        await new Promise((r) => setTimeout(r, 150));
      }

      setEnqueueResults(results);
      setStatus('✅ Upload(s) processed.');

    } catch (err: any) {
      console.error("Upload error:", err);
      setStatus("❌ Upload failed");
      setError(err.message || "An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleViewReport = () => {
    if (jobDetails) {
      router.push(`/report?mode=${jobDetails.mode}`);
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
    <div className="min-h-screen p-8 bg-black text-white">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold text-white shadow-white">
            📤 Upload Data File
          </h1>
          <div className="flex gap-3">
            <Link
              href="/report"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
            >
              📊 View All Reports
            </Link>
            <Link
              href="/jobs"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
            >
              🗂️ View Job Queue
            </Link>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="glass-strong p-6 rounded-lg mb-6">
          <label className="block text-lg font-semibold mb-4 text-white">
            Select Processing Mode:
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setMode("attendance")}
              disabled={uploading}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                mode === "attendance"
                  ? "bg-green-600 text-white"
                  : "glass border border-purple-500 text-white hover:bg-purple-800"
              } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              👥 Attendance Mode (CSV)
            </button>
            <button
              onClick={() => setMode("assignment")}
              disabled={uploading}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                mode === "assignment"
                  ? "bg-blue-600 text-white"
                  : "glass border border-purple-500 text-white hover:bg-purple-800"
              } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              📋 Assignment Mode (PS File)
            </button>
          </div>
          <p className="text-sm text-gray-300 mt-3">
            {mode === "attendance"
              ? "Upload CSV file with employee attendance records (EMP_ID, EMP_NAME, DATE, STATUS, CHECK_IN, CHECK_OUT)"
              : "Upload PS file with 80-byte fixed-length records (Primary key in columns 13-20)"}
          </p>
        </div>

        {/* Sample Data Download */}
        <div className="glass-strong p-4 rounded-lg mb-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-white">
                <strong>Need test data?</strong> Download a sample {mode === 'attendance' ? 'CSV' : 'PS'} file for testing
              </p>
            </div>
            <button
              onClick={downloadSample}
              className="ml-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              📥 Download Sample
            </button>
          </div>
        </div>

        {/* File Upload Form */}
        <form onSubmit={handleUpload} className="glass-strong p-6 rounded-lg">
          <label className="block text-lg font-semibold mb-4 text-white">
            Choose {mode === "attendance" ? "CSV" : "PS"} File:
          </label>
          <input
            type="file"
            multiple
            accept={mode === "attendance" ? ".csv" : ".txt,.ps"}
            onChange={(e) => {
              const list = e.target.files ? Array.from(e.target.files) : [];
              setFiles((prev) => {
                // append and dedupe by name+size
                const combined = [...prev, ...list];
                const map = new Map();
                for (const f of combined) {
                  map.set(`${f.name}_${f.size}`, f);
                }
                return Array.from(map.values());
              });
              setError("");
              setStatus("");
              setJobDetails(null);
              setEnqueueResults([]);
            }}
            className="w-full p-3 border border-purple-500 rounded-lg bg-transparent text-white mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer"
            disabled={uploading}
          />
          
          {files && files.length > 0 && (
            <div className="mb-4 p-3 glass rounded-lg text-white">
              <p className="text-sm mb-2"><strong>Selected files:</strong></p>
              <ul className="list-none text-sm space-y-2">
                {files.map((f) => (
                  <li key={f.name+f.size} className="flex items-center justify-between">
                    <div className="truncate mr-4">{f.name} ({(f.size/1024).toFixed(2)} KB)</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((x) => !(x.name === f.name && x.size === f.size)))}
                        className="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded"
                      >Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-white">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <strong>Error:</strong> {error}
                </div>
              </div>
            </div>
          )}

          {status && !error && (
            <div className="mb-4 p-4 glass-strong rounded-lg text-white border border-green-500">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>{status}</div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !files.length}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              uploading || !files.length
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            } text-white`}
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              "🚀 Upload & Process"
            )}
          </button>
        </form>

        {/* Enqueue Results */}
        {enqueueResults && enqueueResults.length > 0 && (
          <div className="glass-strong p-6 rounded-lg mt-6 border-2 border-yellow-500">
            <h3 className="text-lg font-bold mb-3">Enqueue Results</h3>
            <ul className="space-y-2">
              {enqueueResults.map((r, idx) => (
                <li key={`${r.fileName}-${idx}`} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.fileName}</div>
                    <div className="text-sm text-gray-300">{r.message || (r.ok ? 'enqueued' : 'failed')}</div>
                  </div>
                  <div>
                    {r.jobId ? (
                      <Link href={`/jobs/${r.jobId}`} className="font-mono text-yellow-300">{r.jobId}</Link>
                    ) : (
                      <span className="text-red-400">No job</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Job Details */}
        {jobDetails && (
          <div className="glass-strong p-6 rounded-lg mt-6 border-2 border-green-500">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-white">
                📊 Job Completed Successfully
              </h2>
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                {jobDetails.jobStatus}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass p-4 rounded-lg">
                <p className="text-sm text-gray-300 mb-1">Batch ID</p>
                <p className="text-lg font-mono font-bold text-white">{jobDetails.batchId}</p>
              </div>
              <div className="glass p-4 rounded-lg">
                <p className="text-sm text-gray-300 mb-1">Return Code</p>
                <p className="text-lg font-mono font-bold text-green-400">{jobDetails.returnCode}</p>
              </div>
              <div className="glass p-4 rounded-lg">
                <p className="text-sm text-gray-300 mb-1">Processing Mode</p>
                <p className="text-lg font-bold text-white capitalize">{jobDetails.mode}</p>
              </div>
              <div className="glass p-4 rounded-lg">
                <p className="text-sm text-gray-300 mb-1">Records Processed</p>
                <p className="text-lg font-bold text-white">{jobDetails.recordsProcessed}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleViewReport}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Report
              </button>
              <button
                onClick={() => {
                  setFiles([]);
                  setStatus("");
                  setJobDetails(null);
                  setError("");
                  setEnqueueResults([]);
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Another File
              </button>
            </div>

            {/* View Job Details Button */}
            <div className="mt-4">
              {jobDetails?.jobId ? (
                <Link
                  href={`/jobs/${jobDetails.jobId}`}
                  className="w-full inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold text-center transition"
                >
                  🔍 View Job Details
                </Link>
              ) : (
                <Link
                  href={`/jobs`}
                  className="w-full inline-block bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold text-center transition"
                >
                  🔍 View Job List
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="glass-strong p-6 rounded-lg mt-6">
          <h3 className="text-xl font-bold text-white mb-3">📖 Help & Instructions</h3>
          <div className="space-y-2 text-gray-300">
            <p><strong className="text-white">Attendance Mode:</strong> Upload a CSV file with columns: EMP_ID, EMP_NAME, ATTENDANCE_DATE, STATUS, CHECK_IN_TIME, CHECK_OUT_TIME</p>
            <p><strong className="text-white">Assignment Mode:</strong> Upload a PS file with 80-byte fixed-length records (Primary key in columns 13-20)</p>
            <p><strong className="text-white">Processing:</strong> System automatically removes duplicates and sorts records (simulates JCL SORT)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
