import { IssueService } from '../services/IssueService';
import { Violation } from '../../domain/violation/Violation';

/**
 * Use case: Get active issues
 * Encapsulates the business logic for retrieving active issues
 */
export class GetActiveIssuesUseCase {
    constructor(private issueService: IssueService) {}

    /**
     * Execute the get active issues workflow
     * @returns Array of active violations
     */
    async execute(): Promise<Violation[]> {
        return await this.issueService.getActiveIssues();
    }
}

