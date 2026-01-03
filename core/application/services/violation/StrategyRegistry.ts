import { ViolationStrategy, IViolationStrategy } from "@/core/domain/violation/ViolationStrategy";
import { ViolationTypes } from "@/core/domain/violation/ViolationType";

export interface IStrategyRegistry{
    register(type: ViolationTypes, strategy: ViolationStrategy): void;
    get(type: ViolationTypes): IViolationStrategy | undefined;
    getAll(): IViolationStrategy[];
}

export class StrategyRegistry implements IStrategyRegistry {
    private strategies = new Map<ViolationTypes, IViolationStrategy>();

    register(type: ViolationTypes, strategy: IViolationStrategy): void {
        this.strategies.set(type, strategy);
    }

    get(type: ViolationTypes): IViolationStrategy | undefined {
        return this.strategies.get(type);
    }

    getAll(): IViolationStrategy[] {
        return Array.from(this.strategies.values());
    }
}

