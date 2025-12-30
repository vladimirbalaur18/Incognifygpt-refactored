import { IAIServiceAdapter } from "./AIServiceAdapter";
import { AIServiceType } from "./AIServiceType";

export class AIServiceRegistry {
    private adapters: Map<AIServiceType, IAIServiceAdapter> = new Map();
    private domainToAdapter: Map<string, IAIServiceAdapter> = new Map();
    
    register(adapter: IAIServiceAdapter): void {   
        this.adapters.set(adapter.serviceType, adapter);
        
        // create index by domain for fast lookup
        adapter.supportedDomains.forEach(domain => {
            this.domainToAdapter.set(domain, adapter);
        });
    }
    
    getAdapterForUrl(url: string, method: string): IAIServiceAdapter | null {
        const hostname = new URL(url).hostname;
        const domainAdapter = this.domainToAdapter.get(hostname);
        if (domainAdapter && domainAdapter.canHandle(url, method)) {
            return domainAdapter;
        }
        
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
