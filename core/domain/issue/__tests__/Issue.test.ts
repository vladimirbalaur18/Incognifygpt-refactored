import { describe, it, expect } from 'vitest';
import { IssueState } from '../Issue';
import { Violation } from '../../violation/Violation';
import { ViolationTypes } from '../../violation/ViolationType';

describe('IssueState', () => {
    describe('constructor', () => {
        it('should create empty state by default', () => {
            const state = new IssueState();

            expect(state.activeIssues).toEqual([]);
            expect(state.history).toEqual([]);
        });

        it('should create state with provided issues', () => {
            const violation = new Violation(
                'violation-1',
                ViolationTypes.EMAIL_ADDRESS,
                'test@example.com',
                Date.now()
            );

            const state = new IssueState([violation], [violation]);

            expect(state.activeIssues).toHaveLength(1);
            expect(state.history).toHaveLength(1);
            expect(state.activeIssues[0]).toBe(violation);
        });
    });

    describe('fromData', () => {
        it('should create state from data object', () => {
            const data = {
                activeIssues: [
                    {
                        id: 'violation-1',
                        type: ViolationTypes.EMAIL_ADDRESS,
                        payload: 'test@example.com',
                        detectedAt: Date.now(),
                    },
                ],
                history: [],
            };

            const state = IssueState.fromData(data);

            expect(state).toBeInstanceOf(IssueState);
            expect(state.activeIssues).toHaveLength(1);
            expect(state.activeIssues[0]).toBeInstanceOf(Violation);
            expect(state.activeIssues[0].payload).toBe('test@example.com');
        });

        it('should convert all violations to domain objects', () => {
            const data = {
                activeIssues: [
                    {
                        id: 'violation-1',
                        type: ViolationTypes.EMAIL_ADDRESS,
                        payload: 'test1@example.com',
                        detectedAt: Date.now(),
                    },
                    {
                        id: 'violation-2',
                        type: ViolationTypes.PHONE_NUMBER,
                        payload: '+1234567890',
                        detectedAt: Date.now(),
                    },
                ],
                history: [
                    {
                        id: 'violation-1',
                        type: ViolationTypes.EMAIL_ADDRESS,
                        payload: 'test1@example.com',
                        detectedAt: Date.now(),
                    },
                ],
            };

            const state = IssueState.fromData(data);

            expect(state.activeIssues).toHaveLength(2);
            expect(state.history).toHaveLength(1);
            state.activeIssues.forEach(v => {
                expect(v).toBeInstanceOf(Violation);
            });
        });
    });

    describe('empty', () => {
        it('should create an empty state', () => {
            const state = IssueState.empty();

            expect(state).toBeInstanceOf(IssueState);
            expect(state.activeIssues).toEqual([]);
            expect(state.history).toEqual([]);
        });
    });
});

