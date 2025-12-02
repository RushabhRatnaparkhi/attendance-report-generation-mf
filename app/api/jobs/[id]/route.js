import { NextResponse } from 'next/server';
import { connectDB2 } from '../../../../lib/db2';

export async function GET(req, { params }) {
  const jobId = await params.id;
  let conn;
  try {
    conn = await connectDB2();
    const jobs = await conn.query(
      'SELECT JOB_ID, JOB_NAME, SUBMITTED_BY, STATUS, RETURN_CODE, SUBMIT_TS, UPDATED_TS FROM JOBS WHERE JOB_ID = ?',
      [jobId]
    );
    const job = jobs && jobs.length ? jobs[0] : null;

    const lines = await conn.query(
      'SELECT LINE_NO, LINE_TEXT FROM SPOOL_LINES WHERE JOB_ID = ? ORDER BY LINE_NO',
      [jobId]
    );

    return NextResponse.json({ success: true, job, lines });
  } catch (err) {
    console.error('GET /api/jobs/[id] error:', err);
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  } finally {
    if (conn) try { await conn.close(); } catch (_) {}
  }
}
