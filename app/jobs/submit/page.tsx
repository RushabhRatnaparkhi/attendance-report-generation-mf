"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function SubmitJobsPage() {
  const [jclText, setJclText] = useState('');
  const [user, setUser] = useState('web');
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Array<{ jobId:string, status:string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [generatedCount, setGeneratedCount] = useState(5);

  const parseBlocks = (text: string) => {
    // split by delimiter lines with only dashes or by two+ newlines
    const parts = text.split(/(^-{3,}$|\n{2,})/m).map(p => p.trim()).filter(Boolean);
    // If the user pasted JCLs with '---' delimiter remove delimiter tokens
    const filtered = parts.filter(p => !/^[-]{3,}$/.test(p));
    return filtered;
  };

  async function enqueueOne(jcl: string) {
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jcl, user })
      });
      const data = await res.json();
      if (res.ok && data.jobId) return { jobId: data.jobId, status: 'ok' };
      return { jobId: data.jobId || 'ERROR', status: data.error || 'failed' };
    } catch (e: any) {
      return { jobId: 'ERROR', status: e.message || 'network error' };
    }
  }

  async function handleEnqueueAll() {
    setSubmitting(true);
    setError(null);
    setResults([]);

    const blocks = parseBlocks(jclText);
    if (!blocks || blocks.length === 0) {
      setError('No JCL blocks found. Enter one or more JCL scripts separated by a blank line or a line with ---');
      setSubmitting(false);
      return;
    }

    const resArr: Array<{ jobId:string, status:string }> = [];
    for (const b of blocks) {
      const r = await enqueueOne(b);
      resArr.push(r);
      setResults([...resArr]);
      // small gap so DB2/worker won't be overwhelmed in local dev
      await new Promise((r) => setTimeout(r, 150));
    }

    setSubmitting(false);
  }

  function makeSampleJcl(i:number) {
    return `//SAMPLE${i} JOB (ACCT),'SAMPLE JOB ${i}'\n//STEP1   EXEC PGM=GENREPORT\n//SYSOUT  DD SYSOUT=*\n//`;
  }

  async function handleGenerateAndEnqueue() {
    const n = Math.max(1, Math.min(200, Number(generatedCount || 5)));
    const blocks = [];
    for (let i=1;i<=n;i++) blocks.push(makeSampleJcl(i));
    setJclText(blocks.join('\n\n'));
    // Enqueue immediately
    setTimeout(() => handleEnqueueAll(), 50);
  }

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Submit Multiple Jobs</h1>
          <Link href="/jobs" className="text-sm text-purple-300">Back to Job Queue</Link>
        </div>

        <div className="glass-strong p-6 rounded-lg mb-6">
          <label className="block text-sm text-gray-300 mb-2">Submitted by (user)</label>
          <input value={user} onChange={(e)=>setUser(e.target.value)} className="w-full p-2 rounded bg-transparent border border-purple-600 text-white" />
        </div>

        <div className="glass-strong p-6 rounded-lg mb-6">
          <label className="block text-sm text-gray-300 mb-2">Paste multiple JCL blocks here (separate by blank line or a line with ---)</label>
          <textarea value={jclText} onChange={(e)=>setJclText(e.target.value)} rows={12} className="w-full p-3 rounded bg-transparent border border-purple-600 text-white font-mono" />

          <div className="flex gap-3 mt-4">
            <button onClick={handleEnqueueAll} disabled={submitting} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">Enqueue All</button>
            <input type="number" value={generatedCount} onChange={(e)=>setGeneratedCount(Number(e.target.value))} className="w-24 p-2 rounded bg-transparent border border-purple-600 text-white" />
            <button onClick={handleGenerateAndEnqueue} disabled={submitting} className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded">Generate & Enqueue</button>
            <button onClick={()=>{ setJclText(''); setResults([]); setError(null); }} className="ml-auto bg-gray-700 px-4 py-2 rounded">Clear</button>
          </div>

          {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded">{error}</div>}
        </div>

        <div className="glass-strong p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-3">Enqueue Results</h2>
          {results.length === 0 && <div className="text-gray-300">No jobs enqueued yet.</div>}
          <ul className="space-y-2">
            {results.map((r, idx) => (
              <li key={`${r.jobId}-${idx}`} className="flex items-center gap-3">
                {r.jobId && r.jobId !== 'ERROR' ? (
                  <Link href={`/jobs/${r.jobId}`} className="font-mono text-yellow-300">{r.jobId}</Link>
                ) : (
                  <span className="font-mono text-red-400">{r.jobId}</span>
                )}
                <span className="text-sm text-gray-300">{r.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
