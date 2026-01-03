import { getScanTextUseCase } from '@/core/infrastructure/dependencies';

export default defineBackground(() => {
    console.log('IncognifyGPT Background Service Worker Started');

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SCAN_TEXT') {
            console.log('[IncognifyGPT] Background received SCAN_TEXT:', message.text);
            handleScanRequest(message.text)
                .then(sendResponse)
                .catch((err) => {
                    console.error('Scan failed:', err);
                    sendResponse({
                        hasIssues: false,
                        anonymizedText: message.text,
                        foundViolations: [],
                        error: err.message,
                    });
                });
            return true;
        }
    });
});

async function handleScanRequest(text: string) {
    try {
        console.log('[IncognifyGPT] Handling scan request for text:', text);
        const scanTextUseCase = getScanTextUseCase();
        const result = await scanTextUseCase.execute(text);
        console.log('[IncognifyGPT] Scan result:', result);
        return result;
    } catch (error) {
        console.error('Error in handleScanRequest:', error);
        // Fail safe: return original text with no issues
        return {
            hasIssues: false,
            anonymizedText: text || '',
            foundViolations: [],
        };
    }
}
