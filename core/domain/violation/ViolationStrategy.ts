import { ViolationTypes } from "./ViolationType";


export interface IViolationStrategy  {
  type: ViolationTypes;
  rule: (payload: string) => boolean;
  description: string;
};

export class ViolationStrategy implements IViolationStrategy {
  constructor(
    public type: ViolationTypes,
    public rule: (payload: string) => boolean,
    public description: string
  ) {}
}