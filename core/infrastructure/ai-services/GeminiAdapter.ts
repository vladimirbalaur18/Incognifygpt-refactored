import { ExtractionContext, ExtractionSource, IAIServiceAdapter, MessageExtractionResult } from "@/core/domain/ai-service/AIServiceAdapter";
import { AIServiceType } from "@/core/domain/ai-service/AIServiceType";

export class GeminiAdapter implements IAIServiceAdapter {
    readonly serviceType = AIServiceType.GEMINI;
    readonly supportedDomains = ['gemini.google.com', 'bard.google.com'];
    readonly extractionSource = ExtractionSource.DOM;
    
    // Common selectors for Gemini's input field - try multiple selectors
    private readonly inputSelectors = [
        'textarea[aria-label*="message"]',
        'textarea[aria-label*="Message"]',
        'textarea[placeholder*="message"]',
        'textarea[placeholder*="Message"]',
        '[contenteditable="true"][aria-label*="message"]',
        '[contenteditable="true"][aria-label*="Message"]',
        'textarea',
        '[contenteditable="true"]'
    ];
    
    canHandle(url: string): boolean {
        return this.supportedDomains.some(domain => url.includes(domain));
    }
    
    extractUserMessage(context: ExtractionContext): MessageExtractionResult | null {
        // For DOM extraction, payload should be a selector string or we'll use default selectors
        const selector = typeof context.payload === 'string' && context.payload.trim() 
            ? context.payload 
            : null;
        
        // Try the provided selector first, then fall back to default selectors
        const selectorsToTry = selector 
            ? [selector, ...this.inputSelectors]
            : this.inputSelectors;
        
        let inputElement: HTMLElement | null = null;
        
        for (const sel of selectorsToTry) {
            try {
                const element = document.querySelector(sel) as HTMLElement;
                if (element) {
                    // Check if element is visible and has content
                    const text = this.getElementText(element);
                    if (text && text.trim().length > 0) {
                        inputElement = element;
                        break;
                    }
                }
            } catch {
                // Invalid selector, continue to next
                continue;
            }
        }
        
        if (!inputElement) {
            console.log('[GeminiAdapter] No input element found with any selector');
            return null;
        }
        
        const userMessage = this.getElementText(inputElement);
        
        if (!userMessage || userMessage.trim().length === 0) {
            return null;
        }
        
        // Store the selector and element reference for later update
        const elementSelector = this.findSelectorForElement(inputElement);
        
        return {
            userMessage: userMessage.trim(),
            messagePath: [elementSelector], // Store selector as path for DOM updates
            payload: {
                selector: elementSelector,
                element: inputElement, // Store reference (though it may become stale)
            },
        };
    }
    
    updatePayload(context: ExtractionContext, anonymizedText: string): void {
        // For DOM updates, we need to find and update the element
        const extractionResult = context.payload as MessageExtractionResult;
        const selector = Array.isArray(extractionResult.messagePath) && extractionResult.messagePath.length > 0
            ? String(extractionResult.messagePath[0])
            : null;
        
        if (!selector) {
            console.warn('[GeminiAdapter] No selector found in messagePath for DOM update');
            return;
        }
        
        try {
            const element = document.querySelector(selector) as HTMLElement;
            if (!element) {
                console.warn(`[GeminiAdapter] Element not found with selector: ${selector}`);
                return;
            }
            
            // Update the element based on its type
            if (element instanceof HTMLTextAreaElement) {
                element.value = anonymizedText;
                // Trigger input event to notify the app
                element.dispatchEvent(new Event('input', { bubbles: true }));
            } else if (element.isContentEditable) {
                element.textContent = anonymizedText;
                // Trigger input event
                element.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                // Fallback: try setting value or textContent
                if (element instanceof HTMLInputElement) {
                    element.value = anonymizedText;
                } else if ('value' in element && typeof (element as { value?: string }).value === 'string') {
                    (element as { value: string }).value = anonymizedText;
                } else {
                    element.textContent = anonymizedText;
                }
                element.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            console.log('[GeminiAdapter] Updated DOM element with anonymized text');
        } catch (e) {
            console.error('[GeminiAdapter] Error updating DOM element:', e);
        }
    }
    
    /**
     * Get text content from an element, handling both textarea and contenteditable
     */
    private getElementText(element: HTMLElement): string {
        if (element instanceof HTMLTextAreaElement) {
            return element.value;
        } else if (element instanceof HTMLInputElement) {
            return element.value;
        } else if (element.isContentEditable) {
            return element.textContent || element.innerText || '';
        } else if ('value' in element && typeof (element as { value?: string }).value === 'string') {
            return (element as { value: string }).value || '';
        } else {
            return element.textContent || element.innerText || '';
        }
    }
    
    /**
     * Find a unique selector for an element
     * Falls back to a simple selector if unique one can't be found
     */
    private findSelectorForElement(element: HTMLElement): string {
        // Try ID first
        if (element.id) {
            return `#${element.id}`;
        }
        
        // Try aria-label
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) {
            return `[aria-label="${ariaLabel}"]`;
        }
        
        // Try placeholder
        if (element instanceof HTMLTextAreaElement && element.placeholder) {
            return `textarea[placeholder="${element.placeholder}"]`;
        }
        
        // Try class names
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.split(' ').filter(c => c.trim());
            if (classes.length > 0) {
                // Use the first class, but this might not be unique
                return `.${classes[0]}`;
            }
        }
        
        // Fallback to tag name (least specific)
        return element.tagName.toLowerCase();
    }
}

