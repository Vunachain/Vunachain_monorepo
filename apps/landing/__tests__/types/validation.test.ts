/**
 * Tests for type definitions and utilities
 *
 * Demonstrates testing TypeScript types and validation functions
 */

import { describe, it, expect } from 'vitest';

// Example utility functions that could be tested
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhoneNumber = (phone: string): boolean => {
  // Simple validation - just check if it starts with + and has digits
  return /^\+?[0-9\s\-()]{10,}$/.test(phone);
};

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@invalid.com')).toBe(false);
    });

    it('should reject emails with spaces', () => {
      expect(validateEmail('in valid@example.com')).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhoneNumber('+254712345678')).toBe(true);
      expect(validatePhoneNumber('0712345678')).toBe(true);
      expect(validatePhoneNumber('+1 (555) 123-4567')).toBe(true);
    });

    it('should reject short phone numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false);
    });
  });
});
