import { ScanService } from "@/core/application/services/scan/ScanService";
import { IssueService } from "@/core/application/services/issue/IssueService";
import { ScanResult } from "@/core/domain/scanner/Scanner";
/**
 * Use case: Scan text for violations and record them
 * This encapsulates the business workflow of scanning and recording violations
 */
export class ScanTextUseCase {
    constructor(
        private scanService: ScanService,
        private issueService: IssueService
    ) {}

    /**
     * Execute the scan and record workflow
     * @param text - The text to scan
     * @returns Scan result with anonymized text and found violations
     */
    async execute(text: string): Promise<ScanResult> {
        // Validate input
        if (!text || !text.trim()) {
            return {
                hasIssues: false,
                anonymizedText: text || '',
                foundViolations: [],
            };
        }

        // Get dismissed violations to filter them out
        const dismissedViolations = await this.issueService.getDismissedViolations();

        // Scan and anonymize
        const result = this.scanService.scanAndAnonymize(text, dismissedViolations);

        // Record violations if any found
        if (result.hasIssues && result.foundViolations.length > 0) {
            const contextSnippet = text.length > 100 ? text.substring(0, 100) + '...' : text;
            
            for (const violation of result.foundViolations) {
                await this.issueService.addIssue(violation, contextSnippet);
            }
        }

        return result;
    }
}

