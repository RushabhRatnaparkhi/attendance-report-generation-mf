/**
 * Process data similar to JCL SORT functionality
 * - Extract primary key from columns 13-20 (0-indexed: 12-19)
 * - Remove duplicates based on primary key
 * - Sort records by primary key in ascending order
 */

export function processFixedLengthRecords(fileContent) {
  const lines = fileContent.split('\n').filter(line => line.length >= 80);
  
  // Parse records: each record is 80 bytes
  const records = lines.map(line => {
    // Ensure exactly 80 bytes
    const record = line.substring(0, 80).padEnd(80, ' ');
    
    // Extract primary key from columns 13-20 (0-indexed: 12-19)
    const primaryKey = record.substring(12, 20).trim();
    
    return {
      fullRecord: record,
      primaryKey: primaryKey,
      // Parse additional fields for display
      data: {
        columns_1_12: record.substring(0, 12).trim(),
        primaryKey: primaryKey,
        columns_21_80: record.substring(20, 80).trim(),
      }
    };
  });

  // Step 1: Remove duplicates based on primary key (keep first occurrence)
  const uniqueRecords = [];
  const seenKeys = new Set();
  
  for (const record of records) {
    if (!seenKeys.has(record.primaryKey)) {
      seenKeys.add(record.primaryKey);
      uniqueRecords.push(record);
    }
  }

  // Step 2: Sort by primary key (ascending order)
  uniqueRecords.sort((a, b) => {
    return a.primaryKey.localeCompare(b.primaryKey);
  });

  return {
    totalRecords: records.length,
    duplicatesRemoved: records.length - uniqueRecords.length,
    uniqueRecords: uniqueRecords.length,
    processedRecords: uniqueRecords
  };
}

/**
 * Generate sample PS file with 100 records (90 unique + 10 duplicates)
 * Each record is 80 bytes with primary key in columns 13-20
 */
export function generateSampleData() {
  const records = [];
  
  // Generate 90 unique records
  for (let i = 1; i <= 90; i++) {
    const primaryKey = `KEY${String(i).padStart(5, '0')}`; // e.g., KEY00001
    const prefix = `REC${String(i).padStart(4, '0')}`; // Columns 1-7
    const suffix = `DATA_${String(i).padStart(3, '0')}_END`; // After primary key
    
    // Build 80-byte record: [12 bytes prefix] + [8 bytes key] + [60 bytes suffix]
    const record = 
      prefix.padEnd(12, ' ') + 
      primaryKey.padEnd(8, ' ') + 
      suffix.padEnd(60, ' ');
    
    records.push(record.substring(0, 80));
  }
  
  // Add 10 duplicate records (duplicate keys from records 10, 20, 30, ..., 90)
  for (let i = 10; i <= 90; i += 10) {
    const primaryKey = `KEY${String(i).padStart(5, '0')}`;
    const prefix = `DUPL${String(i).padStart(4, '0')}`;
    const suffix = `DUPLICATE_${String(i).padStart(3, '0')}`;
    
    const record = 
      prefix.padEnd(12, ' ') + 
      primaryKey.padEnd(8, ' ') + 
      suffix.padEnd(60, ' ');
    
    records.push(record.substring(0, 80));
  }
  
  // Shuffle to randomize order (as per requirement)
  for (let i = records.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [records[i], records[j]] = [records[j], records[i]];
  }
  
  return records.join('\n');
}
