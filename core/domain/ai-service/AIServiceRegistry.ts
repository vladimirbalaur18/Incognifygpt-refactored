import { IAIServiceAdapter } from "./AIServiceAdapter";
import { AIServiceType } from "./AIServiceType";

// core/domain/ai-service/AIServiceRegistry.ts
export class AIServiceRegistry {
    private adapters: Map<AIServiceType, IAIServiceAdapter> = new Map();
    private domainToAdapter: Map<string, IAIServiceAdapter> = new Map();
    
    register(adapter: IAIServiceAdapter): void {   
        this.adapters.set(adapter.serviceType, adapter);
        
        // Index by domain for fast lookup
        adapter.supportedDomains.forEach(domain => {
            this.domainToAdapter.set(domain, adapter);
        });
    }
    
    getAdapterForUrl(url: string, method: string): IAIServiceAdapter | null {
        // Try domain-based lookup first
        const hostname = new URL(url).hostname;
        const domainAdapter = this.domainToAdapter.get(hostname);
        if (domainAdapter && domainAdapter.canHandle(url, method)) {
            return domainAdapter;
        }
        
        // Fallback: check all adapters
        for (const adapter of this.adapters.values()) {
            if (adapter.canHandle(url, method)) {
                return adapter;
            }
        }
        
        return null;
    }
    
    getAdapterByType(type: AIServiceType): IAIServiceAdapter | null {
        return this.adapters.get(type) || null;
    }
    
    getAllAdapters(): IAIServiceAdapter[] {
        return Array.from(this.adapters.values());
    }
}