import { AIServiceType } from "./AIServiceType";

// core/domain/ai-service/AIServiceAdapter.ts
export interface MessageExtractionResult {
    userMessage: string | null;
    messagePath: (string | number)[]; // Path to update the message in payload
    payload: unknown; // The parsed request body
}

export interface IAIServiceAdapter {
    /**
     * Unique identifier for this AI service
     */
    readonly serviceType: AIServiceType;
    
    /**
     * Domain patterns this adapter handles (e.g., ['chatgpt.com', 'chat.openai.com'])
     */
    readonly supportedDomains: string[];
    
    /**
     * URL patterns to intercept (e.g., ['/conversation', '/api/conversation'])
     */
    readonly endpointPatterns: string[];
    
    /**
     * Check if this adapter can handle the given request
     */
    canHandle(url: string, method: string): boolean;
    
    /**
     * Extract user message from the request payload
     */
    extractUserMessage(requestBody: unknown): MessageExtractionResult | null;
    
    /**
     * Update the request payload with anonymized text
     */
    updatePayload(
        payload: unknown, 
        messagePath: (string | number)[], 
        anonymizedText: string
    ): unknown;
}