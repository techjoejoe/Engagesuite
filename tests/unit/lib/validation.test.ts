/**
 * Unit Tests for Validation Library
 * Tests input validation functions
 */
import { describe, it, expect } from 'vitest';
import {
    isValidEmail,
    isValidPassword,
    isStrongPassword,
    isValidDisplayName,
    isValidRoomCode,
    isValidQuestion,
    isValidAnswerOption,
    isValidUrl,
    sanitizeText,
    unsanitizeText,
    isValidPoints,
    isValidDuration,
    isValidClassName,
    validateForm,
} from '@/lib/validation';

describe('Validation Library', () => {
    describe('isValidEmail', () => {
        it('should validate correct email formats', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('user.name@domain.org')).toBe(true);
            expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
        });

        it('should reject invalid email formats', () => {
            expect(isValidEmail('')).toBe(false);
            expect(isValidEmail('invalid')).toBe(false);
            expect(isValidEmail('missing@domain')).toBe(false);
            expect(isValidEmail('@nodomain.com')).toBe(false);
            expect(isValidEmail('spaces in@email.com')).toBe(false);
        });

        it('should trim whitespace', () => {
            expect(isValidEmail('  test@example.com  ')).toBe(true);
        });
    });

    describe('isValidPassword', () => {
        it('should accept valid passwords', () => {
            const result = isValidPassword('password123');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject short passwords', () => {
            const result = isValidPassword('12345');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must be at least 6 characters');
        });

        it('should reject very long passwords', () => {
            const longPassword = 'a'.repeat(130);
            const result = isValidPassword(longPassword);
            expect(result.valid).toBe(false);
        });
    });

    describe('isStrongPassword', () => {
        it('should rate weak passwords', () => {
            const result = isStrongPassword('abc');
            expect(result.strength).toBe('weak');
        });

        it('should rate medium passwords', () => {
            const result = isStrongPassword('Password1');
            expect(result.strength).toBe('medium');
        });

        it('should rate strong passwords', () => {
            const result = isStrongPassword('StrongPass!123');
            expect(result.strength).toBe('strong');
        });
    });

    describe('isValidDisplayName', () => {
        it('should accept valid names', () => {
            expect(isValidDisplayName('John Doe').valid).toBe(true);
            expect(isValidDisplayName('Alice').valid).toBe(true);
        });

        it('should reject empty names', () => {
            expect(isValidDisplayName('').valid).toBe(false);
            expect(isValidDisplayName('   ').valid).toBe(false);
        });

        it('should reject very short names', () => {
            expect(isValidDisplayName('A').valid).toBe(false);
        });

        it('should reject names with HTML characters', () => {
            expect(isValidDisplayName('<script>').valid).toBe(false);
            expect(isValidDisplayName('Name{test}').valid).toBe(false);
        });
    });

    describe('isValidRoomCode', () => {
        it('should accept valid room codes', () => {
            expect(isValidRoomCode('ABC123').valid).toBe(true);
            expect(isValidRoomCode('ROOM').valid).toBe(true);
        });

        it('should reject empty codes', () => {
            expect(isValidRoomCode('').valid).toBe(false);
        });

        it('should reject short codes', () => {
            expect(isValidRoomCode('AB').valid).toBe(false);
        });

        it('should reject codes with special characters', () => {
            expect(isValidRoomCode('ABC-123').valid).toBe(false);
            expect(isValidRoomCode('ABC 123').valid).toBe(false);
        });
    });

    describe('isValidQuestion', () => {
        it('should accept valid questions', () => {
            expect(isValidQuestion('What is 2 + 2?').valid).toBe(true);
        });

        it('should reject empty questions', () => {
            expect(isValidQuestion('').valid).toBe(false);
        });

        it('should reject very short questions', () => {
            expect(isValidQuestion('Hi?').valid).toBe(false);
        });
    });

    describe('isValidAnswerOption', () => {
        it('should accept valid answers', () => {
            expect(isValidAnswerOption('Paris').valid).toBe(true);
            expect(isValidAnswerOption('42').valid).toBe(true);
        });

        it('should reject empty answers', () => {
            expect(isValidAnswerOption('').valid).toBe(false);
            expect(isValidAnswerOption('   ').valid).toBe(false);
        });
    });

    describe('isValidUrl', () => {
        it('should validate correct URLs', () => {
            expect(isValidUrl('https://example.com')).toBe(true);
            expect(isValidUrl('http://localhost:3000')).toBe(true);
            expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
        });

        it('should reject invalid URLs', () => {
            expect(isValidUrl('not-a-url')).toBe(false);
            expect(isValidUrl('example.com')).toBe(false);
        });
    });

    describe('sanitizeText', () => {
        it('should escape HTML characters', () => {
            expect(sanitizeText('<script>')).toBe('&lt;script&gt;');
            expect(sanitizeText('"quoted"')).toBe('&quot;quoted&quot;');
        });

        it('should handle normal text', () => {
            expect(sanitizeText('Hello World')).toBe('Hello World');
        });
    });

    describe('unsanitizeText', () => {
        it('should decode escaped characters', () => {
            expect(unsanitizeText('&lt;script&gt;')).toBe('<script>');
        });

        it('should be reversible with sanitize', () => {
            const original = '<div>Test "value"</div>';
            expect(unsanitizeText(sanitizeText(original))).toBe(original);
        });
    });

    describe('isValidPoints', () => {
        it('should accept valid points', () => {
            expect(isValidPoints(100).valid).toBe(true);
            expect(isValidPoints('50').valid).toBe(true);
            expect(isValidPoints(0).valid).toBe(true);
        });

        it('should reject negative points', () => {
            expect(isValidPoints(-10).valid).toBe(false);
        });

        it('should reject excessive points', () => {
            expect(isValidPoints(50000).valid).toBe(false);
        });

        it('should round to integers', () => {
            expect(isValidPoints(10.7).value).toBe(11);
        });
    });

    describe('isValidDuration', () => {
        it('should accept valid durations', () => {
            expect(isValidDuration(30).valid).toBe(true);
            expect(isValidDuration(300).valid).toBe(true);
        });

        it('should reject too short durations', () => {
            expect(isValidDuration(2).valid).toBe(false);
        });

        it('should reject too long durations', () => {
            expect(isValidDuration(7200).valid).toBe(false);
        });
    });

    describe('isValidClassName', () => {
        it('should accept valid class names', () => {
            expect(isValidClassName('Math 101').valid).toBe(true);
            expect(isValidClassName('Introduction to Computer Science').valid).toBe(true);
        });

        it('should reject empty names', () => {
            expect(isValidClassName('').valid).toBe(false);
        });

        it('should reject very short names', () => {
            expect(isValidClassName('CS').valid).toBe(false);
        });
    });

    describe('validateForm', () => {
        it('should pass when all fields are valid', () => {
            const result = validateForm({
                email: isValidDisplayName('John'),
                name: isValidDisplayName('Test'),
            });
            expect(result.valid).toBe(true);
            expect(Object.keys(result.errors)).toHaveLength(0);
        });

        it('should collect errors from invalid fields', () => {
            const result = validateForm({
                name: isValidDisplayName(''),
                code: isValidRoomCode('AB'),
            });
            expect(result.valid).toBe(false);
            expect(result.errors.name).toBeDefined();
            expect(result.errors.code).toBeDefined();
        });
    });
});
