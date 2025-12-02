// Simple DB2-backed JES worker: polls JOBS, marks ACTIVE, simulates steps, writes SPOOL_LINES, marks OUTPUT/FAILED.

const path = require('path');
const { connectDB2 } = require(path.join(__dirname, '..', 'lib', 'db2'));

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function parseJcl(jclText = '') {
  const lines = (jclText || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const jobCard = lines.find((l) => l.startsWith('//')) || '';
  const jobName = (jobCard.split(/\s+/)[0] || '').replace(/^\/\//, '') || `JOB${Date.now()}`;
  const execs = lines
    .filter((l) => /^\/\/\w+\s+EXEC/i.test(l))
    .map((l) => {
      const m = l.match(/^\/\/(\w+)\s+EXEC\s+PGM=([^,\s]+)/i);
      return m ? { stepName: m[1], program: m[2] } : null;
    })
    .filter(Boolean);
  return { jobName, execs, raw: jclText };
}

async function processOneJob(conn, job) {
  const jobId = job.JOB_ID;
  console.log('Processing job', jobId);

  // mark ACTIVE
  await conn.query("UPDATE JOBS SET STATUS='ACTIVE', UPDATED_TS=CURRENT TIMESTAMP WHERE JOB_ID = ?", [jobId]);

  const parsed = parseJcl(job.JCL);
  let lineNo = 1;
  const writeLine = async (text) => {
    const safe = (text || '').toString().slice(0, 1024);
    await conn.query('INSERT INTO SPOOL_LINES (JOB_ID, LINE_NO, LINE_TEXT) VALUES (?, ?, ?)', [jobId, lineNo, safe]);
    lineNo++;
  };

  try {
    await writeLine(`JOB: ${parsed.jobName}`);
    await writeLine(`Started: ${new Date().toISOString()}`);

    if (!parsed.execs || parsed.execs.length === 0) {
      await writeLine('No EXEC steps found. Simulating default run...');
      await sleep(500);
      await writeLine('Completed - 0 records processed');
    } else {
      for (const step of parsed.execs) {
        await writeLine(`-- STEP ${step.stepName} (PGM=${step.program}) --`);
        // simulate some work
        await sleep(700);

        // simple hook: if program name contains REPORT or GEN, simulate report output
        if (/GENREPORT|REPORT|GEN/i.test(step.program)) {
          await writeLine('Simulating attendance report generation...');
          await sleep(300);
          await writeLine('Report simulated: total rows processed: 123');
        } else {
          await writeLine(`Program ${step.program} completed successfully`);
        }
      }
    }

    await writeLine(`Ended: ${new Date().toISOString()}`);

    // mark OUTPUT
    await conn.query("UPDATE JOBS SET STATUS='OUTPUT', RETURN_CODE=0, UPDATED_TS=CURRENT TIMESTAMP WHERE JOB_ID = ?", [jobId]);
    console.log('Job completed', jobId);
  } catch (err) {
    console.error('Error while processing job', jobId, err && err.message ? err.message : err);
    try {
      await conn.query("UPDATE JOBS SET STATUS='FAILED', RETURN_CODE=8, UPDATED_TS=CURRENT TIMESTAMP WHERE JOB_ID = ?", [jobId]);
    } catch (e) { /* ignore */ }
  }
}

async function runWorker() {
  const pollMs = parseInt(process.env.JOB_WORKER_POLL_MS || '2000', 10);
  console.log(`JES worker starting (poll ms=${pollMs})`);

  while (true) {
    let conn;
    try {
      conn = await connectDB2();

      // pick next INPUT job (FIFO)
      const rows = await conn.query("SELECT JOB_ID, JCL FROM JOBS WHERE STATUS = 'INPUT' ORDER BY SUBMIT_TS FETCH FIRST 1 ROWS ONLY");
      if (!rows || rows.length === 0) {
        try { await conn.close(); } catch (e) {}
        await sleep(pollMs);
        continue;
      }

      const job = rows[0];
      await processOneJob(conn, job);

      try { await conn.close(); } catch (e) {}
      // small delay before next poll
      await sleep(200);
    } catch (err) {
      console.error('Worker loop error:', err && err.message ? err.message : err);
      try { if (conn) await conn.close(); } catch (e) {}
      await sleep(2000);
    }
  }
}

// Run when executed
if (require.main === module) {
  runWorker().catch((e) => {
    console.error('Fatal worker error:', e && e.message ? e.message : e);
    process.exit(1);
  });

  process.on('SIGINT', () => { console.log('Worker stopping (SIGINT)'); process.exit(0); });
  process.on('SIGTERM', () => { console.log('Worker stopping (SIGTERM)'); process.exit(0); });
}