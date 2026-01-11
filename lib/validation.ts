/**
 * Input Validation Utilities
 * Centralized validation functions for form inputs
 */

// Email validation
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

// Password validation
export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }

    if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// Strong password validation (optional, for enhanced security)
export function isStrongPassword(password: string): { valid: boolean; errors: string[]; strength: 'weak' | 'medium' | 'strong' } {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    if (password.length < 8) {
        errors.push('Password should be at least 8 characters');
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const criteriaMet = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

    if (criteriaMet >= 4 && password.length >= 10) {
        strength = 'strong';
    } else if (criteriaMet >= 2 && password.length >= 8) {
        strength = 'medium';
    }

    return {
        valid: errors.length === 0,
        errors,
        strength,
    };
}

// Display name validation
export function isValidDisplayName(name: string): { valid: boolean; error?: string } {
    const trimmed = name.trim();

    if (!trimmed) {
        return { valid: false, error: 'Name is required' };
    }

    if (trimmed.length < 2) {
        return { valid: false, error: 'Name must be at least 2 characters' };
    }

    if (trimmed.length > 50) {
        return { valid: false, error: 'Name must be less than 50 characters' };
    }

    // Check for potentially harmful characters
    if (/[<>{}]/.test(trimmed)) {
        return { valid: false, error: 'Name contains invalid characters' };
    }

    return { valid: true };
}

// Room/Class code validation
export function isValidRoomCode(code: string): { valid: boolean; error?: string } {
    const trimmed = code.trim().toUpperCase();

    if (!trimmed) {
        return { valid: false, error: 'Room code is required' };
    }

    if (trimmed.length < 4) {
        return { valid: false, error: 'Room code must be at least 4 characters' };
    }

    if (trimmed.length > 10) {
        return { valid: false, error: 'Room code must be less than 10 characters' };
    }

    // Only allow alphanumeric characters
    if (!/^[A-Z0-9]+$/.test(trimmed)) {
        return { valid: false, error: 'Room code can only contain letters and numbers' };
    }

    return { valid: true };
}

// Quiz/Poll question validation
export function isValidQuestion(question: string): { valid: boolean; error?: string } {
    const trimmed = question.trim();

    if (!trimmed) {
        return { valid: false, error: 'Question is required' };
    }

    if (trimmed.length < 5) {
        return { valid: false, error: 'Question must be at least 5 characters' };
    }

    if (trimmed.length > 500) {
        return { valid: false, error: 'Question must be less than 500 characters' };
    }

    return { valid: true };
}

// Answer option validation
export function isValidAnswerOption(option: string): { valid: boolean; error?: string } {
    const trimmed = option.trim();

    if (!trimmed) {
        return { valid: false, error: 'Answer option cannot be empty' };
    }

    if (trimmed.length > 200) {
        return { valid: false, error: 'Answer must be less than 200 characters' };
    }

    return { valid: true };
}

// URL validation
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Sanitize text input (basic XSS prevention)
export function sanitizeText(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// Sanitize for display (decode back)
export function unsanitizeText(input: string): string {
    return input
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/');
}

// Validate points/score input
export function isValidPoints(points: number | string): { valid: boolean; error?: string; value: number } {
    const num = typeof points === 'string' ? parseFloat(points) : points;

    if (isNaN(num)) {
        return { valid: false, error: 'Points must be a number', value: 0 };
    }

    if (num < 0) {
        return { valid: false, error: 'Points cannot be negative', value: 0 };
    }

    if (num > 10000) {
        return { valid: false, error: 'Points cannot exceed 10,000', value: 0 };
    }

    return { valid: true, value: Math.round(num) };
}

// Timer duration validation (in seconds)
export function isValidDuration(seconds: number): { valid: boolean; error?: string } {
    if (seconds < 5) {
        return { valid: false, error: 'Duration must be at least 5 seconds' };
    }

    if (seconds > 3600) {
        return { valid: false, error: 'Duration cannot exceed 1 hour' };
    }

    return { valid: true };
}

// Class name validation
export function isValidClassName(name: string): { valid: boolean; error?: string } {
    const trimmed = name.trim();

    if (!trimmed) {
        return { valid: false, error: 'Class name is required' };
    }

    if (trimmed.length < 3) {
        return { valid: false, error: 'Class name must be at least 3 characters' };
    }

    if (trimmed.length > 100) {
        return { valid: false, error: 'Class name must be less than 100 characters' };
    }

    return { valid: true };
}

// Form validation helper - validates multiple fields at once
export interface ValidationResult {
    valid: boolean;
    errors: { [field: string]: string };
}

export function validateForm(validations: { [field: string]: { valid: boolean; error?: string } }): ValidationResult {
    const errors: { [field: string]: string } = {};

    Object.entries(validations).forEach(([field, result]) => {
        if (!result.valid && result.error) {
            errors[field] = result.error;
        }
    });

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}
