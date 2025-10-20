# 🏗️ Architecture: How JCL SORT and Attendance Are SEPARATE

## ❌ **IMPORTANT: We are NOT using JCL SORT for attendance!**

They are **two completely independent processing pipelines** that share nothing except the UI and database.

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         UPLOAD PAGE                              │
│                                                                   │
│  User selects MODE:  [Attendance] or [Assignment]               │
└────────────┬────────────────────────────┬────────────────────────┘
             │                            │
             │                            │
    ┌────────▼────────┐         ┌────────▼────────┐
    │  ATTENDANCE     │         │  ASSIGNMENT     │
    │     MODE        │         │     MODE        │
    │  (CSV Files)    │         │  (PS Files)     │
    └────────┬────────┘         └────────┬────────┘
             │                            │
             │                            │
┌────────────▼──────────┐    ┌───────────▼──────────┐
│ processAttendanceCSV()│    │processFixedLength    │
│                       │    │    Records()         │
│ • Parse CSV rows      │    │ • Extract cols 13-20 │
│ • Find EmpID+Date     │    │ • Remove duplicates  │
│   duplicates          │    │ • SORT by primary key│
│ • Remove duplicates   │    │   (JCL SORT logic)   │
│ • NO sorting needed!  │    └──────────┬───────────┘
└───────────┬───────────┘               │
            │                            │
            │                            │
┌───────────▼────────────┐  ┌───────────▼────────────┐
│ insertAttendanceRecords│  │ insertAssignmentRecords│
│                        │  │                        │
│ Stores in:             │  │ Stores in:             │
│ EMPLOYEE_ATTENDANCE    │  │ ASSIGNMENT_RECORDS     │
│                        │  │                        │
│ Columns:               │  │ Columns:               │
│ • EMP_ID               │  │ • RECORD_ID            │
│ • EMP_NAME             │  │ • PRIMARY_KEY ← sorted!│
│ • ATTENDANCE_DATE      │  │ • COLUMNS_1_12         │
│ • STATUS               │  │ • COLUMNS_21_80        │
│ • CHECK_IN_TIME        │  │ • UPLOAD_BATCH         │
│ • CHECK_OUT_TIME       │  │                        │
└────────────────────────┘  └────────────────────────┘
```

---

## 🔍 Detailed Comparison

### 👥 ATTENDANCE MODE

**File Type:** CSV (Comma-Separated Values)

**Example Input:**
```csv
EmpID,Name,Date,Status,CheckIn,CheckOut
E001,John Doe,2025-01-15,Present,09:00,17:00
E002,Jane Smith,2025-01-15,Late,09:15,17:00
E001,John Doe,2025-01-15,Present,09:00,17:00  ← DUPLICATE!
```

**Processing Steps:**
1. **Parse CSV** - Split by commas, extract fields
2. **Detect Duplicates** - Using `EmpID + Date` as key
3. **Remove Duplicates** - Keep first occurrence
4. **NO SORTING** - Order doesn't matter for attendance!
5. **Store** - Insert into `EMPLOYEE_ATTENDANCE` table

**Processing Function:** `processAttendanceCSV()` in `lib/processAttendance.js`

**Code Logic:**
```javascript
// Create unique key for duplicate detection
const uniqueKey = `${empId}-${date}`;  // e.g., "E001-2025-01-15"

if (seenKeys.has(uniqueKey)) {
  duplicates++;
  continue; // Skip duplicate
}

// NO SORTING - just remove duplicates!
```

---

### 📋 ASSIGNMENT MODE (JCL SORT Simulation)

**File Type:** Fixed-length text (80 bytes per line)

**Example Input:**
```
REC0001     KEY00045  DATA_001_END                                            
REC0002     KEY00012  DATA_002_END                                            
REC0003     KEY00045  DATA_003_END                                 ← DUPLICATE!
REC0004     KEY00003  DATA_004_END                                            
Columns:    1----12   13---20   21----------------------------------80
            ^prefix   ^KEY      ^suffix
```

**Processing Steps:**
1. **Extract Primary Key** - Columns 13-20 (positions 12-19)
2. **Detect Duplicates** - Using primary key (e.g., "KEY00045")
3. **Remove Duplicates** - Keep first occurrence
4. **⭐ SORT BY PRIMARY KEY** - Ascending order (JCL SORT logic!)
5. **Store** - Insert into `ASSIGNMENT_RECORDS` table

**Processing Function:** `processFixedLengthRecords()` in `lib/processData.js`

**Code Logic:**
```javascript
// Extract primary key from columns 13-20 (0-indexed: 12-19)
const primaryKey = record.substring(12, 20).trim();  // e.g., "KEY00045"

// Remove duplicates
if (!seenKeys.has(record.primaryKey)) {
  seenKeys.add(record.primaryKey);
  uniqueRecords.push(record);
}

// ⭐ SORT BY PRIMARY KEY (like JCL SORT)
uniqueRecords.sort((a, b) => {
  return a.primaryKey.localeCompare(b.primaryKey);
});
// After sorting: KEY00003, KEY00012, KEY00045
```

---

## 🎯 Why They're Separate

### Different Use Cases

| Feature | Attendance Mode | Assignment Mode |
|---------|----------------|-----------------|
| **Purpose** | Track employee attendance | Mainframe assignment simulation |
| **File Format** | CSV (variable length) | PS file (80-byte fixed) |
| **Duplicate Key** | EmpID + Date | Primary Key (cols 13-20) |
| **Sorting** | ❌ NOT sorted | ✅ Sorted by primary key |
| **JCL SORT** | ❌ Not used | ✅ Simulated |
| **Real World** | HR/Attendance system | Mainframe batch processing |

### Different Code Paths

```javascript
// In app/api/upload/route.js
if (mode === 'attendance') {
  // Use attendance processor - NO JCL SORT!
  result = processAttendanceCSV(fileContent);
  insertedCount = await insertAttendanceRecords(result.processedRecords, batchId);
  
} else {
  // Use assignment processor - WITH JCL SORT simulation!
  result = processFixedLengthRecords(fileContent);
  insertedCount = await insertAssignmentRecords(result.processedRecords, batchId);
}
```

---

## 📈 Result Comparison

### Attendance Report Output:
```
┌──────────┬─────────────┬────────────┬─────────┬──────────┬───────────┐
│ Emp ID   │ Name        │ Date       │ Status  │ Check In │ Check Out │
├──────────┼─────────────┼────────────┼─────────┼──────────┼───────────┤
│ E001     │ John Doe    │ 2025-01-15 │ Present │ 09:00    │ 17:00     │
│ E002     │ Jane Smith  │ 2025-01-15 │ Late    │ 09:15    │ 17:00     │
│ E003     │ Mike J.     │ 2025-01-16 │ Absent  │ -        │ -         │
└──────────┴─────────────┴────────────┴─────────┴──────────┴───────────┘

❌ NOT sorted by anything
✅ Just displays unique attendance records
```

### Assignment Report Output:
```
┌───────────┬──────────────┬──────────────┬────────────────────────┐
│ Record ID │ Primary Key  │ Columns 1-12 │ Columns 21-80          │
├───────────┼──────────────┼──────────────┼────────────────────────┤
│ 1         │ KEY00003     │ REC0004      │ DATA_004_END...        │
│ 2         │ KEY00012     │ REC0002      │ DATA_002_END...        │
│ 3         │ KEY00045     │ REC0001      │ DATA_001_END...        │
└───────────┴──────────────┴──────────────┴────────────────────────┘
            ↑ SORTED!
            
✅ Sorted by Primary Key in ascending order
✅ JCL SORT simulation applied
✅ Notice: KEY00003 < KEY00012 < KEY00045
```

---

## 🎓 For Your Assignment

**Your assignment requires JCL SORT functionality**, which is **ONLY implemented in Assignment Mode**:

### Assignment Requirements ✅
- ✅ Read 80-byte fixed-length records
- ✅ Primary key in columns 13-20
- ✅ Remove duplicates based on primary key
- ✅ **Sort by primary key** (JCL SORT simulation)
- ✅ Store in DB2
- ✅ Display sorted results

### Attendance Mode 🎁
- This is a **bonus feature** for real-world use
- Does NOT use JCL SORT logic
- Just removes duplicates, no sorting
- Completely independent from your assignment

---

## 🚀 Quick Test to See the Difference

1. **Upload Attendance CSV:**
   - Notice records appear in **any order**
   - No sorting by name or date
   - Just unique records

2. **Upload Assignment PS File:**
   - Notice records are **sorted by PRIMARY_KEY column**
   - Example order: KEY00001, KEY00002, KEY00003...
   - This is the JCL SORT simulation!

---

## 💡 Key Takeaway

```
Attendance Mode  →  Simple duplicate removal  →  NO JCL SORT
Assignment Mode  →  Duplicate removal + Sorting  →  YES JCL SORT ✅
```

**They share only the UI and database, but have completely different processing logic!**
