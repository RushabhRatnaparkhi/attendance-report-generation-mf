import { NextResponse } from 'next/server';
import { fetchRecords, fetchUploadStats } from '@/lib/db2';

/**
 * Calculate attendance status based on check-in time
 */
function calculateAttendanceStatus(checkInTime, originalStatus) {
  if (!checkInTime || checkInTime.trim() === '' || 
      originalStatus === 'Absent' || originalStatus === 'Leave') {
    return {
      calculatedStatus: originalStatus || 'Absent',
      isLate: false,
      checkInTime: checkInTime || null,
      minutesLate: 0
    };
  }

  try {
    const timeParts = checkInTime.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);

    const CUTOFF_HOUR = 9;
    const CUTOFF_MINUTE = 0;

    const isLate = (hours > CUTOFF_HOUR) || (hours === CUTOFF_HOUR && minutes > CUTOFF_MINUTE);

    let minutesLate = 0;
    if (isLate) {
      minutesLate = (hours - CUTOFF_HOUR) * 60 + (minutes - CUTOFF_MINUTE);
    }

    let calculatedStatus;
    if (originalStatus === 'Present') {
      calculatedStatus = isLate ? 'Late' : 'Present';
    } else {
      calculatedStatus = originalStatus;
    }

    return {
      calculatedStatus: calculatedStatus,
      isLate: isLate,
      checkInTime: checkInTime,
      minutesLate: minutesLate
    };
  } catch (error) {
    console.error('Error calculating status:', error);
    return {
      calculatedStatus: originalStatus || 'Unknown',
      isLate: false,
      checkInTime: checkInTime,
      minutesLate: 0
    };
  }
}

/**
 * Report API Route - Fetch from DB2
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'attendance';

    console.log('📊 Fetching report from DB2 for mode:', mode);

    let records = [];
    let statistics = [];

    if (mode === 'attendance') {
      // Fetch attendance records from DB2
      const dbRecords = await fetchRecords('attendance');
      
      console.log(`📝 Total attendance records found in DB2: ${dbRecords.length}`);
      
      // Calculate attendance status for each record
      records = dbRecords.map(rec => {
        const statusInfo = calculateAttendanceStatus(rec.CHECK_IN_TIME, rec.STATUS);
        
        return {
          EMP_ID: rec.EMP_ID,
          EMP_NAME: rec.EMP_NAME,
          ATTENDANCE_DATE: rec.ATTENDANCE_DATE,
          STATUS: rec.STATUS,
          CHECK_IN_TIME: rec.CHECK_IN_TIME,
          CHECK_OUT_TIME: rec.CHECK_OUT_TIME,
          BATCH_ID: rec.UPLOAD_BATCH,
          CALCULATED_STATUS: statusInfo.calculatedStatus,
          IS_LATE: statusInfo.isLate,
          MINUTES_LATE: statusInfo.minutesLate || 0,
          ORIGINAL_STATUS: rec.STATUS
        };
      });
      
      console.log(`✅ Processed ${records.length} attendance records`);
      
      // Fetch statistics from DB2
      statistics = await fetchUploadStats('attendance');
      console.log(`📊 Attendance statistics found: ${statistics.length}`);

    } else {
      // Fetch assignment records from DB2
      const dbRecords = await fetchRecords('assignment');
      
      records = dbRecords.map(rec => ({
        PRIMARY_KEY: rec.PRIMARY_KEY,
        RECORD_DATA: rec.FULL_RECORD,
        BATCH_ID: rec.UPLOAD_BATCH,
        PROCESSED_DATE: rec.UPLOAD_TIMESTAMP
      }));
      
      console.log(`✅ Fetched ${records.length} assignment records from DB2`);
      
      // Fetch statistics from DB2
      statistics = await fetchUploadStats('assignment');
      console.log(`📊 Assignment statistics found: ${statistics.length}`);
    }

    console.log(`✅ Returning ${records.length} records and ${statistics.length} statistics`);

    return NextResponse.json({
      success: true,
      mode,
      records,
      statistics,
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Report fetch error:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch report',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
