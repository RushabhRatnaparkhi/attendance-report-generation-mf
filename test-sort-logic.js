// Test script to verify the JCL SORT implementation
// Run this with: node test-sort-logic.js

import { processFixedLengthRecords, generateSampleData } from './lib/processData.js';

console.log('========================================');
console.log('  Testing JCL SORT Implementation');
console.log('========================================\n');

// Generate sample data
console.log('Step 1: Generating sample PS file...');
const sampleData = generateSampleData();
const lines = sampleData.split('\n');

console.log(`✅ Generated ${lines.length} records`);
console.log(`✅ Each record is ${lines[0].length} bytes\n`);

// Show first few records (before processing)
console.log('Sample Records (Before Processing):');
console.log('-----------------------------------');
for (let i = 0; i < 5; i++) {
  const record = lines[i];
  const primaryKey = record.substring(12, 20);
  console.log(`Record ${i + 1}: PK=[${primaryKey}] Data: ${record.substring(0, 40)}...`);
}
console.log('...\n');

// Process records
console.log('Step 2: Processing (Duplicate Removal + Sort)...');
const result = processFixedLengthRecords(sampleData);

console.log('✅ Processing Complete!\n');

// Show statistics
console.log('Statistics:');
console.log('-----------------------------------');
console.log(`Total Records:       ${result.totalRecords}`);
console.log(`Duplicates Removed:  ${result.duplicatesRemoved}`);
console.log(`Unique Records:      ${result.uniqueRecords}`);
console.log('');

// Verify duplicates were removed
const expectedDuplicates = 10;
const expectedUnique = 90;

if (result.duplicatesRemoved === expectedDuplicates) {
  console.log(`✅ PASS: Duplicates removed (${result.duplicatesRemoved}/${expectedDuplicates})`);
} else {
  console.log(`❌ FAIL: Expected ${expectedDuplicates} duplicates, got ${result.duplicatesRemoved}`);
}

if (result.uniqueRecords === expectedUnique) {
  console.log(`✅ PASS: Unique records (${result.uniqueRecords}/${expectedUnique})`);
} else {
  console.log(`❌ FAIL: Expected ${expectedUnique} unique records, got ${result.uniqueRecords}`);
}

// Verify sorting
console.log('\nStep 3: Verifying Sort Order...');
let sortedCorrectly = true;
for (let i = 1; i < result.processedRecords.length; i++) {
  const prev = result.processedRecords[i - 1].primaryKey;
  const curr = result.processedRecords[i].primaryKey;
  
  if (prev > curr) {
    console.log(`❌ FAIL: Sort order broken at index ${i}: ${prev} > ${curr}`);
    sortedCorrectly = false;
    break;
  }
}

if (sortedCorrectly) {
  console.log('✅ PASS: Records sorted correctly by primary key');
}

// Show first few sorted records
console.log('\nSample Sorted Records (After Processing):');
console.log('-----------------------------------');
for (let i = 0; i < 5; i++) {
  const record = result.processedRecords[i];
  console.log(`Record ${i + 1}: PK=[${record.primaryKey}] Data: ${record.data.columns_1_12}`);
}
console.log('...\n');

// Show last few sorted records
console.log('Last Few Records:');
console.log('-----------------------------------');
for (let i = result.processedRecords.length - 3; i < result.processedRecords.length; i++) {
  const record = result.processedRecords[i];
  console.log(`Record ${i + 1}: PK=[${record.primaryKey}] Data: ${record.data.columns_1_12}`);
}

console.log('\n========================================');
console.log('  All Tests Complete!');
console.log('========================================');
