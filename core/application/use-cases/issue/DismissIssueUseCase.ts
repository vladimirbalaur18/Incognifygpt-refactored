import { IssueService } from "@/core/application/services/issue/IssueService";
/**
 * Use case: Dismiss an issue
 * Encapsulates the business logic for dismissing issues
 */
export class DismissIssueUseCase {
    constructor(private issueService: IssueService) {}

    /**
     * Execute the dismiss workflow
     * @param issueId - The ID of the issue to dismiss
     */
    async execute(issueId: string): Promise<void> {
        if (!issueId || !issueId.trim()) {
            throw new Error('Issue ID is required');
        }

        await this.issueService.dismissIssue(issueId);
    }
}

