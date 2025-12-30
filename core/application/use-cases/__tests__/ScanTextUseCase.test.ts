import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScanTextUseCase } from '../ScanTextUseCase';
import { ScanService } from '../../services/ScanService';
import { IssueService } from '../../services/IssueService';
import { Violation } from '../../../domain/violation/Violation';
import { ViolationTypes } from '../../../domain/violation/ViolationType';
import { ScanResult } from '../../../domain/scanner/Scanner';

describe('ScanTextUseCase', () => {
    let useCase: ScanTextUseCase;
    let mockScanService: ScanService;
    let mockIssueService: IssueService;

    beforeEach(() => {
        mockScanService = {
            scanAndAnonymize: vi.fn(),
            hasViolations: vi.fn(),
        } as unknown as ScanService;

        mockIssueService = {
            getDismissedViolations: vi.fn(),
            addIssue: vi.fn(),
            dismissIssue: vi.fn(),
            getActiveIssues: vi.fn(),
            getAllIssues: vi.fn(),
        } as unknown as IssueService;

        useCase = new ScanTextUseCase(mockScanService, mockIssueService);
    });

    describe('execute', () => {
        it('should return empty result for empty text', async () => {
            const result = await useCase.execute('');

            expect(result).toEqual({
                hasIssues: false,
                anonymizedText: '',
                foundViolations: [],
            });
            expect(mockScanService.scanAndAnonymize).not.toHaveBeenCalled();
        });

        it('should return empty result for whitespace-only text', async () => {
            const result = await useCase.execute('   \n\t  ');

            expect(result).toEqual({
                hasIssues: false,
                anonymizedText: '   \n\t  ',
                foundViolations: [],
            });
            expect(mockScanService.scanAndAnonymize).not.toHaveBeenCalled();
        });

        it('should scan text and return result when no violations found', async () => {
            const scanResult: ScanResult = {
                hasIssues: false,
                anonymizedText: 'safe text',
                foundViolations: [],
            };

            vi.mocked(mockIssueService.getDismissedViolations).mockResolvedValue([]);
            vi.mocked(mockScanService.scanAndAnonymize).mockReturnValue(scanResult);

            const result = await useCase.execute('safe text');

            expect(result).toEqual(scanResult);
            expect(mockIssueService.getDismissedViolations).toHaveBeenCalledOnce();
            expect(mockScanService.scanAndAnonymize).toHaveBeenCalledWith('safe text', []);
            expect(mockIssueService.addIssue).not.toHaveBeenCalled();
        });

        it('should scan text, find violations, and record them', async () => {
            const violation = new Violation(
                'violation-1',
                ViolationTypes.EMAIL_ADDRESS,
                'test@example.com',
                Date.now()
            );

            const scanResult: ScanResult = {
                hasIssues: true,
                anonymizedText: '[EMAIL_ADDRESS]',
                foundViolations: [violation],
            };

            vi.mocked(mockIssueService.getDismissedViolations).mockResolvedValue([]);
            vi.mocked(mockScanService.scanAndAnonymize).mockReturnValue(scanResult);
            vi.mocked(mockIssueService.addIssue).mockResolvedValue(undefined);

            const result = await useCase.execute('Contact me at test@example.com');

            expect(result).toEqual(scanResult);
            expect(mockIssueService.getDismissedViolations).toHaveBeenCalledOnce();
            expect(mockScanService.scanAndAnonymize).toHaveBeenCalledWith(
                'Contact me at test@example.com',
                []
            );
            expect(mockIssueService.addIssue).toHaveBeenCalledWith(
                violation,
                'Contact me at test@example.com'
            );
        });

        it('should truncate context for long text', async () => {
            const violation = new Violation(
                'violation-1',
                ViolationTypes.EMAIL_ADDRESS,
                'test@example.com',
                Date.now()
            );

            const longText = 'a'.repeat(150);
            const scanResult: ScanResult = {
                hasIssues: true,
                anonymizedText: '[EMAIL_ADDRESS]',
                foundViolations: [violation],
            };

            vi.mocked(mockIssueService.getDismissedViolations).mockResolvedValue([]);
            vi.mocked(mockScanService.scanAndAnonymize).mockReturnValue(scanResult);
            vi.mocked(mockIssueService.addIssue).mockResolvedValue(undefined);

            await useCase.execute(longText);

            expect(mockIssueService.addIssue).toHaveBeenCalledWith(
                violation,
                'a'.repeat(100) + '...'
            );
        });

        it('should filter dismissed violations during scan', async () => {
            const dismissedViolation = new Violation(
                'dismissed-1',
                ViolationTypes.EMAIL_ADDRESS,
                'dismissed@example.com',
                Date.now(),
                Date.now() + 86400000 // 24 hours from now
            );

            const scanResult: ScanResult = {
                hasIssues: false,
                anonymizedText: 'safe text',
                foundViolations: [],
            };

            vi.mocked(mockIssueService.getDismissedViolations).mockResolvedValue([
                dismissedViolation,
            ]);
            vi.mocked(mockScanService.scanAndAnonymize).mockReturnValue(scanResult);

            await useCase.execute('safe text');

            expect(mockScanService.scanAndAnonymize).toHaveBeenCalledWith('safe text', [
                dismissedViolation,
            ]);
        });

        it('should handle multiple violations', async () => {
            const violation1 = new Violation(
                'violation-1',
                ViolationTypes.EMAIL_ADDRESS,
                'test1@example.com',
                Date.now()
            );
            const violation2 = new Violation(
                'violation-2',
                ViolationTypes.PHONE_NUMBER,
                '+1234567890',
                Date.now()
            );

            const scanResult: ScanResult = {
                hasIssues: true,
                anonymizedText: '[EMAIL_ADDRESS] [PHONE_NUMBER]',
                foundViolations: [violation1, violation2],
            };

            vi.mocked(mockIssueService.getDismissedViolations).mockResolvedValue([]);
            vi.mocked(mockScanService.scanAndAnonymize).mockReturnValue(scanResult);
            vi.mocked(mockIssueService.addIssue).mockResolvedValue(undefined);

            await useCase.execute('Contact test1@example.com or +1234567890');

            expect(mockIssueService.addIssue).toHaveBeenCalledTimes(2);
            expect(mockIssueService.addIssue).toHaveBeenCalledWith(
                violation1,
                'Contact test1@example.com or +1234567890'
            );
            expect(mockIssueService.addIssue).toHaveBeenCalledWith(
                violation2,
                'Contact test1@example.com or +1234567890'
            );
        });
    });
});

