"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

interface SpoolLine {
  LINE_NO: number;
  LINE_TEXT: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [job, setJob] = useState<JobRow | null>(null);
  const [lines, setLines] = useState<SpoolLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchJob();
  }, [id]);

  // Auto-poll while job is INPUT or ACTIVE
  useEffect(() => {
    if (!id) return;
    let timer: number | undefined;

    const shouldPoll = (status: string | null) => status === 'INPUT' || status === 'ACTIVE';

    if (shouldPoll(job?.STATUS || null)) {
      timer = window.setInterval(() => {
        fetchJob();
      }, 2000);
    }

    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [id, job?.STATUS]);

  async function fetchJob() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch job');
      setJob(data.job || null);
      setLines(data.lines || []);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || String(e));
      setJob(null);
      setLines([]);
    } finally {
      setLoading(false);
    }
  }

  function downloadSpool() {
    const text = lines.map(l => `${l.LINE_NO} ${l.LINE_TEXT}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spool-${id}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Job Detail</h1>
          <div className="flex gap-2">
            <button onClick={() => router.back()} className="px-4 py-2 rounded bg-gray-800">Back</button>
            <Link href="/jobs" className="px-4 py-2 rounded bg-purple-600">Queue</Link>
          </div>
        </div>

        {loading && <div className="glass-strong p-6 rounded">Loading job...</div>}
        {error && <div className="glass-strong p-6 rounded border border-red-500">Error: {error}</div>}

        {!loading && !error && (
          <>
            <div className="glass-strong p-6 rounded-lg mb-6 border border-purple-500">
              <h2 className="text-xl font-bold mb-4">Job Information</h2>
              {job ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-400">Job ID:</span> <span className="font-mono">{job.JOB_ID}</span></div>
                  <div><span className="text-gray-400">Name:</span> {job.JOB_NAME}</div>
                  <div><span className="text-gray-400">User:</span> {job.SUBMITTED_BY}</div>
                  <div><span className="text-gray-400">Status:</span> <strong>{job.STATUS}</strong></div>
                  <div><span className="text-gray-400">Return Code:</span> {job.RETURN_CODE}</div>
                  <div><span className="text-gray-400">Submitted:</span> {job.SUBMIT_TS}</div>
                  <div><span className="text-gray-400">Updated:</span> {job.UPDATED_TS}</div>
                </div>
              ) : (
                <div>No job metadata available.</div>
              )}

              <div className="mt-4 flex gap-2">
                <button onClick={fetchJob} className="px-4 py-2 rounded bg-purple-600">Refresh</button>
                <button onClick={downloadSpool} className="px-4 py-2 rounded bg-green-600">Download Spool</button>
              </div>
            </div>

            <div className="glass-strong p-6 rounded-lg border border-purple-500">
              <h2 className="text-xl font-bold mb-4">Spool Output ({lines.length} lines)</h2>
              {lines.length === 0 ? (
                <div className="text-gray-400">No spool lines yet.</div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm font-mono bg-black/20 p-4 rounded max-h-[60vh] overflow-auto">
{lines.map(l => `${l.LINE_NO.toString().padStart(4, ' ')}  ${l.LINE_TEXT}`).join('\n')}
                </pre>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
