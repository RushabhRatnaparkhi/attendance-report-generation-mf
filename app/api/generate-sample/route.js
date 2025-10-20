import { NextResponse } from "next/server";
import { generateSampleData } from "@/lib/processData";
import { generateSampleAttendance } from "@/lib/processAttendance";

/**
 * Generate Sample Data API
 * Supports both attendance and assignment modes
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'attendance';
    
    let sampleData, filename;
    
    if (mode === 'attendance') {
      sampleData = generateSampleAttendance();
      filename = 'sample-attendance.csv';
    } else {
      sampleData = generateSampleData();
      filename = 'sample-ps-file.txt';
    }
    
    return new NextResponse(sampleData, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
    
  } catch (err) {
    console.error("Error generating sample data:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
