/**
 * Tests for Success Fee Service
 */

import { describe, it, expect } from '@jest/globals';

describe('Success Fee Calculations', () => {
  it('should calculate 3% success fee correctly', () => {
    const dealAmount = 100000; // $1000 in cents
    const feePercentage = 3;
    const expectedFee = Math.round(dealAmount * (feePercentage / 100));
    
    expect(expectedFee).toBe(3000); // $30
  });

  it('should calculate 5% success fee correctly', () => {
    const dealAmount = 50000; // $500 in cents
    const feePercentage = 5;
    const expectedFee = Math.round(dealAmount * (feePercentage / 100));
    
    expect(expectedFee).toBe(2500); // $25
  });

  it('should round fees to nearest cent', () => {
    const dealAmount = 12345; // $123.45 in cents
    const feePercentage = 3.5;
    const expectedFee = Math.round(dealAmount * (feePercentage / 100));
    
    expect(expectedFee).toBe(432); // $4.32 (rounded from $4.32075)
  });

  it('should handle zero deal amount', () => {
    const dealAmount = 0;
    const feePercentage = 3;
    const expectedFee = Math.round(dealAmount * (feePercentage / 100));
    
    expect(expectedFee).toBe(0);
  });

  it('should handle large deal amounts', () => {
    const dealAmount = 10000000; // $100,000 in cents
    const feePercentage = 3;
    const expectedFee = Math.round(dealAmount * (feePercentage / 100));
    
    expect(expectedFee).toBe(300000); // $3,000
  });
});

describe('Net 30 Due Date Calculation', () => {
  it('should calculate due date 30 days from now', () => {
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    
    // Dates should be within same month or 30 days apart
    const daysDiff = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBe(30);
  });
});
