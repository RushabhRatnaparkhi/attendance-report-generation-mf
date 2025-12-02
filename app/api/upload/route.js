import { NextResponse } from 'next/server';
import { processFixedLengthRecords } from '@/lib/processData';
import { insertAttendanceRecords, insertAssignmentRecords, insertUploadStats, connectDB2 } from '@/lib/db2';

/**
 * Upload API Route - Dual Mode with DB2
 * Clears old data and inserts new data (single table approach)
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const mode = formData.get('mode') || 'attendance';

    console.log('📤 Upload received:', { fileName: file?.name, mode, fileSize: file?.size });

    if (!file) {
      console.error('❌ No file uploaded');
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    
    if (!fileContent || fileContent.trim().length === 0) {
      console.error('❌ File is empty');
      return NextResponse.json(
        { success: false, error: 'File is empty' },
        { status: 400 }
      );
    }

    const batchId = `BATCH_${Date.now()}`;
    console.log('🆔 Generated Batch ID:', batchId);

    // Enqueue a job representing this upload (JCL = first 200 chars of file)
    const connForJob = await connectDB2();
    let enqueuedJobId = null; // <-- store the job id so we can return it to the client
    try {
      const jobId = `J${Date.now()}${Math.random().toString(36).slice(2,6).toUpperCase()}`;
      enqueuedJobId = jobId;
      const jobName = (file.name || jobId).toString().slice(0,100);
      const jclSample = fileContent.slice(0, 200);
      await connForJob.query(
        'INSERT INTO JOBS (JOB_ID, JOB_NAME, SUBMITTED_BY, STATUS, JCL, UPDATED_TS) VALUES (?, ?, ?, ?, ?, CURRENT TIMESTAMP)',
        [jobId, jobName, 'uploader', 'INPUT', jclSample]
      );
      console.log('🔁 Enqueued job for upload processing:', jobId);
    } finally {
      try { await connForJob.close(); } catch (e) {}
    }

    if (mode === 'attendance') {
      console.log('📊 Processing attendance CSV...');
      
      // Parse CSV file
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        console.error('❌ CSV file is empty after parsing');
        return NextResponse.json(
          { success: false, error: 'CSV file is empty' },
          { status: 400 }
        );
      }

      const headers = lines[0].split(',');
      console.log('📋 CSV Headers:', headers);
      
      const data = lines.slice(1);
      console.log('📝 Data lines:', data.length);

      const records = data.map((line, index) => {
        const values = line.split(',');
        return {
          empId: values[0]?.trim(),
          empName: values[1]?.trim(),
          date: values[2]?.trim(),
          status: values[3]?.trim(),
          checkIn: values[4]?.trim() || null,
          checkOut: values[5]?.trim() || null
        };
      }).filter(rec => rec.empId && rec.empName);

      console.log(`📝 Parsed ${records.length} valid records from CSV`);

      if (records.length === 0) {
        console.error('❌ No valid records found in CSV');
        return NextResponse.json(
          { success: false, error: 'No valid records found in CSV. Check file format.' },
          { status: 400 }
        );
      }

      // Remove duplicates (EmpID + Date combination)
      const uniqueRecords = [];
      const seen = new Set();
      
      for (const rec of records) {
        const key = `${rec.empId}_${rec.date}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueRecords.push(rec);
        }
      }

      // ✅ SORT by EmpID (ascending), then by Date (ascending) - JCL SORT simulation
      uniqueRecords.sort((a, b) => {
        if (a.empId !== b.empId) {
          return a.empId.localeCompare(b.empId);
        }
        return a.date.localeCompare(b.date);
      });

      console.log(`✅ Unique records: ${uniqueRecords.length}, Duplicates removed: ${records.length - uniqueRecords.length}`);
      console.log(`🔄 Sorted by EMP_ID (ascending), then ATTENDANCE_DATE (ascending)`);

      // ⚠️ CLEAR OLD ATTENDANCE DATA - Delete all rows from table
      console.log('🧹 Clearing old attendance records from DB2...');
      const conn = await connectDB2();
      try {
        // Use a dummy WHERE clause to avoid SQL0513W warning
        await conn.query("DELETE FROM EMPLOYEE_ATTENDANCE WHERE 1=1");
        console.log('✅ Old attendance records cleared');
      } catch (deleteError) {
        // SQL0513W is just a warning, not a fatal error
        if (deleteError.sqlcode === 513 || deleteError.sqlstate === '01504') {
          console.log('⚠️ Delete warning received (SQL0513W) - continuing anyway');
        } else {
          console.error('❌ Delete error:', deleteError);
          throw deleteError;
        }
      } finally {
        await conn.close();
      }

      // ✅ INSERT NEW DATA into DB2
      console.log('💾 Inserting new attendance records into DB2...');
      const insertedCount = await insertAttendanceRecords(uniqueRecords, batchId);
      console.log(`✅ Inserted ${insertedCount} records into DB2`);

      // Calculate statistics
      const presentCount = uniqueRecords.filter(r => {
        if (!r.checkIn) return false;
        const timeParts = r.checkIn.split(':');
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        return (hours < 9) || (hours === 9 && minutes === 0);
      }).length;

      const lateCount = uniqueRecords.filter(r => {
        if (!r.checkIn) return false;
        const timeParts = r.checkIn.split(':');
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        return (hours > 9) || (hours === 9 && minutes > 0);
      }).length;

      const absentCount = uniqueRecords.filter(r => !r.checkIn || r.status === 'Absent' || r.status === 'Leave').length;

      // Store statistics in DB2 (append to history)
      await insertUploadStats({
        batchId,
        mode: 'attendance',
        totalRecords: records.length,
        duplicatesRemoved: records.length - uniqueRecords.length,
        uniqueRecords: uniqueRecords.length,
        jobStatus: 'COMPLETED',
        returnCode: 0
      });
      console.log('📊 Statistics saved to DB2');

      return NextResponse.json({
        success: true,
        message: 'Attendance data processed successfully (JCL SORT simulation)',
        batchId,
        totalRecords: records.length,
        duplicatesRemoved: records.length - uniqueRecords.length,
        uniqueRecords: uniqueRecords.length,
        presentCount,
        lateCount,
        absentCount,
        mode: 'attendance',
        jobId: enqueuedJobId, // <-- return the enqueued job id
        jobDetails: {
          batchId,
          jobId: enqueuedJobId,
          jobStatus: 'COMPLETED',
          returnCode: 'CC 0000',
          mode: 'attendance',
          recordsProcessed: uniqueRecords.length
        }
      }, { status: 200 });

    } else {
      // Assignment mode
      console.log('📋 Processing assignment PS file...');
      
      try {
        const result = processFixedLengthRecords(fileContent);
        console.log(`✅ Processed ${result.uniqueRecords} unique records, removed ${result.duplicatesRemoved} duplicates`);
        console.log(`🔄 Sorted by PRIMARY_KEY (columns 13-20, ascending) - JCL SORT FIELDS=(13,8,CH,A)`);

        if (result.processedRecords.length === 0) {
          console.error('❌ No valid 80-byte records found');
          return NextResponse.json(
            { success: false, error: 'No valid 80-byte records found in file' },
            { status: 400 }
          );
        }

        // ⚠️ CLEAR OLD ASSIGNMENT DATA - Delete all rows from table
        console.log('🧹 Clearing old assignment records from DB2...');
        const conn = await connectDB2();
        try {
          // Use a dummy WHERE clause to avoid SQL0513W warning
          await conn.query("DELETE FROM ASSIGNMENT_RECORDS WHERE 1=1");
          console.log('✅ Old assignment records cleared');
        } catch (deleteError) {
          // SQL0513W is just a warning, not a fatal error
          if (deleteError.sqlcode === 513 || deleteError.sqlstate === '01504') {
            console.log('⚠️ Delete warning received (SQL0513W) - continuing anyway');
          } else {
            console.error('❌ Delete error:', deleteError);
            throw deleteError;
          }
        } finally {
          await conn.close();
        }

        // ✅ INSERT NEW DATA into DB2
        console.log('💾 Inserting new assignment records into DB2...');
        const insertedCount = await insertAssignmentRecords(result.processedRecords, batchId);
        console.log(`✅ Inserted ${insertedCount} records into DB2`);

        // Store statistics in DB2 (append to history)
        await insertUploadStats({
          batchId,
          mode: 'assignment',
          totalRecords: result.totalRecords,
          duplicatesRemoved: result.duplicatesRemoved,
          uniqueRecords: result.uniqueRecords,
          jobStatus: 'COMPLETED',
          returnCode: 0
        });
        console.log('📊 Statistics saved to DB2');

        return NextResponse.json({
          success: true,
          message: 'Assignment data processed successfully (JCL SORT FIELDS=(13,8,CH,A))',
          batchId,
          totalRecords: result.totalRecords,
          duplicatesRemoved: result.duplicatesRemoved,
          uniqueRecords: result.uniqueRecords,
          mode: 'assignment',
          jobId: enqueuedJobId, // <-- return the enqueued job id here as well
          jobDetails: {
            batchId,
            jobId: enqueuedJobId,
            jobStatus: 'COMPLETED',
            returnCode: 'CC 0000',
            mode: 'assignment',
            recordsProcessed: result.uniqueRecords
          }
        }, { status: 200 });

      } catch (processError) {
        console.error('❌ Processing error:', processError);
        return NextResponse.json(
          { success: false, error: `Record processing failed: ${processError.message}` },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error('❌ Upload error:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Upload processing failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
