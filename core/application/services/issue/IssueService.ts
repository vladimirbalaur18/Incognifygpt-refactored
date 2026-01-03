import { Violation } from '@/core/domain/violation/Violation';
import { violationFactory } from '@/core/domain/violation/ViolationFactory';
import { IssueState } from '@/core/domain/issue/Issue';
import { IIssueRepository } from '@/core/infrastructure/repositories/IssueRepository';

const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Application service for managing issues
 * Contains business logic that was previously in the repository
 */
export class IssueService {
    constructor(private repository: IIssueRepository) {}

    /**
     * Add a violation as an issue if it doesn't already exist
     */
    async addIssue(violation: Violation, context?: string): Promise<void> {
        const issues = await this.repository.getIssues();
        const now = Date.now();

        // Check if this violation is already active
        const existingActive = issues.activeIssues.find(
            (v) =>
                v.payload === violation.payload &&
                (!v.dismissedUntil || v.dismissedUntil < now)
        );

        if (existingActive) {
            return; // Already exists, skip
        }

        // Create violation with context
        const newViolation = violationFactory.fromData({
            ...violation,
            context: context || undefined,
        });

        // Add to active issues and history
        issues.activeIssues.push(newViolation);
        issues.history.push(newViolation);

        await this.repository.saveIssues(issues);
    }

    /**
     * Dismiss an issue for 24 hours
     */
    async dismissIssue(issueId: string): Promise<void> {
        const issues = await this.repository.getIssues();
        const now = Date.now();
        const dismissUntil = now + DISMISS_DURATION;

        // Update in active issues
        issues.activeIssues = issues.activeIssues.map((issue) =>
            issue.id === issueId
                ? violationFactory.fromData({ ...issue, dismissedUntil: dismissUntil })
                : issue
        );

        // Update in history
        issues.history = issues.history.map((issue) =>
            issue.id === issueId
                ? violationFactory.fromData({ ...issue, dismissedUntil: dismissUntil })
                : issue
        );

        await this.repository.saveIssues(issues);
    }

    /**
     * Get all active (non-dismissed) issues
     */
    async getActiveIssues(): Promise<Violation[]> {
        const issues = await this.repository.getIssues();
        const now = Date.now();

        return issues.activeIssues.filter(
            (issue) => !issue.dismissedUntil || issue.dismissedUntil < now
        );
    }

    /**
     * Get all issues (active + history)
     */
    async getAllIssues(): Promise<IssueState> {
        return await this.repository.getIssues();
    }

    /**
     * Get dismissed violations (for filtering during scanning)
     */
    async getDismissedViolations(): Promise<Violation[]> {
        return await this.repository.getDismissedViolations();
    }
}

