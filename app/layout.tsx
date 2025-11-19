import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Attendance Report System",
  description: "Mainframe-inspired attendance report generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <nav className="bg-purple-900 text-white px-8 py-6 flex justify-between items-center shadow-lg">
          <h1 className="text-3xl font-bold text-white shadow-white">
            Attendance System
          </h1>
          <div className="space-x-6">
            <Link
              href="/upload"
              className="text-white hover:text-purple-300 transition-all shadow-white"
            >
              Upload
            </Link>
            <Link
              href="/report"
              className="text-white hover:text-purple-300 transition-all shadow-white"
            >
              Reports
            </Link>
            <Link
              href="/report-history"
              className="text-white hover:text-purple-300 transition-all shadow-white"
            >
              History
            </Link>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto mt-10 p-8">{children}</main>
      </body>
    </html>
  );
}