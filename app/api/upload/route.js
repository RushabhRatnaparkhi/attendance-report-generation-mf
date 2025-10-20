import { NextResponse } from "next/server";
import { insertAssignmentRecords, insertAttendanceRecords, insertUploadStats } from "@/lib/db2";
import { processFixedLengthRecords } from "@/lib/processData";
import { processAttendanceCSV } from "@/lib/processAttendance";

/**
 * Upload API Route - Dual Mode
 * Supports:
 * 1. Attendance Mode: CSV files with employee attendance
 * 2. Assignment Mode: Fixed-length 80-byte PS files
 */
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const mode = formData.get("mode") || 'attendance'; // Default to attendance
    
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();
    
    // Generate batch ID
    const batchId = `${mode.toUpperCase()}${Date.now().toString().slice(-6)}`;
    const jobId = `JOB${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
    
    console.log(`📋 Processing ${mode} batch: ${batchId}, Job ID: ${jobId}`);
    
    let result;
    let insertedCount;
    
    try {
      if (mode === 'attendance') {
        // Process attendance CSV
        result = processAttendanceCSV(fileContent);
        insertedCount = await insertAttendanceRecords(result.processedRecords, batchId);
      } else {
        // Process PS file (Assignment mode)
        result = processFixedLengthRecords(fileContent);
        insertedCount = await insertAssignmentRecords(result.processedRecords, batchId);
      }
      
      console.log(`✅ Processing complete:
        - Mode: ${mode}
        - Total records: ${result.totalRecords}
        - Duplicates removed: ${result.duplicatesRemoved}
        - Unique records: ${result.uniqueRecords}
      `);
      
      // Insert statistics
      await insertUploadStats({
        batchId,
        mode,
        totalRecords: result.totalRecords,
        duplicatesRemoved: result.duplicatesRemoved,
        uniqueRecords: result.uniqueRecords,
        jobStatus: 'COMPLETED',
        returnCode: 0
      });
      
      return NextResponse.json({
        success: true,
        message: `File processed successfully in ${mode} mode`,
        mode,
        jobDetails: {
          jobname: batchId,
          jobid: jobId,
          status: "CC 0000",
          returnCode: 0
        },
        statistics: {
          totalRecords: result.totalRecords,
          duplicatesRemoved: result.duplicatesRemoved,
          uniqueRecords: result.uniqueRecords,
          recordsInserted: insertedCount
        }
      });
      
    } catch (dbError) {
      console.error("DB2 Error:", dbError);
      
      // Log failed job
      await insertUploadStats({
        batchId,
        mode,
        totalRecords: result?.totalRecords || 0,
        duplicatesRemoved: result?.duplicatesRemoved || 0,
        uniqueRecords: result?.uniqueRecords || 0,
        jobStatus: 'FAILED',
        returnCode: 12
      });
      
      return NextResponse.json({
        success: false,
        error: "Database error: " + dbError.message,
        jobDetails: {
          jobname: batchId,
          jobid: jobId,
          status: "CC 0012",
          returnCode: 12
        }
      }, { status: 500 });
    }
    
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
