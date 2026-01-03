import ReactDOM from 'react-dom/client';
import React, { useState, useEffect } from 'react';
import { IssueProvider, useIssues } from '@/context/IssuesContext';
import { EmailIssueModal } from '@/components/EmailIssueModal';
import '@/assets/globals.css';
import { AIServiceRegistryFactory } from '@/core/application/services/ai-service/AIServiceRegistryFactory';

export default defineContentScript({
    matches: ['*://chatgpt.com/*', '*://chat.openai.com/*', '*://gemini.google.com/*',
        '*://ai.google.dev/*'],
    cssInjectionMode: 'ui',

    async main(ctx) {

        console.log('[IncognifyGPT] Content script loaded.');

        // Debug: Visual confirmation
        document.body.style.borderTop = '5px solid #449bffff';
        console.log(
            '[IncognifyGPT] If you see a red line at the top of the page, the extension is active.'
        );

        // 1. Setup Messaging
        setupMessageListener();

        // 2. Inject the interceptor script
        try {
            await injectScript('/injected.js', {
                keepInDom: true,
            });
            // await injectInterceptor();
            await initializeInterceptor();


        } catch (e) {
            console.error('[IncognifyGPT] Failed to inject interceptor:', e);
        }

        // 3. Mount the UI
        try {
            const ui = await createShadowRootUi(ctx, {
                name: 'incognify-gpt-ui',
                position: 'inline',
                anchor: 'body',
                append: 'last',
                // zIndex removed as it might not be in the type definition for this version of WXT
                // We will handle Z-Index in the React component itself
                onMount: (container) => {
                    // Ensure container sits on top if possible via style
                    container.style.position = 'relative';
                    container.style.zIndex = '2147483647';

                    const root = ReactDOM.createRoot(container);
                    root.render(
                        <IssueProvider>
                            <ContentApp />
                        </IssueProvider>
                    );
                    return root;
                },
                onRemove: (root) => {
                    root?.unmount();
                },
            });
            ui.mount();
        } catch (e) {
            console.error('[IncognifyGPT] Failed to mount UI:', e);
        }
    },
});

function setupMessageListener() {
    console.log('[IncognifyGPT] Setting up message listener...');
    window.addEventListener('message', async (event) => {
        // Log EVERYTHING relevant to see what's happening
        if (event.data?.type === 'GPT_INTERCEPT_REQUEST') {
            console.log('[IncognifyGPT] Received REQUEST event:', event.data);

            const { id, text } = event.data;
            let response = {
                hasIssues: false,
                anonymizedText: text,
                foundViolations: [],
            };

            try {
                console.log('[IncognifyGPT] Sending to background...');
                response = await browser.runtime.sendMessage({
                    type: 'SCAN_TEXT',
                    text,
                });
                console.log('[IncognifyGPT] Background response:', response);
            } catch (error) {
                console.error('[IncognifyGPT] Background scan failed:', error);
                // Proceed with default response (no issues) so we don't hang
            }

            console.log('[IncognifyGPT] Replying to injected script...');
            window.postMessage(
                {
                    type: 'INCOGNIFY_INTERCEPT_RESPONSE',
                    id,
                    result: response,
                },
                '*'
            );

            if (response && response.hasIssues) {
                console.log('[IncognifyGPT] Dispatching open modal event');
                window.dispatchEvent(new CustomEvent('incognify-open-modal'));
            }
        }
    });
}

function ContentApp() {
    const [isOpen, setIsOpen] = useState(false);
    const { refreshIssues } = useIssues();

    useEffect(() => {
        const handleOpenModal = async () => {
            console.log('[IncognifyGPT] ContentApp received open command');
            await refreshIssues();
            setIsOpen(true);
        };

        window.addEventListener('incognify-open-modal', handleOpenModal);
        return () => {
            window.removeEventListener('incognify-open-modal', handleOpenModal);
        };
    }, [refreshIssues]);

    return <EmailIssueModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}



async function initializeInterceptor() {
    // Create registry instance (or get from background)
    const registry = AIServiceRegistryFactory.create();

    // Send registry config to injected script

    console.log('[IncognifyGPT] Initializing interceptor with registry:', registry);
    window.postMessage({
        type: 'INCOGNIFY_INIT_REGISTRY',
        registry: registry, // Or serialize adapter configs
    }, '*');
}