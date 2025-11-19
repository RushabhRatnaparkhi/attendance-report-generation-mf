import { NextResponse } from 'next/server';
import { processFixedLengthRecords } from '@/lib/processData';

// In-memory storage
global.attendanceRecords = global.attendanceRecords || [];
global.assignmentRecords = global.assignmentRecords || [];
global.jobStatistics = global.jobStatistics || [];

/**
 * Upload API Route - Dual Mode
 * Handles both CSV (attendance) and PS file (assignment) uploads
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
          EMP_ID: values[0]?.trim(),
          EMP_NAME: values[1]?.trim(),
          ATTENDANCE_DATE: values[2]?.trim(),
          STATUS: values[3]?.trim(),
          CHECK_IN_TIME: values[4]?.trim() || null,
          CHECK_OUT_TIME: values[5]?.trim() || null,
          BATCH_ID: batchId
        };
      }).filter(rec => rec.EMP_ID && rec.EMP_NAME);

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
        const key = `${rec.EMP_ID}_${rec.ATTENDANCE_DATE}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueRecords.push(rec);
        }
      }

      // ✅ SORT by EmpID (ascending), then by Date (ascending) - JCL SORT simulation
      uniqueRecords.sort((a, b) => {
        // First sort by Employee ID
        if (a.EMP_ID !== b.EMP_ID) {
          return a.EMP_ID.localeCompare(b.EMP_ID);
        }
        // Then sort by Date
        return a.ATTENDANCE_DATE.localeCompare(b.ATTENDANCE_DATE);
      });

      console.log(`✅ Unique records: ${uniqueRecords.length}, Duplicates removed: ${records.length - uniqueRecords.length}`);
      console.log(`🔄 Sorted by EMP_ID (ascending), then ATTENDANCE_DATE (ascending)`);

      // ⚠️ CLEAR OLD ATTENDANCE DATA before storing new data
      global.attendanceRecords = [];
      console.log('🧹 Cleared old attendance records');

      // Store NEW data in memory
      global.attendanceRecords.push(...uniqueRecords);
      console.log(`💾 Total attendance records in storage: ${global.attendanceRecords.length}`);

      // Calculate statistics
      const presentCount = uniqueRecords.filter(r => {
        if (!r.CHECK_IN_TIME) return false;
        const timeParts = r.CHECK_IN_TIME.split(':');
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        return (hours < 9) || (hours === 9 && minutes === 0);
      }).length;

      const lateCount = uniqueRecords.filter(r => {
        if (!r.CHECK_IN_TIME) return false;
        const timeParts = r.CHECK_IN_TIME.split(':');
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        return (hours > 9) || (hours === 9 && minutes > 0);
      }).length;

      const absentCount = uniqueRecords.filter(r => !r.CHECK_IN_TIME || r.STATUS === 'Absent' || r.STATUS === 'Leave').length;

      // Store statistics (append to history)
      const stats = {
        BATCH_ID: batchId,
        MODE: 'attendance',
        TOTAL_RECORDS: records.length,
        DUPLICATES_REMOVED: records.length - uniqueRecords.length,
        UNIQUE_RECORDS: uniqueRecords.length,
        PRESENT_COUNT: presentCount,
        LATE_COUNT: lateCount,
        ABSENT_COUNT: absentCount,
        JOB_STATUS: 'COMPLETED',
        RETURN_CODE: 0,
        UPLOAD_TIMESTAMP: new Date().toISOString()
      };
      global.jobStatistics.push(stats);
      console.log('📊 Statistics saved:', stats);

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
        jobDetails: {
          batchId,
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

        // ⚠️ CLEAR OLD ASSIGNMENT DATA before storing new data
        global.assignmentRecords = [];
        console.log('🧹 Cleared old assignment records');

        // Store NEW data in memory
        const assignmentRecords = result.processedRecords.map(rec => ({
          PRIMARY_KEY: rec.primaryKey,
          RECORD_DATA: rec.fullRecord,
          BATCH_ID: batchId,
          PROCESSED_DATE: new Date().toISOString()
        }));
        
        global.assignmentRecords.push(...assignmentRecords);
        console.log(`💾 Total assignment records in storage: ${global.assignmentRecords.length}`);

        // Store statistics (append to history)
        const stats = {
          BATCH_ID: batchId,
          MODE: 'assignment',
          TOTAL_RECORDS: result.totalRecords,
          DUPLICATES_REMOVED: result.duplicatesRemoved,
          UNIQUE_RECORDS: result.uniqueRecords,
          JOB_STATUS: 'COMPLETED',
          RETURN_CODE: 0,
          UPLOAD_TIMESTAMP: new Date().toISOString()
        };
        global.jobStatistics.push(stats);
        console.log('📊 Statistics saved:', stats);

        return NextResponse.json({
          success: true,
          message: 'Assignment data processed successfully (JCL SORT FIELDS=(13,8,CH,A))',
          batchId,
          totalRecords: result.totalRecords,
          duplicatesRemoved: result.duplicatesRemoved,
          uniqueRecords: result.uniqueRecords,
          mode: 'assignment',
          jobDetails: {
            batchId,
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
