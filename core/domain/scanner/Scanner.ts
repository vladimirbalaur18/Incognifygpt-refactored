import { IViolationStrategy } from "../violation/ViolationStrategy";
import { IViolation } from "../violation/Violation";
import { ViolationTypes } from "../violation/ViolationType";
import { IStrategyRegistry } from "../../services/StrategyRegistry";
import { violationFactory } from "../violation/ViolationFactory";

export interface ScanResult {
    hasIssues: boolean;
    anonymizedText: string;
    foundViolations: IViolation[];
}

interface IdentifiedIssue {
    type: ViolationTypes;
    description: string;
    matches: string[];
}

interface StrategyWithRegex extends IViolationStrategy {
    getRegex(): RegExp;
}

/**
 * Type guard to check if a strategy has a getRegex method
 */
function hasGetRegex(strategy: IViolationStrategy): strategy is StrategyWithRegex {
    return 'getRegex' in strategy && typeof (strategy as StrategyWithRegex).getRegex === 'function';
}

export class Scanner {
    private readonly regexByType: Record<ViolationTypes, RegExp>;

    constructor(private readonly strategyRegistry: IStrategyRegistry) {
        // Build regexByType map from strategies in the registry
        this.regexByType = this.buildRegexMap();
    }

    /**
     * Builds the regex map from strategies in the registry
     */
    private buildRegexMap(): Record<ViolationTypes, RegExp> {
        const regexMap = {} as Record<ViolationTypes, RegExp>;
        const strategies = this.strategyRegistry.getAll();

        for (const strategy of strategies) {
            if (hasGetRegex(strategy)) {
                regexMap[strategy.type] = strategy.getRegex();
            }
        }

        return regexMap;
    }

    /**
     * Validates text against provided strategies and returns identified issues
     */
    private validateText(
        payload: string,
        strategies: IViolationStrategy[]
    ): IdentifiedIssue[] {
        return strategies.flatMap(strategy => {
            if (!strategy.rule(payload)) return [];

            const regex = this.regexByType[strategy.type];
            if (!regex) return [];

            regex.lastIndex = 0; // Reset regex state for safety

            const matches = [...payload.matchAll(regex)].map(m => m[0]);
            if (matches.length === 0) return [];

            return [{
                type: strategy.type,
                description: strategy.description,
                matches,
            }];
        });
    }

    /**
     * Creates a violation from a match using the ViolationFactory
     */
    private createViolation(type: ViolationTypes, payload: string): IViolation {
        return violationFactory.create(
            type as keyof typeof ViolationTypes,
            payload
        );
    }

    /**
     * Checks if a violation is dismissed
     */
    private isViolationDismissed(
        payload: string,
        dismissedIssues: IViolation[]
    ): boolean {
        return dismissedIssues.some(violation => violation.payload === payload);
    }

    /**
     * Anonymizes text by replacing matches with violation type markers
     */
    private anonymizeText(text: string, match: string, type: ViolationTypes): string {
        return text.replace(new RegExp(this.escapeRegex(match), 'g'), `[${type}]`);
    }

    /**
     * Escapes special regex characters in a string
     */
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Scans text for violations and anonymizes it
     */
    scanAndAnonymize(
        text: string,
        dismissedIssues: IViolation[] = []
    ): ScanResult {
        const foundViolations = new Map<string, IViolation>();
        let anonymizedText = text;

        const strategies = this.strategyRegistry.getAll();
        const identifiedIssues = this.validateText(text, strategies);

        identifiedIssues.forEach((issue) => {
            issue.matches.forEach((match) => {
                if (!this.isViolationDismissed(match, dismissedIssues)) {
                    // Use payload as key to avoid duplicates
                    if (!foundViolations.has(match)) {
                        const violation = this.createViolation(issue.type, match);
                        foundViolations.set(match, violation);
                        anonymizedText = this.anonymizeText(anonymizedText, match, issue.type);
                    }
                }
            });
        });

        return {
            hasIssues: foundViolations.size > 0,
            anonymizedText,
            foundViolations: Array.from(foundViolations.values()),
        };
    }
}
