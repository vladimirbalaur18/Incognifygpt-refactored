// core/domain/ai-service/IAIServiceAdapter.ts

import { AIServiceType } from "./AIServiceType";

 export enum ExtractionSource {
    NETWORK = 'NETWORK',
    DOM = 'DOM'
 }
export interface MessageExtractionResult {
    userMessage: string | null;
    messagePath: (string | number)[]; // Path to update the message in payload
    payload: unknown; // The parsed request body
}
export interface ExtractionContext {
    payload: unknown; // Could be a JSON object OR a DOM Selector string
}

export interface IAIServiceAdapter {
    readonly serviceType: AIServiceType;
    readonly supportedDomains: string[];
    readonly extractionSource: ExtractionSource;
    
    // We keep this generic so the Registry can filter adapters
    canHandle(url: string): boolean;

    // This now accepts a generic context instead of just a requestBody
    extractUserMessage(context: ExtractionContext): MessageExtractionResult | null;
    
    // For DOM, 'updatePayload' might mean manipulating the input field text
    updatePayload(context: ExtractionContext, anonymizedText: string): void | unknown;
}