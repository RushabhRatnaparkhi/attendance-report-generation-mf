import { NextResponse } from 'next/server';

/**
 * Generate Sample Files API
 * Provides downloadable sample files for both modes
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'attendance';

  if (mode === 'attendance') {
    // Generate sample CSV with all records on SAME DATE (2025-11-23)
    const csvContent = `EmpID,EmpName,Date,Status,CheckIn,CheckOut
E001,John Smith,2025-11-23,Present,08:40:00,17:25:00
E002,Sarah Johnson,2025-11-23,Present,08:55:00,17:30:00
E003,Michael Brown,2025-11-23,Late,09:30:00,17:40:00
E004,Emily Davis,2025-11-23,Leave,,
E005,David Wilson,2025-11-23,Present,08:35:00,17:10:00
E006,Jennifer Martinez,2025-11-23,Late,10:15:00,17:50:00
E007,Robert Anderson,2025-11-23,Present,08:25:00,17:05:00
E008,Lisa Taylor,2025-11-23,Absent,,
E009,James Thomas,2025-11-23,Present,08:30:00,17:15:00
E010,Patricia White,2025-11-23,Late,09:40:00,17:55:00
E011,Christopher Lee,2025-11-23,Late,09:55:00,17:45:00
E012,Maria Garcia,2025-11-23,Present,08:50:00,17:20:00
E013,Daniel Martinez,2025-11-23,Present,08:40:00,17:15:00
E014,Nancy Rodriguez,2025-11-23,Late,10:20:00,18:05:00
E015,Kevin Hernandez,2025-11-23,Present,08:45:00,17:30:00
E016,Karen Lopez,2025-11-23,Absent,,
E017,Steven Gonzalez,2025-11-23,Present,08:30:00,17:10:00
E018,Betty Wilson,2025-11-23,Late,09:20:00,17:40:00
E019,Edward Moore,2025-11-23,Present,08:55:00,17:25:00
E020,Michelle Garcia,2025-11-23,Present,08:20:00,17:00:00`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="sample-attendance.csv"',
      },
    });

  } else {
    // Generate sample PS file (80-byte fixed-length records)
    const records = [
      'ABC123XY    12345678PART-001    DATA FIELD 1          ADDITIONAL INFO         XYZ789  ',
      'DEF456ZA    23456789PART-002    DATA FIELD 2          MORE INFORMATION        ABC123  ',
      'GHI789BC    34567890PART-003    DATA FIELD 3          EXTRA DETAILS           DEF456  ',
      'JKL012DE    45678901PART-004    DATA FIELD 4          SUPPLEMENTARY DATA      GHI789  ',
      'MNO345FG    56789012PART-005    DATA FIELD 5          ADDITIONAL CONTENT      JKL012  ',
      'PQR678HI    67890123PART-006    DATA FIELD 6          MORE RECORDS            MNO345  ',
      'STU901JK    78901234PART-007    DATA FIELD 7          FURTHER INFO            PQR678  ',
      'VWX234LM    89012345PART-008    DATA FIELD 8          CONTINUED DATA          STU901  ',
      'YZA567NO    90123456PART-009    DATA FIELD 9          LAST RECORD             VWX234  ',
      'BCD890PQ    01234567PART-010    DATA FIELD 10         FINAL ENTRY             YZA567  ',
    ];

    const psFileContent = records.join('\n');

    return new NextResponse(psFileContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="sample-ps-file.txt"',
      },
    });
  }
}
