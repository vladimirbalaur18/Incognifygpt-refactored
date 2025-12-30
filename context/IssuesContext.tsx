import type React from 'react';
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from 'react';
import type { IViolation } from "@/core/domain/violation/Violation";
import { 
    getIssueService, 
    getDismissIssueUseCase,
    getIssueRepository 
} from '@/core/infrastructure/dependencies';
import { IssueState } from '@/core/domain/issue/Issue';
import { Violation } from '@/core/domain/violation/Violation';

interface IssueContextType {
    state: IssueState;
    addIssue: (violation: IViolation, context?: string) => Promise<void>;
    dismissIssue: (issueId: string) => Promise<void>;
    getActiveIssues: () => IViolation[];
    refreshIssues: () => Promise<void>;
}

const IssueContext = createContext<IssueContextType | undefined>(undefined);

export function IssueProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<IssueState>({
        activeIssues: [],
        history: [],
    });

    const refreshIssues = useCallback(async () => {
        const issueService = getIssueService();
        const issues = await issueService.getAllIssues();
        setState(issues);
    }, []);

    useEffect(() => {
        refreshIssues();

        // Listen for storage changes to sync across tabs/components
        const issueRepository = getIssueRepository();
        const handleStorageChange = (
            changes: { [key: string]: unknown },
            areaName: string
        ) => {
            if (areaName === 'local' && changes[issueRepository.storageKey]) {
                refreshIssues();
            }
        };

        browser.storage.onChanged.addListener(handleStorageChange);
        return () => {
            browser.storage.onChanged.removeListener(handleStorageChange);
        };
    }, [refreshIssues]);

    const addIssue = async (violation: IViolation, context?: string) => {
        const issueService = getIssueService();
        // Convert IViolation to Violation
        const violationInstance = new Violation(
            violation.id,
            violation.type,
            violation.payload,
            violation.detectedAt,
            violation.dismissedUntil,
            violation.context
        );
        await issueService.addIssue(violationInstance, context);
        // refreshIssues will be called by the storage listener
    };

    const dismissIssue = async (issueId: string) => {
        const dismissUseCase = getDismissIssueUseCase();
        await dismissUseCase.execute(issueId);
        // refreshIssues will be called by the storage listener
    };

    const getActiveIssues = () => {
        const now = Date.now();
        return state.activeIssues.filter(
            (issue) => !issue.dismissedUntil || issue.dismissedUntil < now
        );
    };

    return (
        <IssueContext.Provider
            value={{
                state,
                addIssue,
                dismissIssue,
                getActiveIssues,
                refreshIssues,
            }}
        >
            {children}
        </IssueContext.Provider>
    );
}

export function useIssues() {
    const context = useContext(IssueContext);
    if (!context) {
        throw new Error('useIssues must be used within IssueProvider');
    }
    return context;
}
