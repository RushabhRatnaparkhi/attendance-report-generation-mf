# Mainframe Assignment - DB2 Setup Guide

## Assignment Overview
This project implements **Assignment #1** - JCL SORT simulation:
- Upload PS (Physical Sequential) files with 100 records (80 bytes each)
- Primary key in columns 13-20
- Remove duplicates (simulates `SUM FIELDS=NONE`)
- Sort by primary key (simulates `SORT FIELDS=(13,8,CH,A)`)
- Store results in local DB2 database

## Prerequisites

### 1. Install DB2 Express-C (Local DB2 Instance)

#### For Linux:
```bash
# Download DB2 Express-C from IBM website
# Or use Docker:
docker pull ibmcom/db2:11.5.0.0a

# Run DB2 container
docker run -itd \
  --name db2server \
  --privileged=true \
  -p 50000:50000 \
  -e LICENSE=accept \
  -e DB2INST1_PASSWORD=password \
  -e DBNAME=SAMPLE \
  ibmcom/db2:11.5.0.0a
```

#### For Windows:
1. Download DB2 Express-C from IBM
2. Install following the wizard
3. Create database named `SAMPLE`

### 2. Install Node.js Dependencies

```bash
cd attendance-report-system

# Install main dependencies
npm install

# Install DB2 driver (ibm_db)
# Note: This requires build tools
npm install ibm_db
```

#### Build Tools Required for ibm_db:
- **Linux**: `sudo apt-get install build-essential python3`
- **Windows**: Install Visual Studio Build Tools
- **macOS**: Install Xcode Command Line Tools

### 3. Configure DB2 Connection

Edit `lib/db2.js` and update connection string:

```javascript
const connStr = "DATABASE=SAMPLE;HOSTNAME=localhost;UID=db2inst1;PWD=password;PORT=50000;PROTOCOL=TCPIP";
```

Or use environment variable:
```bash
export DB2_CONNECTION_STRING="DATABASE=SAMPLE;HOSTNAME=localhost;UID=db2inst1;PWD=password;PORT=50000;PROTOCOL=TCPIP"
```

### 4. Create Database Schema

Connect to DB2 and run the schema:

```bash
# Connect to DB2
db2 connect to SAMPLE user db2inst1

# Run schema file
db2 -tvf lib/db2-schema.sql

# Verify tables created
db2 "SELECT TABNAME FROM SYSCAT.TABLES WHERE TABSCHEMA='DB2INST1'"
```

Or manually:
```sql
-- Create tables
CREATE TABLE ATTENDANCE_RECORDS (
    RECORD_ID INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    PRIMARY_KEY VARCHAR(8) NOT NULL,
    COLUMNS_1_12 VARCHAR(12),
    COLUMNS_21_80 VARCHAR(60),
    FULL_RECORD VARCHAR(80) NOT NULL,
    UPLOAD_BATCH VARCHAR(50),
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE UPLOAD_STATS (
    STAT_ID INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    BATCH_ID VARCHAR(50) NOT NULL,
    TOTAL_RECORDS INTEGER,
    DUPLICATES_REMOVED INTEGER,
    UNIQUE_RECORDS INTEGER,
    JOB_STATUS VARCHAR(20),
    RETURN_CODE INTEGER,
    UPLOAD_TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Running the Application

### 1. Start Development Server
```bash
cd attendance-report-system
npm run dev
```

### 2. Access the Application
Open browser: http://localhost:3000

## How to Use

### Option 1: Use Sample Data
1. Go to **Upload** page
2. Click **"Download Sample"** button
3. This generates a file with:
   - 100 total records
   - 90 unique records
   - 10 duplicate records
   - Random order
4. Upload the downloaded file
5. View processing statistics

### Option 2: Create Your Own PS File
Create a text file with 80-byte records:

```
REC0001     KEY00001DATA_001_END                                        
REC0002     KEY00002DATA_002_END                                        
REC0003     KEY00003DATA_003_END                                        
...
DUPL0010    KEY00001DUPLICATE_001                                       
```

Format:
- Columns 1-12: Any data
- Columns 13-20: Primary key (8 characters)
- Columns 21-80: Any data

## Testing the Assignment

### Test Case 1: Duplicate Removal
1. Download sample file (has 10 duplicates)
2. Upload file
3. Verify statistics show:
   - Total Records: 100
   - Duplicates Removed: 10
   - Unique Records: 90

### Test Case 2: Sorting
1. View Report page
2. Verify records are sorted by PRIMARY_KEY column
3. Check that keys are in ascending order

### Test Case 3: DB2 Storage
```sql
-- Connect to DB2
db2 connect to SAMPLE

-- Check record count
db2 "SELECT COUNT(*) FROM ATTENDANCE_RECORDS"

-- View sorted records
db2 "SELECT PRIMARY_KEY, COLUMNS_1_12 FROM ATTENDANCE_RECORDS ORDER BY PRIMARY_KEY"

-- Check job statistics
db2 "SELECT * FROM UPLOAD_STATS"
```

## Understanding the JCL Simulation

### Original JCL SORT:
```jcl
//SORTJOB JOB (ACCT),'SORT',CLASS=A,MSGCLASS=A
//STEP1 EXEC PGM=SORT
//SYSOUT DD SYSOUT=*
//SORTIN DD DSN=INPUT.PS.FILE,DISP=SHR
//SORTOUT DD DSN=OUTPUT.PS.FILE,DISP=(NEW,CATLG,DELETE)
//SYSIN DD *
 SORT FIELDS=(13,8,CH,A)
 SUM FIELDS=NONE
/*
```

### Our Implementation:
- **SORT FIELDS=(13,8,CH,A)**: We sort by columns 13-20, character format, ascending
- **SUM FIELDS=NONE**: We remove duplicate records based on primary key
- **Job submission**: Simulated with job name and return codes

## Project Structure

```
attendance-report-system/
├── app/
│   ├── api/
│   │   ├── upload/route.js          # Handles file upload & processing
│   │   ├── report/route.js          # Fetches data from DB2
│   │   └── generate-sample/route.js # Generates test data
│   ├── upload/page.tsx              # Upload interface
│   ├── report/page.tsx              # Report viewer
│   └── page.tsx                     # Home page
├── lib/
│   ├── db2.js                       # DB2 connection & queries
│   ├── processData.js               # JCL SORT simulation logic
│   └── db2-schema.sql               # Database schema
└── package.json
```

## Troubleshooting

### DB2 Connection Error
```
Error: [IBM][CLI Driver] SQL1013N  The database alias name or database name "SAMPLE" could not be found.
```
**Solution**: Create the database first:
```bash
db2 create database SAMPLE
```

### ibm_db Installation Fails
**Solution**: Install build tools first, then try again:
```bash
# Linux
sudo apt-get install build-essential python3

# Then retry
npm install ibm_db
```

### No Records Showing
**Solution**: Check DB2 connection and run schema:
```bash
db2 connect to SAMPLE
db2 -tvf lib/db2-schema.sql
```

## Next Steps: Hybrid Approach

To make this more "mainframe-like", you could add:

1. **JCL Generation**: Generate actual JCL that could be submitted to z/OS
2. **Job Monitoring**: Simulate job queue, status checking
3. **SDSF-like Interface**: Show job output, sysout, etc.
4. **z/OS Integration**: Use z/OSMF REST APIs to actually submit jobs
5. **Dataset Management**: Simulate PS file allocation, cataloging

Would you like me to implement any of these enhancements?
