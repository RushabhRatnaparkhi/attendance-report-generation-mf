import { NextResponse } from "next/server";
import { connectDB2 } from "@/lib/db2";

export async function GET() {
  try {
    const conn = await connectDB2();
    const data = await conn.query("SELECT * FROM attendance_records ORDER BY date DESC");
    await conn.close();

    return NextResponse.json(data);
  } catch (err) {
    console.error("DB2 fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
