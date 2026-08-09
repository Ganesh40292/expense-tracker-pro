import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatCurrency, convertCurrency } from './formatCurrency';

describe('formatCurrency util', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formats USD correctly', () => {
    const result = formatCurrency(1000, 'en-US', 'USD');
    // Using string matching to avoid precise invisible character mismatch
    expect(result).toMatch(/\$1,000\.00/);
  });

  it('formats INR correctly without locale explicitly passed', () => {
    const result = formatCurrency(50000, null, 'INR');
    expect(result).toContain('50,000.00');
  });

  it('falls back to localStorage if no currency provided', () => {
    localStorage.setItem('user', JSON.stringify({ defaultCurrency: 'GBP' }));
    const result = formatCurrency(1500);
    expect(result).toContain('1,500.00');
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('user', 'invalid-json');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const result = formatCurrency(100);
    
    expect(consoleSpy).toHaveBeenCalled();
    // Falls back to INR by default
    expect(result).toContain('100.00');
  });
});

describe('convertCurrency util', () => {
  it('converts USD to INR correctly', () => {
    // baseAmount is essentially assumed to be USD in this function based on implementation
    const result = convertCurrency(100, 'INR');
    expect(result).toBe(8350);
  });

  it('defaults to INR if no target currency provided', () => {
    const result = convertCurrency(1);
    expect(result).toBe(83.50);
  });

  it('handles unknown currency by returning base amount', () => {
    const result = convertCurrency(500, 'XYZ');
    expect(result).toBe(500);
  });
});
