import { ExtractionContext, ExtractionSource, IAIServiceAdapter, MessageExtractionResult } from "@/core/domain/ai-service/AIServiceAdapter";
import { AIServiceType } from "@/core/domain/ai-service/AIServiceType";

// core/domain/ai-service/adapters/ChatGPTAdapter.ts
export class ChatGPTAdapter implements IAIServiceAdapter {
    readonly serviceType = AIServiceType.CHATGPT;
    readonly supportedDomains = ['chatgpt.com', 'chat.openai.com'];
    readonly endpointPatterns = ['/conversation'];
    readonly extractionSource = ExtractionSource.NETWORK;
    
    canHandle(url: string): boolean {
        return this.endpointPatterns.some(pattern => url.includes(pattern))         
    }
    
    extractUserMessage({payload: data}: ExtractionContext): MessageExtractionResult | null {
        const requestBody = JSON.parse(data as string);
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
        context: ExtractionContext,
        anonymizedText: string
    ): unknown {
        // Navigate path and update
        const {payload,messagePath} = context.payload as MessageExtractionResult;
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