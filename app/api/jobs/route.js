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

/**
 * GET /api/jobs
 * Returns the list of jobs, optionally filtered by status
 */
export async function GET(request) {
  let conn;
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    conn = await connectDB2();

    let sql = `SELECT JOB_ID, JOB_NAME, SUBMITTED_BY, STATUS, RETURN_CODE, SUBMIT_TS, UPDATED_TS FROM JOBS`;
    const params = [];
    if (status) {
      sql += ' WHERE STATUS = ?';
      params.push(status);
    }
    sql += ' ORDER BY SUBMIT_TS DESC FETCH FIRST 500 ROWS ONLY';

    const rows = await conn.query(sql, params);
    return NextResponse.json({ success: true, jobs: rows }, { status: 200 });
  } catch (err) {
    console.error('GET /api/jobs error:', err);
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  } finally {
    if (conn) try { await conn.close(); } catch (_) {}
  }
}
