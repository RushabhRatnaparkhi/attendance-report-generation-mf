#!/bin/bash

# Setup script for Mainframe Assignment System
# This script helps set up DB2 and initialize the database

echo "=========================================="
echo "  Mainframe Assignment Setup Script"
echo "=========================================="
echo ""

# Check if DB2 is installed
if ! command -v db2 &> /dev/null
then
    echo "⚠️  DB2 command not found."
    echo ""
    echo "Please install DB2 first:"
    echo "  Option 1: Use Docker:"
    echo "    docker pull ibmcom/db2:11.5.0.0a"
    echo "    docker run -itd --name db2server --privileged=true \\"
    echo "      -p 50000:50000 -e LICENSE=accept \\"
    echo "      -e DB2INST1_PASSWORD=password \\"
    echo "      -e DBNAME=SAMPLE \\"
    echo "      ibmcom/db2:11.5.0.0a"
    echo ""
    echo "  Option 2: Install DB2 Express-C locally"
    echo "    Visit: https://www.ibm.com/products/db2/developers"
    echo ""
    exit 1
fi

# Check if SAMPLE database exists
echo "📊 Checking DB2 database..."
db2 list database directory | grep -q "SAMPLE"

if [ $? -ne 0 ]; then
    echo "❌ Database 'SAMPLE' not found. Creating it..."
    db2 create database SAMPLE
    echo "✅ Database 'SAMPLE' created successfully!"
else
    echo "✅ Database 'SAMPLE' already exists."
fi

# Connect to database
echo ""
echo "🔌 Connecting to database..."
db2 connect to SAMPLE user db2inst1

if [ $? -ne 0 ]; then
    echo "❌ Failed to connect to database. Please check credentials."
    exit 1
fi

echo "✅ Connected to SAMPLE database!"

# Run schema
echo ""
echo "📋 Creating tables..."
cd attendance-report-system
db2 -tvf lib/db2-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Tables created successfully!"
else
    echo "⚠️  Some errors occurred. Tables might already exist."
fi

# Verify tables
echo ""
echo "🔍 Verifying tables..."
db2 "SELECT TABNAME FROM SYSCAT.TABLES WHERE TABSCHEMA='DB2INST1' AND (TABNAME='ATTENDANCE_RECORDS' OR TABNAME='UPLOAD_STATS')"

# Disconnect
db2 connect reset

echo ""
echo "=========================================="
echo "  ✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. cd attendance-report-system"
echo "2. npm install"
echo "3. npm run dev"
echo "4. Open http://localhost:3000"
echo ""
echo "Happy coding! 🚀"
