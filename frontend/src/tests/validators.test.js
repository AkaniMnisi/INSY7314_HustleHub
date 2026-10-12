import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateConfirmPassword,
} from '../utils/validators';

describe('validators', () => {
  describe('validateEmail', () => {
    it('accepts valid emails', () => {
      expect(validateEmail('test@example.com')).toBeNull();
      expect(validateEmail('user.name+tag@sub.domain.co.za')).toBeNull();
    });

    it('rejects invalid emails', () => {
      expect(validateEmail('')).toMatch(/required/i);
      expect(validateEmail('not-an-email')).toMatch(/valid email/i);
      expect(validateEmail('missing@domain')).toMatch(/valid email/i);
    });
  });

  describe('validatePassword', () => {
    it('accepts a strong password', () => {
      expect(validatePassword('Test123!')).toBeNull();
      expect(validatePassword('Sup3r$ecret')).toBeNull();
    });

    it('rejects short passwords', () => {
      expect(validatePassword('Ab1!')).toMatch(/8 characters/);
    });

    it('rejects passwords missing uppercase, lowercase, number or symbol', () => {
      expect(validatePassword('alllowercase1!')).toMatch(/uppercase/);
      expect(validatePassword('ALLUPPERCASE1!')).toMatch(/lowercase/);
      expect(validatePassword('NoNumbers!!')).toMatch(/a number/);
      expect(validatePassword('NoSymbols123')).toMatch(/special character/);
    });

    it('rejects empty passwords', () => {
      expect(validatePassword('')).toMatch(/required/i);
    });
  });

  describe('validateName', () => {
    it('accepts normal names', () => {
      expect(validateName('John Doe')).toBeNull();
      expect(validateName('A')).toMatch(/2 characters/);
    });

    it('rejects names that are too long', () => {
      expect(validateName('x'.repeat(61))).toMatch(/60/);
    });

    it('rejects empty names', () => {
      expect(validateName('')).toMatch(/required/i);
      expect(validateName('   ')).toMatch(/required/i);
    });
  });

  describe('validateConfirmPassword', () => {
    it('accepts matching passwords', () => {
      expect(validateConfirmPassword('Test123!', 'Test123!')).toBeNull();
    });

    it('rejects mismatched passwords', () => {
      expect(validateConfirmPassword('Test123!', 'Wrong123!')).toMatch(/do not match/i);
    });

    it('rejects empty confirmation', () => {
      expect(validateConfirmPassword('Test123!', '')).toMatch(/confirm/i);
    });
  });
});