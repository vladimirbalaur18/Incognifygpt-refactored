// core/services/AIServiceRegistryFactory.ts
// import { ClaudeAdapter } from '../domain/ai-service/adapters/ClaudeAdapter';

import { ChatGPTAdapter } from "@/core/infrastructure/ai-services/ChatGPTAdapter";
import { GeminiAdapter } from "@/core/infrastructure/ai-services/GeminiAdapter";
import { AIServiceRegistry } from "@/core/application/services/ai-service/AIServiceRegistry";

export class AIServiceRegistryFactory {
    static create(): AIServiceRegistry {
        const registry = new AIServiceRegistry();
        
        registry.register(new ChatGPTAdapter());
        registry.register(new GeminiAdapter());
        // registry.register(new ClaudeAdapter());
        
        return registry;
    }
}