// core/services/AIServiceRegistryFactory.ts
import { AIServiceRegistry } from '../domain/ai-service/AIServiceRegistry';
import { ChatGPTAdapter } from '../domain/ai-service/adapters/ChatGPTAdapter';
// import { ClaudeAdapter } from '../domain/ai-service/adapters/ClaudeAdapter';

export class AIServiceRegistryFactory {
    static create(): AIServiceRegistry {
        const registry = new AIServiceRegistry();
        
        registry.register(new ChatGPTAdapter());
        //registry.register(new GeminiAdapter());
        // registry.register(new ClaudeAdapter());
        
        return registry;
    }
}