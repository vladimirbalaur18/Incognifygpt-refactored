import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DismissIssueUseCase } from '../DismissIssueUseCase';
import { IssueService } from '../../services/issue/IssueService';

describe('DismissIssueUseCase', () => {
    let useCase: DismissIssueUseCase;
    let mockIssueService: IssueService;

    beforeEach(() => {
        mockIssueService = {
            dismissIssue: vi.fn(),
            addIssue: vi.fn(),
            getActiveIssues: vi.fn(),
            getAllIssues: vi.fn(),
            getDismissedViolations: vi.fn(),
        } as unknown as IssueService;

        useCase = new DismissIssueUseCase(mockIssueService);
    });

    describe('execute', () => {
        it('should dismiss an issue successfully', async () => {
            const issueId = 'issue-123';
            vi.mocked(mockIssueService.dismissIssue).mockResolvedValue(undefined);

            await useCase.execute(issueId);

            expect(mockIssueService.dismissIssue).toHaveBeenCalledOnce();
            expect(mockIssueService.dismissIssue).toHaveBeenCalledWith(issueId);
        });

        it('should throw error for empty issue ID', async () => {
            await expect(useCase.execute('')).rejects.toThrow('Issue ID is required');
            expect(mockIssueService.dismissIssue).not.toHaveBeenCalled();
        });

        it('should throw error for whitespace-only issue ID', async () => {
            await expect(useCase.execute('   ')).rejects.toThrow('Issue ID is required');
            expect(mockIssueService.dismissIssue).not.toHaveBeenCalled();
        });

        it('should handle service errors', async () => {
            const issueId = 'issue-123';
            const error = new Error('Service error');
            vi.mocked(mockIssueService.dismissIssue).mockRejectedValue(error);

            await expect(useCase.execute(issueId)).rejects.toThrow('Service error');
        });
    });
});

