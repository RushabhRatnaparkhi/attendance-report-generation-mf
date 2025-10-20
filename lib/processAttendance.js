/**
 * Process attendance data from CSV format
 * Expected format: EmpID,Name,Date,Status
 * or: EmpID,Name,Date,Status,CheckIn,CheckOut
 */

export function processAttendanceCSV(fileContent) {
  const lines = fileContent.split('\n').filter(line => line.trim());
  
  // Skip header if present
  const hasHeader = lines[0].toLowerCase().includes('emp') || 
                    lines[0].toLowerCase().includes('name');
  const dataLines = hasHeader ? lines.slice(1) : lines;
  
  const records = [];
  const seenKeys = new Set(); // For duplicate detection (EmpID + Date)
  let duplicates = 0;
  
  for (const line of dataLines) {
    const parts = line.split(',').map(p => p.trim());
    
    if (parts.length < 4) continue; // Skip invalid lines
    
    const [empId, empName, date, status, checkIn, checkOut] = parts;
    
    // Create unique key for duplicate detection
    const uniqueKey = `${empId}-${date}`;
    
    if (seenKeys.has(uniqueKey)) {
      duplicates++;
      continue; // Skip duplicate
    }
    
    seenKeys.add(uniqueKey);
    
    records.push({
      empId: empId || 'UNKNOWN',
      empName: empName || 'Unknown Employee',
      date: date || new Date().toISOString().split('T')[0],
      status: status || 'Unknown',
      checkIn: checkIn || null,
      checkOut: checkOut || null
    });
  }
  
  return {
    totalRecords: dataLines.length,
    duplicatesRemoved: duplicates,
    uniqueRecords: records.length,
    processedRecords: records
  };
}

/**
 * Generate sample attendance data
 */
export function generateSampleAttendance() {
  const employees = [
    { id: 'E001', name: 'John Doe' },
    { id: 'E002', name: 'Jane Smith' },
    { id: 'E003', name: 'Mike Johnson' },
    { id: 'E004', name: 'Sarah Williams' },
    { id: 'E005', name: 'David Brown' },
    { id: 'E006', name: 'Emily Davis' },
    { id: 'E007', name: 'Robert Miller' },
    { id: 'E008', name: 'Lisa Wilson' },
    { id: 'E009', name: 'James Moore' },
    { id: 'E010', name: 'Mary Taylor' }
  ];
  
  const statuses = ['Present', 'Absent', 'Late', 'Half-Day'];
  const records = ['EmpID,Name,Date,Status,CheckIn,CheckOut'];
  
  // Generate records for last 5 days
  for (let day = 0; day < 5; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().split('T')[0];
    
    for (const emp of employees) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const checkIn = status !== 'Absent' ? '09:00' : '';
      const checkOut = status !== 'Absent' ? '17:00' : '';
      
      records.push(`${emp.id},${emp.name},${dateStr},${status},${checkIn},${checkOut}`);
    }
  }
  
  // Add some duplicates (for testing)
  records.push(`E001,John Doe,${new Date().toISOString().split('T')[0]},Present,09:00,17:00`);
  records.push(`E002,Jane Smith,${new Date().toISOString().split('T')[0]},Present,09:00,17:00`);
  
  return records.join('\n');
}
