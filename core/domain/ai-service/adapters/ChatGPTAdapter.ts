import { IAIServiceAdapter, MessageExtractionResult } from "../AIServiceAdapter";
import { AIServiceType } from "../AIServiceType";

// core/domain/ai-service/adapters/ChatGPTAdapter.ts
export class ChatGPTAdapter implements IAIServiceAdapter {
    readonly serviceType = AIServiceType.CHATGPT;
    readonly supportedDomains = ['chatgpt.com', 'chat.openai.com'];
    readonly endpointPatterns = ['/conversation'];
    
    canHandle(url: string, method: string): boolean {
        return this.endpointPatterns.some(pattern => url.includes(pattern)) 
            && method === 'POST';
    }
    
    extractUserMessage(requestBody: unknown): MessageExtractionResult | null {
        // Current ChatGPT logic from injected.js
        if (requestBody && typeof requestBody === 'object' && 'messages' in requestBody && Array.isArray(requestBody.messages)) {
            for (let i = 0; i < requestBody.messages.length; i++) {
                const msg = requestBody.messages[i];
                if (
                    msg.content &&
                    typeof msg.content === 'object' &&
                    'parts' in msg.content &&
                    Array.isArray(msg.content.parts) &&
                    msg.content.parts.length > 0 &&
                    (msg.role === 'user' || msg.author?.role === 'user')
                ) {
                    if (typeof msg.content.parts[0] === 'string') {
                        return {
                            userMessage: msg.content.parts[0],
                            messagePath: [i, 0],
                            payload: requestBody,
                        };
                    }
                }
            }
        }
        return null;
    }
    
    updatePayload(
        payload: unknown,
        messagePath: (string | number)[],
        anonymizedText: string
    ): unknown {
        // Navigate path and update
        const [index, ...rest] = messagePath;
        let target = payload && typeof payload === 'object' && 'messages' in payload ? (payload.messages as unknown[])[index as number] : null;
        if (!target) return payload;
        for (const key of rest) {
            target = target && typeof target === 'object' && key in target ? target[key as keyof typeof target] : null;
            if (!target) return payload;
        }
        target = anonymizedText;
        return payload;
    }
}