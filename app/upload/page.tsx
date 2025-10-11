"use client";
import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [jobDetails, setJobDetails] = useState<any>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setStatus("Uploading and processing...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setStatus("✅ Upload successful, job submitted!");
      setJobDetails(data.jobDetails);
    } catch (err: any) {
      console.error(err);
      setStatus("❌ Error: " + err.message);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto text-center">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">Upload Attendance Data</h1>
      <form onSubmit={handleUpload} className="space-y-6">
        <input
          type="file"
          accept=".csv,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="border border-gray-300 p-3 w-full rounded-md"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Upload
        </button>
      </form>

      {status && <p className="mt-4 text-gray-700">{status}</p>}

      {jobDetails && (
        <div className="mt-6 text-left border p-4 rounded-lg bg-gray-50">
          <h2 className="font-semibold mb-2">Job Details</h2>
          <p><b>Job Name:</b> {jobDetails.jobname}</p>
          <p><b>Job ID:</b> {jobDetails.jobid}</p>
          <p><b>Status:</b> Submitted to z/OSMF</p>
        </div>
      )}
    </div>
  );
}
