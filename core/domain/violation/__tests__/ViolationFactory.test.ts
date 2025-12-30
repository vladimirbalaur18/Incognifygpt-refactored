import { describe, it, expect } from 'vitest';
import { violationFactory } from '../ViolationFactory';
import { Violation } from '../Violation';
import { ViolationTypes } from '../ViolationType';

describe('ViolationFactory', () => {
    describe('create', () => {
        it('should create a violation with generated ID', () => {
            const violation = violationFactory.create(
                ViolationTypes.EMAIL_ADDRESS,
                'test@example.com'
            );

            expect(violation).toBeInstanceOf(Violation);
            expect(violation.type).toBe(ViolationTypes.EMAIL_ADDRESS);
            expect(violation.payload).toBe('test@example.com');
            expect(violation.id).toContain('EMAIL_ADDRESS');
            expect(violation.detectedAt).toBeGreaterThan(0);
        });

        it('should use provided detectedAt timestamp', () => {
            const timestamp = 1234567890;
            const violation = violationFactory.create(
                ViolationTypes.PHONE_NUMBER,
                '+1234567890',
                timestamp
            );

            expect(violation.detectedAt).toBe(timestamp);
        });

        it('should generate unique IDs for different violations', () => {
            const violation1 = violationFactory.create(
                ViolationTypes.EMAIL_ADDRESS,
                'test1@example.com'
            );
            const violation2 = violationFactory.create(
                ViolationTypes.EMAIL_ADDRESS,
                'test2@example.com'
            );

            expect(violation1.id).not.toBe(violation2.id);
        });
    });

    describe('fromData', () => {
        it('should create violation from data with all fields', () => {
            const data = {
                id: 'violation-1',
                type: ViolationTypes.EMAIL_ADDRESS,
                payload: 'test@example.com',
                detectedAt: 1234567890,
                dismissedUntil: 1234567890 + 86400000,
                context: 'some context',
            };

            const violation = violationFactory.fromData(data);

            expect(violation).toBeInstanceOf(Violation);
            expect(violation.id).toBe('violation-1');
            expect(violation.type).toBe(ViolationTypes.EMAIL_ADDRESS);
            expect(violation.payload).toBe('test@example.com');
            expect(violation.detectedAt).toBe(1234567890);
            expect(violation.dismissedUntil).toBe(1234567890 + 86400000);
            expect(violation.context).toBe('some context');
        });

        it('should handle missing optional fields', () => {
            const data = {
                id: 'violation-1',
                type: ViolationTypes.EMAIL_ADDRESS,
                payload: 'test@example.com',
                detectedAt: 1234567890,
            };

            const violation = violationFactory.fromData(data);

            expect(violation.dismissedUntil).toBeUndefined();
            expect(violation.context).toBeUndefined();
        });

        it('should preserve undefined values correctly', () => {
            const data = {
                id: 'violation-1',
                type: ViolationTypes.EMAIL_ADDRESS,
                payload: 'test@example.com',
                detectedAt: 1234567890,
                dismissedUntil: undefined,
                context: undefined,
            };

            const violation = violationFactory.fromData(data);

            expect(violation.dismissedUntil).toBeUndefined();
            expect(violation.context).toBeUndefined();
        });
    });
});

