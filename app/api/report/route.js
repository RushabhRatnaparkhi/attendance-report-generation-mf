import { NextResponse } from 'next/server';

// Initialize global storage if not exists
if (typeof global.attendanceRecords === 'undefined') {
  global.attendanceRecords = [];
}
if (typeof global.assignmentRecords === 'undefined') {
  global.assignmentRecords = [];
}
if (typeof global.jobStatistics === 'undefined') {
  global.jobStatistics = [];
}

/**
 * Calculate attendance status based on check-in time AND original status
 * Logic: 
 * - Check-in <= 9:00 AM AND status = "Present" → Present
 * - Check-in > 9:00 AM AND status = "Present" → Late
 * - No check-in OR status = "Absent/Leave" → Absent/Leave
 */
function calculateAttendanceStatus(checkInTime, originalStatus) {
  // If no check-in time OR status is Absent/Leave, keep original status
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
    // Parse check-in time (format: HH:MM:SS or HH:MM)
    const timeParts = checkInTime.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);

    // Define cutoff time: 9:00 AM
    const CUTOFF_HOUR = 9;
    const CUTOFF_MINUTE = 0;

    // Check if check-in is AFTER 9:00 AM
    const isLate = (hours > CUTOFF_HOUR) || 
                   (hours === CUTOFF_HOUR && minutes > CUTOFF_MINUTE);

    // Calculate how many minutes late
    let minutesLate = 0;
    if (isLate) {
      minutesLate = (hours - CUTOFF_HOUR) * 60 + (minutes - CUTOFF_MINUTE);
    }

    // NEW LOGIC: Check both time AND original status
    let calculatedStatus;
    
    if (originalStatus === 'Present') {
      // If original status is "Present", check the time
      if (isLate) {
        calculatedStatus = 'Late';
      } else {
        calculatedStatus = 'Present';  // Only if time <= 9:00 AND status = Present
      }
    } else {
      // If original status is something else (Late, Absent, Leave), keep it
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
 * Report API Route - Dual Mode
 * Fetches processed records and statistics from in-memory storage
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'attendance';

    console.log('📊 Fetching report for mode:', mode);

    let records = [];
    let statistics = [];

    if (mode === 'attendance') {
      // Fetch attendance records
      records = global.attendanceRecords || [];
      
      console.log(`📝 Total attendance records found: ${records.length}`);
      
      // Remove duplicates in case they exist
      const uniqueRecords = [];
      const seen = new Set();
      
      for (const rec of records) {
        const key = `${rec.EMP_ID}_${rec.ATTENDANCE_DATE}`;
        if (!seen.has(key)) {
          seen.add(key);
          
          // Calculate attendance status based on check-in time AND original status
          const statusInfo = calculateAttendanceStatus(rec.CHECK_IN_TIME, rec.STATUS);
          
          // Add calculated fields to record
          uniqueRecords.push({
            ...rec,
            CALCULATED_STATUS: statusInfo.calculatedStatus,
            IS_LATE: statusInfo.isLate,
            MINUTES_LATE: statusInfo.minutesLate || 0,
            ORIGINAL_STATUS: rec.STATUS
          });
        }
      }
      
      records = uniqueRecords;
      console.log(`✅ Unique attendance records: ${records.length}`);
      
      // Calculate statistics
      const presentCount = records.filter(r => r.CALCULATED_STATUS === 'Present').length;
      const lateCount = records.filter(r => r.CALCULATED_STATUS === 'Late').length;
      const absentCount = records.filter(r => 
        r.CALCULATED_STATUS === 'Absent' || 
        r.CALCULATED_STATUS === 'Leave'
      ).length;
      
      console.log(`📊 Statistics: Present=${presentCount}, Late=${lateCount}, Absent=${absentCount}`);
      
      // Fetch job statistics for attendance mode
      statistics = (global.jobStatistics || []).filter(s => s.MODE === 'attendance');
      console.log(`📊 Attendance job statistics found: ${statistics.length}`);

    } else {
      // Fetch assignment records
      records = global.assignmentRecords || [];
      
      console.log(`📝 Total assignment records found: ${records.length}`);
      
      // Remove duplicates based on PRIMARY_KEY
      const uniqueRecords = [];
      const seen = new Set();
      
      for (const rec of records) {
        if (!seen.has(rec.PRIMARY_KEY)) {
          seen.add(rec.PRIMARY_KEY);
          uniqueRecords.push(rec);
        }
      }
      
      records = uniqueRecords;
      console.log(`✅ Unique assignment records: ${records.length}`);
      
      // Fetch statistics for assignment mode
      statistics = (global.jobStatistics || []).filter(s => s.MODE === 'assignment');
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
