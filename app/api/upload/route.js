import { NextResponse } from "next/server";
import { connectDB2 } from "@/lib/db2";
import formidable from "formidable";
import fs from "fs";
import fetch from "node-fetch";

export const config = {
  api: { bodyParser: false },
};

export async function POST(req) {
  try {
    const form = formidable({ multiples: false });
    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];
    const fileContent = fs.readFileSync(file.filepath, "utf-8");

    // ✅ Step 1: Save data to DB2
    const conn = await connectDB2();
    const lines = fileContent.split("\\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      const [emp_id, emp_name, date, status] = line.split(",");
      await conn.query(
        "INSERT INTO attendance_records (emp_id, emp_name, date, status) VALUES (?, ?, ?, ?)",
        [emp_id, emp_name, date, status]
      );
    }
    await conn.close();

    // ✅ Step 2: Trigger JCL job on z/OS via REST API
    const jcl = `
    //ATTEND JOB (ACCT),'ATTENDANCE',CLASS=A,MSGCLASS=A
    //STEP1 EXEC PGM=SORT
    //SYSOUT DD SYSOUT=*
    //SORTIN DD DSN=YOUR.INPUT.FILE,DISP=SHR
    //SORTOUT DD DSN=YOUR.OUTPUT.FILE,DISP=(NEW,CATLG,DELETE),
    //         SPACE=(CYL,(1,1)),UNIT=SYSDA
    //SYSIN DD *
     SORT FIELDS=(13,8,CH,A)
     SUM FIELDS=NONE
    /*`;

    const zosResponse = await fetch("https://<zosmf-host>/zosmf/restjobs/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        Authorization: "Basic " + Buffer.from("IBMUSER:password").toString("base64"),
      },
      body: jcl,
    });

    const zosData = await zosResponse.json();

    return NextResponse.json({
      message: "File uploaded, saved to DB2, and job submitted.",
      jobDetails: zosData,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
