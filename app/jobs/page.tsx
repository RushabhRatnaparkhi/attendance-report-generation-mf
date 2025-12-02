"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface JobRow {
  JOB_ID: string;
  JOB_NAME: string;
  SUBMITTED_BY: string;
  STATUS: string;
  RETURN_CODE: number;
  SUBMIT_TS: string;
  UPDATED_TS: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  // Auto-poll for updates (default 3000ms, override with NEXT_PUBLIC_JOB_POLL_MS)
  useEffect(() => {
    const pollMs = Number(process.env.NEXT_PUBLIC_JOB_POLL_MS) || 3000;
    const id = setInterval(() => {
      fetchJobs();
    }, pollMs);
    return () => clearInterval(id);
  }, [statusFilter]);

  // Listen for new jobs via BroadcastChannel so UI can show enqueued jobs instantly
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let bc;
    try {
      bc = new BroadcastChannel('jobs');
    } catch (e) {
      return;
    }

    const handler = (ev: MessageEvent) => {
      try {
        const msg = ev.data;
        if (msg && msg.type === 'job-enqueued' && msg.job) {
          setJobs((prev) => {
            // avoid duplicates
            if (prev.find((j) => j.JOB_ID === msg.job.JOB_ID)) return prev;
            return [msg.job, ...prev];
          });
        }
      } catch (err) {
        console.error('BroadcastChannel handler error', err);
      }
    };

    bc.addEventListener('message', handler);
    return () => {
      try { bc.removeEventListener('message', handler); bc.close(); } catch (e) {}
    };
  }, []);

  async function fetchJobs() {
    setLoading(true);
    try {
      const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
      const res = await fetch(`/api/jobs${q}`);
      // Read text first to avoid JSON parse error on empty response
      const text = await res.text();
      if (!text) {
        setJobs([]);
      } else {
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          console.error('Failed to parse jobs JSON:', parseErr, 'raw:', text);
          setJobs([]);
          return;
        }

        if (res.ok && data.jobs) setJobs(data.jobs);
        else setJobs([]);
      }
    } catch (e) {
      console.error(e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Job Queue</h1>
          <Link href="/report" className="text-sm text-purple-300">Back to Reports</Link>
        </div>

        <div className="flex gap-3 mb-4">
          <button onClick={() => setStatusFilter(null)} className={`px-4 py-2 rounded ${statusFilter===null ? 'bg-purple-600' : 'glass'}`}>All</button>
          <button onClick={() => setStatusFilter('INPUT')} className={`px-4 py-2 rounded ${statusFilter==='INPUT' ? 'bg-green-600' : 'glass'}`}>INPUT</button>
          <button onClick={() => setStatusFilter('ACTIVE')} className={`px-4 py-2 rounded ${statusFilter==='ACTIVE' ? 'bg-yellow-600' : 'glass'}`}>ACTIVE</button>
          <button onClick={() => setStatusFilter('OUTPUT')} className={`px-4 py-2 rounded ${statusFilter==='OUTPUT' ? 'bg-blue-600' : 'glass'}`}>OUTPUT</button>
          <button onClick={() => setStatusFilter('FAILED')} className={`px-4 py-2 rounded ${statusFilter==='FAILED' ? 'bg-red-600' : 'glass'}`}>FAILED</button>
          <button onClick={() => fetchJobs()} className="ml-auto px-4 py-2 rounded bg-purple-600">Refresh</button>
        </div>

        <div className="glass-strong rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-purple-900/50">
                <tr>
                  <th className="px-4 py-2 text-left">Job ID</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Submit Time</th>
                  <th className="px-4 py-2 text-left">Updated</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
                )}
                {!loading && jobs.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center">No jobs found.</td></tr>
                )}
                {jobs.map((job) => (
                  <tr key={job.JOB_ID} className="hover:bg-purple-900/20">
                    <td className="px-4 py-2 font-mono"><a href={`/jobs/${job.JOB_ID}`} className="text-purple-200">{job.JOB_ID}</a></td>
                    <td className="px-4 py-2">{job.JOB_NAME}</td>
                    <td className="px-4 py-2">{job.SUBMITTED_BY}</td>
                    <td className="px-4 py-2">{job.STATUS}</td>
                    <td className="px-4 py-2">{job.SUBMIT_TS}</td>
                    <td className="px-4 py-2">{job.UPDATED_TS}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
