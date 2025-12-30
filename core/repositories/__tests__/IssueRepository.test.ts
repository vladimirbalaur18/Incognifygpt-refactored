import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IssueRepository } from '../IssueRepository';
import { IStorageService } from '../../services/StorageService';
import { IssueState } from '../../domain/issue/Issue';
import { Violation } from '../../domain/violation/Violation';
import { ViolationTypes } from '../../domain/violation/ViolationType';
import { IIssueState } from '../../domain/issue/Issue';

describe('IssueRepository', () => {
    let repository: IssueRepository;
    let mockStorage: IStorageService;

    beforeEach(() => {
        mockStorage = {
            get: vi.fn(),
            set: vi.fn(),
        } as unknown as IStorageService;

        repository = new IssueRepository(mockStorage);
    });

    describe('getIssues', () => {
        it('should return default state when storage is empty', async () => {
            vi.mocked(mockStorage.get).mockResolvedValue(undefined);

            const result = await repository.getIssues();

            expect(result).toBeInstanceOf(IssueState);
            expect(result.activeIssues).toHaveLength(0);
            expect(result.history).toHaveLength(0);
            expect(mockStorage.get).toHaveBeenCalledWith('anonymizer_issues');
        });

        it('should return parsed state from storage', async () => {
            const storedData: IIssueState = {
                activeIssues: [
                    {
                        id: 'violation-1',
                        type: ViolationTypes.EMAIL_ADDRESS,
                        payload: 'test@example.com',
                        detectedAt: Date.now(),
                    },
                ],
                history: [],
            };

            vi.mocked(mockStorage.get).mockResolvedValue(storedData);

            const result = await repository.getIssues();

            expect(result).toBeInstanceOf(IssueState);
            expect(result.activeIssues).toHaveLength(1);
            expect(result.activeIssues[0].payload).toBe('test@example.com');
        });

        it('should convert stored data to domain objects', async () => {
            const storedData: IIssueState = {
                activeIssues: [
                    {
                        id: 'violation-1',
                        type: ViolationTypes.EMAIL_ADDRESS,
                        payload: 'test@example.com',
                        detectedAt: Date.now(),
                        dismissedUntil: Date.now() + 86400000,
                        context: 'some context',
                    },
                ],
                history: [],
            };

            vi.mocked(mockStorage.get).mockResolvedValue(storedData);

            const result = await repository.getIssues();

            expect(result.activeIssues[0]).toBeInstanceOf(Violation);
            expect(result.activeIssues[0].dismissedUntil).toBe(storedData.activeIssues[0].dismissedUntil);
            expect(result.activeIssues[0].context).toBe('some context');
        });
    });

    describe('saveIssues', () => {
        it('should save issues to storage', async () => {
            const violation = new Violation(
                'violation-1',
                ViolationTypes.EMAIL_ADDRESS,
                'test@example.com',
                Date.now(),
                undefined,
                'context'
            );

            const state = new IssueState([violation], [violation]);
            vi.mocked(mockStorage.set).mockResolvedValue(undefined);

            await repository.saveIssues(state);

            expect(mockStorage.set).toHaveBeenCalledWith('anonymizer_issues', expect.any(Object));
            const savedData = vi.mocked(mockStorage.set).mock.calls[0][1] as IIssueState;
            expect(savedData.activeIssues).toHaveLength(1);
            expect(savedData.activeIssues[0].payload).toBe('test@example.com');
            expect(savedData.activeIssues[0].context).toBe('context');
        });

        it('should preserve all violation fields when saving', async () => {
            const violation = new Violation(
                'violation-1',
                ViolationTypes.EMAIL_ADDRESS,
                'test@example.com',
                1234567890,
                1234567890 + 86400000,
                'context'
            );

            const state = new IssueState([violation], [violation]);
            vi.mocked(mockStorage.set).mockResolvedValue(undefined);

            await repository.saveIssues(state);

            const savedData = vi.mocked(mockStorage.set).mock.calls[0][1] as IIssueState;
            expect(savedData.activeIssues[0]).toMatchObject({
                id: 'violation-1',
                type: ViolationTypes.EMAIL_ADDRESS,
                payload: 'test@example.com',
                detectedAt: 1234567890,
                dismissedUntil: 1234567890 + 86400000,
                context: 'context',
            });
        });
    });

    describe('findViolationById', () => {
        it('should find violation in active issues', async () => {
            const violation = new Violation(
                'violation-1',
                ViolationTypes.EMAIL_ADDRESS,
                'test@example.com',
                Date.now()
            );

            const state = new IssueState([violation], []);
            vi.mocked(mockStorage.get).mockResolvedValue({
                activeIssues: [
                    {
                        id: 'violation-1',
                        type: ViolationTypes.EMAIL_ADDRESS,
                        payload: 'test@example.com',
                        detectedAt: Date.now(),
                    },
                ],
                history: [],
            });

            const result = await repository.findViolationById('violation-1');

            expect(result).toBeDefined();
            expect(result?.id).toBe('violation-1');
        });

        it('should find violation in history', async () => {
            vi.mocked(mockStorage.get).mockResolvedValue({
                activeIssues: [],
                history: [
                    {
                        id: 'violation-1',
                        type: ViolationTypes.EMAIL_ADDRESS,
                        payload: 'test@example.com',
                        detectedAt: Date.now(),
                    },
                ],
            });

            const result = await repository.findViolationById('violation-1');

            expect(result).toBeDefined();
            expect(result?.id).toBe('violation-1');
        });

        it('should return undefined for non-existent violation', async () => {
            vi.mocked(mockStorage.get).mockResolvedValue({
                activeIssues: [],
                history: [],
            });

            const result = await repository.findViolationById('non-existent');

            expect(result).toBeUndefined();
        });
    });

    describe('findActiveViolationByPayload', () => {
        it('should find active non-dismissed violation', async () => {
            vi.mocked(mockStorage.get).mockResolvedValue({
                activeIssues: [
                    {
                        id: 'violation-1',
                        type: ViolationTypes.EMAIL_ADDRESS,
                        payload: 'test@example.com',
                        detectedAt: Date.now(),
                    },
                ],
                history: [],
            });

            const result = await repository.findActiveViolationByPayload('test@example.com');

            expect(result).toBeDefined();
            expect(result?.payload).toBe('test@example.com');
        });

        it('should not find dismissed violations', async () => {
            vi.mocked(mockStorage.get).mockResolvedValue({
                activeIssues: [
                    {
                        id: 'violation-1',
                        type: ViolationTypes.EMAIL_ADDRESS,
                        payload: 'test@example.com',
                        detectedAt: Date.now(),
                        dismissedUntil: Date.now() + 86400000, // dismissed
                    },
                ],
                history: [],
            });

            const result = await repository.findActiveViolationByPayload('test@example.com');

            expect(result).toBeUndefined();
        });

        it('should find violations with expired dismissals', async () => {
            vi.mocked(mockStorage.get).mockResolvedValue({
                activeIssues: [
                    {
                        id: 'violation-1',
                        type: ViolationTypes.EMAIL_ADDRESS,
                        payload: 'test@example.com',
                        detectedAt: Date.now(),
                        dismissedUntil: Date.now() - 1000, // expired
                    },
                ],
                history: [],
            });

            const result = await repository.findActiveViolationByPayload('test@example.com');

            expect(result).toBeDefined();
            expect(result?.payload).toBe('test@example.com');
        });
    });

    describe('getDismissedViolations', () => {
        it('should return only dismissed violations from history', async () => {
            vi.mocked(mockStorage.get).mockResolvedValue({
                activeIssues: [],
                history: [
                    {
                        id: 'violation-1',
                        type: ViolationTypes.EMAIL_ADDRESS,
                        payload: 'dismissed@example.com',
                        detectedAt: Date.now(),
                        dismissedUntil: Date.now() + 86400000, // dismissed
                    },
                    {
                        id: 'violation-2',
                        type: ViolationTypes.EMAIL_ADDRESS,
                        payload: 'active@example.com',
                        detectedAt: Date.now(),
                        // not dismissed
                    },
                ],
            });

            const result = await repository.getDismissedViolations();

            expect(result).toHaveLength(1);
            expect(result[0].payload).toBe('dismissed@example.com');
        });

        it('should return empty array when no dismissed violations', async () => {
            vi.mocked(mockStorage.get).mockResolvedValue({
                activeIssues: [],
                history: [],
            });

            const result = await repository.getDismissedViolations();

            expect(result).toHaveLength(0);
        });
    });

    describe('storageKey', () => {
        it('should return the correct storage key', () => {
            expect(repository.storageKey).toBe('anonymizer_issues');
        });
    });
});

