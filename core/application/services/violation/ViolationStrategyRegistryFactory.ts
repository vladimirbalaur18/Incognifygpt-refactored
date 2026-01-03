// core/services/ViolationStrategyRegistryFactory.ts

import { emailViolationStrategy, phoneNumberViolationStrategy, ipAddressViolationStrategy } from '@/core/domain/violation/ViolationStrategies';
import { ViolationTypes } from '@/core/domain/violation/ViolationType';
import { StrategyRegistry, IStrategyRegistry } from './StrategyRegistry';

export class ViolationStrategyRegistryFactory {
    static create(): IStrategyRegistry {
        const registry = new StrategyRegistry();
        
        registry.register(ViolationTypes.EMAIL_ADDRESS, emailViolationStrategy);
        registry.register(ViolationTypes.PHONE_NUMBER, phoneNumberViolationStrategy);
        registry.register(ViolationTypes.IP_ADDRESS, ipAddressViolationStrategy);
        // registry.register(ViolationTypes.URL, urlViolationStrategy);
        
        return registry;
    }
}

export const strategyRegistry = ViolationStrategyRegistryFactory.create();