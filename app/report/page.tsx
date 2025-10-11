"use client";
import { useEffect, useState } from "react";

export default function ReportPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/report");
        const data = await res.json();
        setRecords(data);
      } catch (err) {
        console.error("Error fetching report:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-green-700 mb-6 text-center">Attendance Report</h1>
      {loading ? (
        <p className="text-gray-600 text-center">Loading report...</p>
      ) : records.length > 0 ? (
        <table className="min-w-full border-collapse border border-gray-300 shadow-md">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="p-2 border border-gray-300">Emp ID</th>
              <th className="p-2 border border-gray-300">Name</th>
              <th className="p-2 border border-gray-300">Date</th>
              <th className="p-2 border border-gray-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec, idx) => (
              <tr key={idx} className="text-center even:bg-gray-50">
                <td className="border p-2">{rec.EMP_ID}</td>
                <td className="border p-2">{rec.EMP_NAME}</td>
                <td className="border p-2">{rec.DATE}</td>
                <td className="border p-2">{rec.STATUS}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-gray-600">No records found.</p>
      )}
    </div>
  );
}
