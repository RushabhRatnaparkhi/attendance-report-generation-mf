import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Attendance Report System",
  description: "Mainframe-inspired attendance report generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-800">
        <nav className="bg-blue-600 text-white px-8 py-4 flex justify-between">
          <h1 className="font-bold text-lg">Attendance System</h1>
          <div className="space-x-4">
            <Link href="/upload" className="hover:underline">
              Upload
            </Link>
            <Link href="/report" className="hover:underline">
              Report
            </Link>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-sm">
          {children}
        </main>
      </body>
    </html>
  );
}