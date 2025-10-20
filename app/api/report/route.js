import { NextResponse } from "next/server";
import { fetchRecords, fetchUploadStats } from "@/lib/db2";

/**
 * Report API Route - Dual Mode
 * Fetches processed records and statistics from DB2
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');
    const mode = searchParams.get('mode') || 'attendance';
    
    // Fetch records (filtered by mode and optionally by batch)
    const records = await fetchRecords(mode, batchId);
    
    // Fetch upload statistics (filtered by mode)
    const stats = await fetchUploadStats(mode);

    return NextResponse.json({
      success: true,
      mode,
      records,
      statistics: stats
    });
    
  } catch (err) {
    console.error("DB2 fetch error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
