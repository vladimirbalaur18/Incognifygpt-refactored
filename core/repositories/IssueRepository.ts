import { Violation } from "../domain/violation/Violation";
import { IStorageService } from "../services/StorageService";
import { IssueState, IIssueState } from "../domain/issue/Issue";

export interface IIssueRepository{
    getIssues(): Promise<IssueState>;
    saveIssues(issues: IssueState): Promise<void>;
    findViolationById(issueId: string): Promise<Violation | undefined>;
    findActiveViolationByPayload(payload: string): Promise<Violation | undefined>;
    getDismissedViolations(): Promise<Violation[]>;
    readonly storageKey: string;
}

const DEFAULT_STATE: IIssueState = {
    activeIssues: [],
    history: [],
};

/**
 * Repository for issue data access
 * This is a pure data access layer - business logic should be in services
 */
class IssueRepository implements IIssueRepository{
    
    constructor(private storage: IStorageService){}
    
    private readonly ISSUE_STORAGE_KEY = 'anonymizer_issues'

    get storageKey(): string {
        return this.ISSUE_STORAGE_KEY;
    }

    public async getIssues(): Promise<IssueState> {
        const data = await this.storage.get<IIssueState>(this.ISSUE_STORAGE_KEY);
        if (!data) {
            return IssueState.fromData(DEFAULT_STATE);
        }
        return IssueState.fromData(data);
    }

    public async saveIssues(issues: IssueState): Promise<void> {
        const data: IIssueState = {
            activeIssues: issues.activeIssues.map(v => ({
                id: v.id,
                type: v.type,
                payload: v.payload,
                detectedAt: v.detectedAt,
                dismissedUntil: v.dismissedUntil,
                context: v.context,
            })),
            history: issues.history.map(v => ({
                id: v.id,
                type: v.type,
                payload: v.payload,
                detectedAt: v.detectedAt,
                dismissedUntil: v.dismissedUntil,
                context: v.context,
            })),
        };
        await this.storage.set(this.ISSUE_STORAGE_KEY, data);
    }

    async findViolationById(issueId: string): Promise<Violation | undefined> {
        const issues = await this.getIssues();
        const allViolations = [...issues.activeIssues, ...issues.history];
        return allViolations.find(v => v.id === issueId);
    }

    async findActiveViolationByPayload(payload: string): Promise<Violation | undefined> {
        const issues = await this.getIssues();
        const now = Date.now();
        return issues.activeIssues.find(
            (v) => v.payload === payload && (!v.dismissedUntil || v.dismissedUntil < now)
        );
    }

    async getDismissedViolations(): Promise<Violation[]> {
        const issues = await this.getIssues();
        const now = Date.now();
        return issues.history.filter(
            (v) => v.dismissedUntil && v.dismissedUntil > now
        );
    }
}

export { IssueRepository };
