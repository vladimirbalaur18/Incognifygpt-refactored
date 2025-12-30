import { IViolation, Violation } from "../violation/Violation";
import { violationFactory } from "../violation/ViolationFactory";

export interface IIssueState {
    activeIssues: IViolation[];
    history: IViolation[];
}

export class IssueState implements IIssueState{
    constructor(
        public activeIssues: Violation[] =[],
        public history: Violation[] = []
    ){}

    static fromData(data: IIssueState): IssueState{
        return new IssueState(
            data.activeIssues.map(v => violationFactory.fromData(v)),
            data.history.map(v => violationFactory.fromData(v))
        );
    }

    // Create empty state
    static empty(): IssueState {
        return new IssueState();
    }
}