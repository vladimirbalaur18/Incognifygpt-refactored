import { IAIServiceAdapter } from "../../../domain/ai-service/AIServiceAdapter";
import { AIServiceType } from "../../../domain/ai-service/AIServiceType";

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
    
    getAdapterForUrl(url: string): IAIServiceAdapter | null {
        const hostname = new URL(url).hostname;
        const domainAdapter = this.domainToAdapter.get(hostname);

        console.log("Looking for adapter for URL:", url, "Hostname:", hostname, "Found domain adapter:", domainAdapter);
        if (domainAdapter && domainAdapter.canHandle(url)) {
            return domainAdapter;
        }
        
        for (const adapter of this.adapters.values()) {
            if (adapter.canHandle(url)) {
                console.log("Adapter found by canHandle:", adapter.serviceType);
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
