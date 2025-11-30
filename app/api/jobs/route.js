import { NextResponse } from 'next/server';
import { connectDB2 } from '@/lib/db2';

/**
 * POST /api/jobs
 * Body: { jcl: string, user?: string }
 * Enqueues a JCL job into JOBS table with STATUS='INPUT'
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const jcl = (body.jcl || '').toString();
    const user = (body.user || 'web').toString();

    if (!jcl || jcl.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'JCL is required' }, { status: 400 });
    }

    const jobId = `J${Date.now()}${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    const jobNameLine = jcl.split('\n')[0]?.replace(/\r/g, '')?.slice(0, 100) || jobId;

    const conn = await connectDB2();
    try {
      const insertSQL = `
        INSERT INTO JOBS (JOB_ID, JOB_NAME, SUBMITTED_BY, STATUS, JCL, UPDATED_TS)
        VALUES (?, ?, ?, ?, ?, CURRENT TIMESTAMP)
      `;

      await conn.query(insertSQL, [jobId, jobNameLine, user, 'INPUT', jcl]);
    } finally {
      await conn.close();
    }

    return NextResponse.json({ success: true, jobId }, { status: 200 });
  } catch (err) {
    console.error('Error submitting JCL job:', err);
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}
