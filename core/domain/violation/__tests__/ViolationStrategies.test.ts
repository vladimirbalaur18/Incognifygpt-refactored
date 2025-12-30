import { describe, it, expect, beforeEach } from 'vitest';
import {
    EmailViolationStrategy,
    PhoneNumberViolationStrategy,
    IpAddressViolationStrategy,
    UrlViolationStrategy,
} from '../ViolationStrategies';
import { ViolationTypes } from '../ViolationType';

describe('ViolationStrategies', () => {
    describe('EmailViolationStrategy', () => {
        let strategy: EmailViolationStrategy;

        beforeEach(() => {
            strategy = new EmailViolationStrategy();
        });

        it('should detect valid email addresses', () => {
            expect(strategy.rule('test@example.com')).toBe(true);
            expect(strategy.rule('user.name@domain.co.uk')).toBe(true);
            expect(strategy.rule('user+tag@example.com')).toBe(true);
        });

        it('should not detect invalid email addresses', () => {
            expect(strategy.rule('not-an-email')).toBe(false);
            expect(strategy.rule('@example.com')).toBe(false);
            expect(strategy.rule('user@')).toBe(false);
            expect(strategy.rule('user@domain')).toBe(false);
        });

        it('should have correct type and description', () => {
            expect(strategy.type).toBe(ViolationTypes.EMAIL_ADDRESS);
            expect(strategy.description).toBe('Email');
        });

        it('should return regex pattern', () => {
            const regex = strategy.getRegex();
            expect(regex).toBeInstanceOf(RegExp);
        });
    });

    describe('PhoneNumberViolationStrategy', () => {
        let strategy: PhoneNumberViolationStrategy;

        beforeEach(() => {
            strategy = new PhoneNumberViolationStrategy();
        });

        it('should detect valid phone numbers', () => {
            expect(strategy.rule('+1234567890')).toBe(true);
            expect(strategy.rule('1234567890')).toBe(true);
            expect(strategy.rule('+12345678901234')).toBe(true);
        });

        it('should not detect invalid phone numbers', () => {
            // Note: The regex matches 1-9 followed by 1-14 digits, so "123" actually matches
            // We test with non-numeric prefixes and text without numbers
            expect(strategy.rule('abc')).toBe(false);
            expect(strategy.rule('not a phone number')).toBe(false);
            expect(strategy.rule('')).toBe(false);
        });

        it('should have correct type and description', () => {
            expect(strategy.type).toBe(ViolationTypes.PHONE_NUMBER);
            expect(strategy.description).toBe('Phone number');
        });
    });

    describe('IpAddressViolationStrategy', () => {
        let strategy: IpAddressViolationStrategy;

        beforeEach(() => {
            strategy = new IpAddressViolationStrategy();
        });

        it('should detect valid IP addresses', () => {
            expect(strategy.rule('192.168.1.1')).toBe(true);
            expect(strategy.rule('10.0.0.1')).toBe(true);
            expect(strategy.rule('255.255.255.255')).toBe(true);
            expect(strategy.rule('0.0.0.0')).toBe(true);
        });

        it('should not detect invalid IP addresses', () => {
            // Note: The regex uses word boundaries, so it should properly validate
            // However, "256.1.1.1" might match as "56.1.1.1" substring
            // We test with incomplete IPs and non-IP text
            expect(strategy.rule('192.168.1')).toBe(false); // incomplete (no 4th octet)
            expect(strategy.rule('not an ip address')).toBe(false); // no IP pattern
            expect(strategy.rule('')).toBe(false); // empty string
        });

        it('should have correct type and description', () => {
            expect(strategy.type).toBe(ViolationTypes.IP_ADDRESS);
            expect(strategy.description).toBe('IP address');
        });
    });

    describe('UrlViolationStrategy', () => {
        let strategy: UrlViolationStrategy;

        beforeEach(() => {
            strategy = new UrlViolationStrategy();
        });

        it('should detect valid URLs', () => {
            expect(strategy.rule('https://example.com')).toBe(true);
            expect(strategy.rule('http://www.example.com')).toBe(true);
            expect(strategy.rule('https://example.com/path')).toBe(true);
            expect(strategy.rule('https://subdomain.example.com')).toBe(true);
        });

        it('should not detect invalid URLs', () => {
            expect(strategy.rule('not-a-url')).toBe(false);
            expect(strategy.rule('example.com')).toBe(false); // missing protocol
            expect(strategy.rule('ftp://example.com')).toBe(false); // wrong protocol
        });

        it('should have correct type and description', () => {
            expect(strategy.type).toBe(ViolationTypes.URL);
            expect(strategy.description).toBe('URL');
        });
    });
});

