# How the System Works

## 🎯 Two Independent Modes

This application has **TWO completely separate modes** that don't affect each other:

### 👥 Attendance Mode
**Purpose**: Process employee attendance CSV files  
**Use Case**: Track employee attendance, check-ins, and check-outs

**How it works:**
1. Upload a CSV file with columns: `EmpID,Name,Date,Status,CheckIn,CheckOut`
2. System removes duplicates based on `EmpID + Date` combination
3. Stores clean data in `EMPLOYEE_ATTENDANCE` table
4. Displays attendance report with status indicators (Present/Absent/Late)

**Example CSV:**
```csv
EmpID,Name,Date,Status,CheckIn,CheckOut
E001,John Doe,2025-01-15,Present,09:00,17:00
E002,Jane Smith,2025-01-15,Late,09:15,17:00
```

---

### 📋 Assignment Mode (JCL SORT Simulation)
**Purpose**: Simulate mainframe JCL SORT processing for your assignment  
**Use Case**: Process fixed-length PS (Physical Sequential) files like on a mainframe

**How it works:**
1. Upload a text file with 80-byte fixed-length records
2. System extracts **primary key from columns 13-20** (positions 12-19 in 0-indexed)
3. Removes duplicate records (same primary key)
4. **Sorts records by primary key in ascending order**
5. Stores processed data in `ASSIGNMENT_RECORDS` table
6. Displays sorted records showing the primary key extraction

**Example PS File (80 bytes per line):**
```
123456789012PKEY0001Rest of the record data padded to 80 bytes total............
123456789012PKEY0002Another record with different key data here.................
123456789012PKEY0001Duplicate - will be removed.................................
```

---

## 🔄 How They DON'T Affect Each Other

### Separate Database Tables
- **Attendance Mode** → `EMPLOYEE_ATTENDANCE` table
- **Assignment Mode** → `ASSIGNMENT_RECORDS` table
- **Both tracked in** → `UPLOAD_STATS` table (with MODE column to differentiate)

### Separate Processing Logic
- **Attendance**: Uses `lib/processAttendance.js` → CSV parsing
- **Assignment**: Uses `lib/processData.js` → JCL SORT simulation (fixed-length records)

### Independent Reports
- Switch between modes using the buttons at the top of the report page
- Each mode shows its own data from its own table
- Job history shows which mode was used for each upload

---

## 📊 What Happens When You Upload

### Attendance Upload Flow:
1. **Upload CSV** → `processAttendanceCSV()` function
2. **Parse CSV** → Extract EmpID, Name, Date, Status, CheckIn, CheckOut
3. **Remove Duplicates** → Keep only unique EmpID+Date combinations
4. **Insert to DB** → `EMPLOYEE_ATTENDANCE` table
5. **View Report** → Display in attendance table format

### Assignment Upload Flow:
1. **Upload PS File** → `processFixedLengthRecords()` function
2. **Extract Data**:
   - Columns 1-12 (first 12 bytes)
   - **Columns 13-20 (PRIMARY KEY)** ← Used for duplicate detection
   - Columns 21-80 (remaining 60 bytes)
3. **Remove Duplicates** → Keep only unique primary keys
4. **Sort by Primary Key** → Ascending order (like JCL SORT)
5. **Insert to DB** → `ASSIGNMENT_RECORDS` table
6. **View Report** → Display with primary key highlighted

---

## 🎓 For Your Assignment

The **Assignment Mode** specifically implements:
- ✅ Reading 80-byte fixed-length records (like mainframe PS files)
- ✅ Primary key in columns 13-20 (as per your assignment requirement)
- ✅ Duplicate removal based on primary key
- ✅ Sorting by primary key (JCL SORT simulation)
- ✅ DB2 database storage
- ✅ Job status tracking (like mainframe JCL jobs)

The **Attendance Mode** is just a user-friendly bonus feature for real-world attendance tracking!

---

## 💡 Quick Test

1. **Start the app**: http://localhost:3000
2. **Go to Upload page**
3. **Try Attendance Mode**:
   - Click "Attendance Mode"
   - Download sample CSV
   - Upload it
   - View attendance report
4. **Try Assignment Mode**:
   - Click "Assignment Mode"
   - Download sample PS file
   - Upload it
   - View assignment report (notice sorted primary keys!)
5. **Check Job History tab** to see both uploads tracked separately

---

## 🔧 Technical Details

### Database Schema:
```sql
-- Attendance Table
EMPLOYEE_ATTENDANCE (
    EMP_ID, EMP_NAME, ATTENDANCE_DATE, STATUS, 
    CHECK_IN_TIME, CHECK_OUT_TIME, UPLOAD_BATCH
)

-- Assignment Table  
ASSIGNMENT_RECORDS (
    RECORD_ID, PRIMARY_KEY, COLUMNS_1_12, 
    COLUMNS_21_80, UPLOAD_BATCH
)

-- Statistics Table (tracks both modes)
UPLOAD_STATS (
    BATCH_ID, MODE, TOTAL_RECORDS, DUPLICATES_REMOVED,
    UNIQUE_RECORDS, JOB_STATUS, RETURN_CODE, UPLOAD_TIMESTAMP
)
```

### Key Point:
The `MODE` column in `UPLOAD_STATS` keeps track of which processing mode was used, ensuring complete separation between attendance and assignment data!
