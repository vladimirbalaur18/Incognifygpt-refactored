import { Scanner, ScanResult } from '@/core/domain/scanner/Scanner';
import { Violation } from '@/core/domain/violation/Violation';
import { IStrategyRegistry } from '../violation/StrategyRegistry';

/**
 * Application service for scanning and anonymizing text
 * Orchestrates the scanning process
 */
export class ScanService {
    constructor(
        private scanner: Scanner,
        private strategyRegistry: IStrategyRegistry
    ) {}

    /**
     * Scan text for violations and anonymize it
     * @param text - The text to scan
     * @param dismissedViolations - Violations that should be ignored
     * @returns Scan result with anonymized text and found violations
     */
    scanAndAnonymize(
        text: string,
        dismissedViolations: Violation[] = []
    ): ScanResult {
        return this.scanner.scanAndAnonymize(text, dismissedViolations);
    }

    /**
     * Check if text contains any violations
     */
    hasViolations(text: string, dismissedViolations: Violation[] = []): boolean {
        const result = this.scanAndAnonymize(text, dismissedViolations);
        return result.hasIssues;
    }
}

