# 📊 Attendance Report Generation System
## Using Mainframe JCL SORT Logic with DB2 Integration

This project implements an **Attendance Report Generation System** that applies **mainframe-style JCL SORT processing** to manage and organize employee attendance data efficiently.

---

## 🎯 Project Overview

The system generates attendance reports using **JCL SORT methodology** - a classic mainframe approach for data processing that includes:
- **Duplicate elimination** (like `SUM FIELDS=NONE`)
- **Sorting by primary keys** (like `SORT FIELDS=(1,8,CH,A)`)
- **DB2 database integration** for persistent storage
- **Job tracking with return codes** (mimicking z/OS JCL jobs)

### Two Processing Modes

#### 1. 👥 **Attendance Mode** (Primary Use Case)
- **Purpose**: Generate employee attendance reports using JCL SORT logic
- **Input**: CSV files with attendance data (EmpID,Name,Date,Status,CheckIn,CheckOut)
- **Primary Key**: EmpID + Date combination
- **JCL SORT Applied**:
  - ✅ Remove duplicate entries for same employee on same date
  - ✅ Sort by Employee ID (primary, ascending)
  - ✅ Secondary sort by Date (ascending)
- **Output**: Clean, sorted attendance records stored in DB2

#### 2. 📋 **Assignment Mode** (Mainframe PS File Simulation)
- **Purpose**: Demonstrate pure mainframe PS file processing
- **Input**: 80-byte fixed-length PS (Physical Sequential) files
- **Primary Key**: Columns 13-20 (8 bytes)
- **JCL SORT Applied**:
  - ✅ Extract primary key from fixed column positions
  - ✅ Remove duplicate records based on primary key
  - ✅ Sort by primary key (ascending)
- **Output**: Sorted records demonstrating traditional JCL SORT functionality

---

## 🔧 JCL SORT Implementation Details

### Attendance Mode - JCL SORT Logic

The attendance processor applies mainframe-style sorting and deduplication:

```javascript
// lib/processAttendance.js

// Step 1: Duplicate Elimination (equivalent to SUM FIELDS=NONE)
const uniqueKey = `${empId}-${date}`; // Composite primary key
if (seenKeys.has(uniqueKey)) {
  duplicates++;
  continue; // Skip duplicate record
}
seenKeys.add(uniqueKey);

// Step 2: Sort by EmpID and Date (equivalent to SORT FIELDS=(1,8,CH,A,9,10,CH,A))
records.sort((a, b) => {
  // Primary sort: Employee ID (ascending)
  const empCompare = a.empId.localeCompare(b.empId);
  if (empCompare !== 0) return empCompare;
  
  // Secondary sort: Date (ascending)
  return a.date.localeCompare(b.date);
});
```

**Equivalent Mainframe JCL:**
```jcl
//SORTATT  EXEC PGM=SORT
//SORTIN   DD DSN=ATTENDANCE.CSV.DATA,DISP=SHR
//SORTOUT  DD DSN=ATTENDANCE.SORTED.DATA,DISP=(NEW,CATLG,DELETE)
//SYSIN    DD *
  SORT FIELDS=(1,8,CH,A,9,10,CH,A)
  SUM FIELDS=NONE
/*
```

### Assignment Mode - Traditional PS File Processing

```javascript
// lib/processData.js

// Extract primary key from columns 13-20 (0-indexed: 12-19)
const primaryKey = record.substring(12, 20).trim();

// Remove duplicates
if (!seenKeys.has(record.primaryKey)) {
  seenKeys.add(record.primaryKey);
  uniqueRecords.push(record);
}

// Sort by primary key (ascending)
uniqueRecords.sort((a, b) => {
  return a.primaryKey.localeCompare(b.primaryKey);
});
```

**Equivalent Mainframe JCL:**
```jcl
//SORTPS   EXEC PGM=SORT
//SORTIN   DD DSN=PS.FILE.INPUT,DISP=SHR
//SORTOUT  DD DSN=PS.FILE.SORTED,DISP=(NEW,CATLG,DELETE)
//SYSIN    DD *
  SORT FIELDS=(13,8,CH,A)
  SUM FIELDS=NONE
/*
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     WEB INTERFACE                            │
│              (Next.js 15 + React 19)                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
         ┌─────────▼─────────┐
         │  Mode Selection   │
         └─────────┬─────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐    ┌──────▼────────┐
│ Attendance     │    │  Assignment   │
│ Processor      │    │  Processor    │
│ (CSV)          │    │  (PS File)    │
└───────┬────────┘    └──────┬────────┘
        │                     │
        │  JCL SORT Logic     │  JCL SORT Logic
        │  Applied            │  Applied
        │                     │
┌───────▼─────────────────────▼────────┐
│         DB2 Database                 │
│  - EMPLOYEE_ATTENDANCE (sorted)      │
│  - ASSIGNMENT_RECORDS (sorted)       │
│  - UPLOAD_STATS (job tracking)       │
└──────────────────────────────────────┘
```

---

## 📦 Technology Stack

- **Frontend**: Next.js 15.5.4, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: IBM DB2 11.5.0.0a (Docker)
- **DB2 Connector**: ibm_db (native Node.js module)
- **Processing**: JCL SORT simulation in JavaScript

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker (for DB2 database)
- sudo access (for Docker operations)

### Installation

1. **Clone and install dependencies**:
```bash
cd attendance-report-system
npm install
```

2. **Start DB2 Database** (Docker):
```bash
sudo docker start db2server
# Or if first time:
sudo docker run -itd --name db2server --privileged=true \
  -p 50000:50000 \
  -e LICENSE=accept \
  -e DB2INST1_PASSWORD=password \
  -e DBNAME=SAMPLE \
  ibmcom/db2:11.5.0.0a
```

3. **Create Database Schema**:
```bash
# Connect to DB2
sudo docker exec -it db2server bash -c "su - db2inst1"
db2 connect to SAMPLE

# Run schema creation
db2 -tvf lib/db2-schema.sql
```

4. **Start Development Server**:
```bash
npm run dev
```

5. **Open Application**:
```
http://localhost:3000
```

---

## 📊 Usage Guide

### Processing Attendance Data

1. **Navigate to Upload Page**
2. **Select "Attendance Mode"**
3. **Download Sample CSV** (or create your own):
   ```csv
   EmpID,Name,Date,Status,CheckIn,CheckOut
   E001,John Doe,2025-01-15,Present,09:00,17:00
   E002,Jane Smith,2025-01-15,Late,09:15,17:00
   E001,John Doe,2025-01-15,Present,09:00,17:00
   ```
4. **Upload File** - System will:
   - Remove duplicate (line 3 is duplicate of line 1)
   - Sort by EmpID, then by Date
   - Store in DB2
5. **View Report** - See sorted, deduplicated attendance records

### Expected Output:
```
Employee ID | Name       | Date       | Status  | Check In | Check Out
------------------------------------------------------------------------
E001        | John Doe   | 2025-01-15 | Present | 09:00    | 17:00
E002        | Jane Smith | 2025-01-15 | Late    | 09:15    | 17:00
```
*Note: Records sorted by EmpID (E001 < E002)*

---

## 📈 Features

### ✅ JCL SORT Features Implemented

| Feature | Attendance Mode | Assignment Mode |
|---------|----------------|-----------------|
| Duplicate Elimination | ✅ By EmpID+Date | ✅ By Primary Key |
| Primary Sort Field | ✅ Employee ID | ✅ Columns 13-20 |
| Secondary Sort Field | ✅ Date | N/A |
| Fixed-Length Records | ❌ CSV format | ✅ 80 bytes |
| DB2 Storage | ✅ Yes | ✅ Yes |
| Job Tracking | ✅ Yes | ✅ Yes |
| Return Codes | ✅ CC 0000/0012 | ✅ CC 0000/0012 |

### 📋 Additional Features

- **Sample Data Generation**: Download test files for both modes
- **Job Statistics**: View processing metrics (total, duplicates, unique)
- **Job History**: Track all uploads with timestamps and status
- **Dual-Mode Interface**: Switch between Attendance and Assignment modes
- **Error Handling**: Proper error messages and return codes
- **Real-time Processing**: Immediate feedback on file upload

---

## 🗂️ Database Schema

### EMPLOYEE_ATTENDANCE
```sql
CREATE TABLE EMPLOYEE_ATTENDANCE (
    EMP_ID VARCHAR(20),
    EMP_NAME VARCHAR(100),
    ATTENDANCE_DATE DATE,
    STATUS VARCHAR(20),
    CHECK_IN_TIME VARCHAR(10),
    CHECK_OUT_TIME VARCHAR(10),
    UPLOAD_BATCH VARCHAR(50)
);
```

### ASSIGNMENT_RECORDS
```sql
CREATE TABLE ASSIGNMENT_RECORDS (
    RECORD_ID INTEGER GENERATED ALWAYS AS IDENTITY,
    PRIMARY_KEY VARCHAR(20),
    COLUMNS_1_12 VARCHAR(12),
    COLUMNS_21_80 VARCHAR(60),
    UPLOAD_BATCH VARCHAR(50)
);
```

### UPLOAD_STATS
```sql
CREATE TABLE UPLOAD_STATS (
    BATCH_ID VARCHAR(50) PRIMARY KEY,
    MODE VARCHAR(20),
    TOTAL_RECORDS INTEGER,
    DUPLICATES_REMOVED INTEGER,
    UNIQUE_RECORDS INTEGER,
    JOB_STATUS VARCHAR(20),
    RETURN_CODE INTEGER,
    UPLOAD_TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎓 Educational Value

This project demonstrates:

1. **Mainframe Concepts**:
   - JCL SORT logic and syntax
   - Fixed-length record processing
   - Primary key-based operations
   - Job tracking and return codes

2. **Modern Implementation**:
   - Web-based interface for mainframe concepts
   - JavaScript implementation of COBOL/JCL logic
   - DB2 integration (just like z/OS)
   - Real-time processing vs batch jobs

3. **Hybrid Approach**:
   - Combines traditional mainframe methodology
   - With modern web technologies
   - Demonstrates data processing concepts
   - Applicable to both legacy and modern systems

---

## 📝 Project Structure

```
attendance-report-system/
├── app/
│   ├── page.tsx                 # Home page
│   ├── upload/
│   │   └── page.tsx            # Upload interface
│   ├── report/
│   │   └── page.tsx            # Report viewer
│   └── api/
│       ├── upload/
│       │   └── route.js        # File upload handler
│       ├── report/
│       │   └── route.js        # Data fetcher
│       └── generate-sample/
│           └── route.js        # Sample file generator
├── lib/
│   ├── processAttendance.js    # Attendance processor (JCL SORT)
│   ├── processData.js          # Assignment processor (JCL SORT)
│   ├── db2.js                  # DB2 operations
│   └── db2-schema.sql          # Database schema
└── ARCHITECTURE_EXPLAINED.md   # Detailed architecture docs
```

---

## 🔍 How JCL SORT is Applied

### For Attendance CSV Files:

**Input** (unsorted, with duplicates):
```
E003,Mike,2025-01-16,Present,09:00,17:00
E001,John,2025-01-15,Present,09:00,17:00
E002,Jane,2025-01-15,Late,09:15,17:00
E001,John,2025-01-15,Present,09:00,17:00  ← DUPLICATE
E001,John,2025-01-16,Present,09:00,17:00
```

**Processing Steps**:
1. Parse CSV rows
2. Identify duplicates (E001 on 2025-01-15 appears twice)
3. Remove duplicates (keep first occurrence)
4. Sort by EmpID (E001, E002, E003)
5. Secondary sort by Date within same EmpID

**Output** (sorted, deduplicated):
```
E001,John,2025-01-15,Present,09:00,17:00  ← Sorted first (E001)
E001,John,2025-01-16,Present,09:00,17:00  ← Then by date
E002,Jane,2025-01-15,Late,09:15,17:00     ← Next EmpID
E003,Mike,2025-01-16,Present,09:00,17:00  ← Last EmpID
```

---

## 📌 Key Takeaways

- **Attendance reports** are generated using **JCL SORT logic**
- **Duplicates** are eliminated based on EmpID + Date (primary key)
- **Records** are sorted by Employee ID and Date (ascending)
- **DB2** stores the processed data (just like mainframes)
- **Two modes** demonstrate different aspects of JCL SORT processing
- **Job tracking** mimics mainframe JCL job submission and monitoring

---

## 🤝 Contributing

This is an educational project demonstrating mainframe concepts. Feel free to:
- Add more JCL SORT features
- Enhance the UI
- Add more sorting options
- Implement additional SORT parameters

---

## 📄 License

Educational project - Free to use and modify.

---

## 🙏 Acknowledgments

- IBM DB2 for database functionality
- Mainframe JCL SORT concepts
- Next.js and React for modern web interface

---

**Created for Attendance Report Generation using Mainframe Assignment Principles** 🎓
