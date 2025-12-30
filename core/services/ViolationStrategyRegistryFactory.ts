// core/services/ViolationStrategyRegistryFactory.ts

import { StrategyRegistry, IStrategyRegistry } from './StrategyRegistry';
import { ViolationTypes } from '../domain/violation/ViolationType';
import {
    emailViolationStrategy,
    phoneNumberViolationStrategy,
    ipAddressViolationStrategy,
    urlViolationStrategy
} from '../domain/violation/ViolationStrategies';

export class ViolationStrategyRegistryFactory {
    static create(): IStrategyRegistry {
        const registry = new StrategyRegistry();
        
        registry.register(ViolationTypes.EMAIL_ADDRESS, emailViolationStrategy);
        registry.register(ViolationTypes.PHONE_NUMBER, phoneNumberViolationStrategy);
        registry.register(ViolationTypes.IP_ADDRESS, ipAddressViolationStrategy);
        registry.register(ViolationTypes.URL, urlViolationStrategy);
        
        return registry;
    }
}

export const strategyRegistry = ViolationStrategyRegistryFactory.create();