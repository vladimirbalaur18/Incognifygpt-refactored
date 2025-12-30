import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IssueService } from '../IssueService';
import { IIssueRepository } from '../../../repositories/IssueRepository';
import { Violation } from '../../../domain/violation/Violation';
import { ViolationTypes } from '../../../domain/violation/ViolationType';
import { IssueState } from '../../../domain/issue/Issue';

describe('IssueService', () => {
    let service: IssueService;
    let mockRepository: IIssueRepository;

    beforeEach(() => {
        mockRepository = {
            getIssues: vi.fn(),
            saveIssues: vi.fn(),
            findViolationById: vi.fn(),
            findActiveViolationByPayload: vi.fn(),
            getDismissedViolations: vi.fn(),
            storageKey: 'test_key',
        } as unknown as IIssueRepository;

        service = new IssueService(mockRepository);
    });

    describe('addIssue', () => {
        it('should add a new issue when it does not exist', async () => {
            const violation = new Violation(
                'violation-1',
                ViolationTypes.EMAIL_ADDRESS,
                'test@example.com',
                Date.now()
            );

            const emptyState = new IssueState([], []);
            vi.mocked(mockRepository.getIssues).mockResolvedValue(emptyState);
            vi.mocked(mockRepository.saveIssues).mockResolvedValue(undefined);

            await service.addIssue(violation, 'context');

            expect(mockRepository.getIssues).toHaveBeenCalledOnce();
            expect(mockRepository.saveIssues).toHaveBeenCalledOnce();

            const savedState = vi.mocked(mockRepository.saveIssues).mock.calls[0][0];
            expect(savedState.activeIssues).toHaveLength(1);
            expect(savedState.history).toHaveLength(1);
            expect(savedState.activeIssues[0].payload).toBe('test@example.com');
            expect(savedState.activeIssues[0].context).toBe('context');
        });

        it('should not add duplicate active issues', async () => {
            const violation = new Violation(
                'violation-1',
                ViolationTypes.EMAIL_ADDRESS,
                'test@example.com',
                Date.now()
            );

            const existingState = new IssueState(
                [violation],
                [violation]
            );

            vi.mocked(mockRepository.getIssues).mockResolvedValue(existingState);
            vi.mocked(mockRepository.saveIssues).mockResolvedValue(undefined);

            await service.addIssue(violation, 'context');

            expect(mockRepository.getIssues).toHaveBeenCalledOnce();
            expect(mockRepository.saveIssues).not.toHaveBeenCalled();
        });

        it('should add issue even if dismissed one exists (different payload)', async () => {
            const existingViolation = new Violation(
                'violation-1',
                ViolationTypes.EMAIL_ADDRESS,
                'old@example.com',
                Date.now(),
                Date.now() + 86400000 // dismissed
            );

            const newViolation = new Violation(
                'violation-2',
                ViolationTypes.EMAIL_ADDRESS,
                'new@example.com',
                Date.now()
            );

            const existingState = new IssueState(
                [existingViolation],
                [existingViolation]
            );

            vi.mocked(mockRepository.getIssues).mockResolvedValue(existingState);
            vi.mocked(mockRepository.saveIssues).mockResolvedValue(undefined);

            await service.addIssue(newViolation, 'context');

            expect(mockRepository.saveIssues).toHaveBeenCalledOnce();
            const savedState = vi.mocked(mockRepository.saveIssues).mock.calls[0][0];
            expect(savedState.activeIssues).toHaveLength(2);
        });
    });

    describe('dismissIssue', () => {
        it('should dismiss an issue for 24 hours', async () => {
            const violation = new Violation(
                'violation-1',
                ViolationTypes.EMAIL_ADDRESS,
                'test@example.com',
                Date.now()
            );

            const state = new IssueState([violation], [violation]);
            vi.mocked(mockRepository.getIssues).mockResolvedValue(state);
            vi.mocked(mockRepository.saveIssues).mockResolvedValue(undefined);

            const beforeTime = Date.now();
            await service.dismissIssue('violation-1');
            const afterTime = Date.now();

            expect(mockRepository.saveIssues).toHaveBeenCalledOnce();
            const savedState = vi.mocked(mockRepository.saveIssues).mock.calls[0][0];

            const dismissedActive = savedState.activeIssues.find(v => v.id === 'violation-1');
            const dismissedHistory = savedState.history.find(v => v.id === 'violation-1');

            expect(dismissedActive?.dismissedUntil).toBeDefined();
            expect(dismissedHistory?.dismissedUntil).toBeDefined();

            if (dismissedActive?.dismissedUntil) {
                const dismissDuration = dismissedActive.dismissedUntil - beforeTime;
                expect(dismissDuration).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 1000);
                expect(dismissDuration).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 1000);
            }
        });

        it('should not modify non-matching issues', async () => {
            const violation1 = new Violation(
                'violation-1',
                ViolationTypes.EMAIL_ADDRESS,
                'test1@example.com',
                Date.now()
            );
            const violation2 = new Violation(
                'violation-2',
                ViolationTypes.EMAIL_ADDRESS,
                'test2@example.com',
                Date.now()
            );

            const state = new IssueState([violation1, violation2], [violation1, violation2]);
            vi.mocked(mockRepository.getIssues).mockResolvedValue(state);
            vi.mocked(mockRepository.saveIssues).mockResolvedValue(undefined);

            await service.dismissIssue('violation-1');

            const savedState = vi.mocked(mockRepository.saveIssues).mock.calls[0][0];
            const notDismissed = savedState.activeIssues.find(v => v.id === 'violation-2');
            expect(notDismissed?.dismissedUntil).toBeUndefined();
        });
    });

    describe('getActiveIssues', () => {
        it('should return only non-dismissed issues', async () => {
            const activeViolation = new Violation(
                'violation-1',
                ViolationTypes.EMAIL_ADDRESS,
                'active@example.com',
                Date.now()
            );

            const dismissedViolation = new Violation(
                'violation-2',
                ViolationTypes.EMAIL_ADDRESS,
                'dismissed@example.com',
                Date.now(),
                Date.now() + 86400000 // dismissed for 24h
            );

            const state = new IssueState([activeViolation, dismissedViolation], []);
            vi.mocked(mockRepository.getIssues).mockResolvedValue(state);

            const activeIssues = await service.getActiveIssues();

            expect(activeIssues).toHaveLength(1);
            expect(activeIssues[0].id).toBe('violation-1');
        });

        it('should return issues with expired dismissals', async () => {
            const expiredDismissal = new Violation(
                'violation-1',
                ViolationTypes.EMAIL_ADDRESS,
                'expired@example.com',
                Date.now(),
                Date.now() - 1000 // dismissed but expired
            );

            const state = new IssueState([expiredDismissal], []);
            vi.mocked(mockRepository.getIssues).mockResolvedValue(state);

            const activeIssues = await service.getActiveIssues();

            expect(activeIssues).toHaveLength(1);
            expect(activeIssues[0].id).toBe('violation-1');
        });
    });

    describe('getAllIssues', () => {
        it('should return all issues from repository', async () => {
            const state = new IssueState([], []);
            vi.mocked(mockRepository.getIssues).mockResolvedValue(state);

            const result = await service.getAllIssues();

            expect(result).toBe(state);
            expect(mockRepository.getIssues).toHaveBeenCalledOnce();
        });
    });

    describe('getDismissedViolations', () => {
        it('should return dismissed violations from repository', async () => {
            const dismissedViolation = new Violation(
                'violation-1',
                ViolationTypes.EMAIL_ADDRESS,
                'dismissed@example.com',
                Date.now(),
                Date.now() + 86400000
            );

            vi.mocked(mockRepository.getDismissedViolations).mockResolvedValue([
                dismissedViolation,
            ]);

            const result = await service.getDismissedViolations();

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('violation-1');
            expect(mockRepository.getDismissedViolations).toHaveBeenCalledOnce();
        });
    });
});

