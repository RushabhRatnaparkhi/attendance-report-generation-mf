import ibmdb from "ibm_db";

// DB2 Connection String - Update with your local DB2 credentials
const connStr = process.env.DB2_CONNECTION_STRING || 
  "DATABASE=SAMPLE;HOSTNAME=localhost;UID=db2inst1;PWD=password;PORT=50000;PROTOCOL=TCPIP";

/**
 * Connect to DB2 database
 * @returns {Promise<Connection>} DB2 connection object
 */
export async function connectDB2() {
  try {
    const conn = await ibmdb.open(connStr);
    console.log("✅ DB2 connection successful");
    return conn;
  } catch (err) {
    console.error("❌ DB2 connection failed:", err);
    throw err;
  }
}

/**
 * Insert processed PS file records into DB2 (Assignment Mode)
 * @param {Array} records - Array of processed record objects
 * @param {string} batchId - Unique batch identifier
 * @returns {Promise<number>} Number of records inserted
 */
export async function insertAssignmentRecords(records, batchId) {
  const conn = await connectDB2();
  
  try {
    let insertedCount = 0;
    
    for (const record of records) {
      const sql = `
        INSERT INTO ASSIGNMENT_RECORDS 
        (PRIMARY_KEY, COLUMNS_1_12, COLUMNS_21_80, FULL_RECORD, UPLOAD_BATCH) 
        VALUES (?, ?, ?, ?, ?)
      `;
      
      await conn.query(sql, [
        record.primaryKey,
        record.data.columns_1_12,
        record.data.columns_21_80,
        record.fullRecord,
        batchId
      ]);
      
      insertedCount++;
    }
    
    return insertedCount;
  } finally {
    await conn.close();
  }
}

/**
 * Insert attendance records into DB2 (Attendance Mode)
 * @param {Array} records - Array of attendance record objects
 * @param {string} batchId - Unique batch identifier
 * @returns {Promise<number>} Number of records inserted
 */
export async function insertAttendanceRecords(records, batchId) {
  const conn = await connectDB2();
  
  try {
    let insertedCount = 0;
    
    for (const record of records) {
      const sql = `
        INSERT INTO EMPLOYEE_ATTENDANCE 
        (EMP_ID, EMP_NAME, ATTENDANCE_DATE, STATUS, CHECK_IN_TIME, CHECK_OUT_TIME, UPLOAD_BATCH) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      await conn.query(sql, [
        record.empId,
        record.empName,
        record.date,
        record.status,
        record.checkIn,
        record.checkOut,
        batchId
      ]);
      
      insertedCount++;
    }
    
    return insertedCount;
  } finally {
    await conn.close();
  }
}

/**
 * Insert upload statistics
 * @param {Object} stats - Statistics object
 * @returns {Promise<void>}
 */
export async function insertUploadStats(stats) {
  const conn = await connectDB2();
  
  try {
    const sql = `
      INSERT INTO UPLOAD_STATS 
      (BATCH_ID, MODE, TOTAL_RECORDS, DUPLICATES_REMOVED, UNIQUE_RECORDS, JOB_STATUS, RETURN_CODE) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await conn.query(sql, [
      stats.batchId,
      stats.mode || 'UNKNOWN',
      stats.totalRecords,
      stats.duplicatesRemoved,
      stats.uniqueRecords,
      stats.jobStatus,
      stats.returnCode
    ]);
  } finally {
    await conn.close();
  }
}

/**
 * Fetch all records from DB2
 * @param {string} mode - 'attendance' or 'assignment'
 * @param {string} batchId - Optional batch ID to filter
 * @returns {Promise<Array>} Array of records
 */
export async function fetchRecords(mode = 'attendance', batchId = null) {
  const conn = await connectDB2();
  
  try {
    let sql, table;
    
    if (mode === 'attendance') {
      table = 'EMPLOYEE_ATTENDANCE';
      sql = `SELECT * FROM ${table}`;
    } else {
      table = 'ASSIGNMENT_RECORDS';
      sql = `SELECT * FROM ${table}`;
    }
    
    const params = [];
    
    if (batchId) {
      sql += " WHERE UPLOAD_BATCH = ?";
      params.push(batchId);
    }
    
    if (mode === 'attendance') {
      sql += " ORDER BY ATTENDANCE_DATE DESC, EMP_ID ASC";
    } else {
      sql += " ORDER BY PRIMARY_KEY ASC";
    }
    
    const data = await conn.query(sql, params);
    return data;
  } finally {
    await conn.close();
  }
}

/**
 * Fetch upload statistics
 * @param {string} mode - Optional mode filter
 * @returns {Promise<Array>} Array of upload stats
 */
export async function fetchUploadStats(mode = null) {
  const conn = await connectDB2();
  
  try {
    let sql = "SELECT * FROM UPLOAD_STATS";
    const params = [];
    
    if (mode) {
      sql += " WHERE MODE = ?";
      params.push(mode);
    }
    
    sql += " ORDER BY UPLOAD_TIMESTAMP DESC";
    
    const data = await conn.query(sql, params);
    return data;
  } finally {
    await conn.close();
  }
}
