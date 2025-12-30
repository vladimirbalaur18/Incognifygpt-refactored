import { ViolationTypes } from "./ViolationType";

export interface IViolation {
  id: string;
  type: keyof typeof ViolationTypes;
  payload: string;
  detectedAt: number;
  dismissedUntil?: number;
  context?: string;
}


export class Violation implements IViolation {
    constructor(
        public id: string,
        public type: keyof typeof ViolationTypes,
        public payload: string,
        public detectedAt: number,
        public dismissedUntil?: number,
        public context?: string
    ) {}
}

