import { AIServiceRegistryFactory } from "@/core/application/services/ai-service/AIServiceRegistryFactory";
import { ExtractionSource } from "@/core/domain/ai-service/AIServiceAdapter";

export default defineUnlistedScript(() => {
    const aiServiceRegistry = AIServiceRegistryFactory.create();

    // Listen for registry initialization from content script (optional)
    window.addEventListener('message', (event) => {
        if (event.data?.type === 'INCOGNIFY_INIT_REGISTRY') {
            console.log('[IncognifyGPT] Registry initialization signal received.');
        }
    });

    console.log('[IncognifyGPT] Interceptor initializing with registry...');

    if (!aiServiceRegistry) {
        console.log('[IncognifyGPT] Registry not initialized, cannot intercept get adapter for url');
        return;
    }
    const currentUrl = window.location.href; // or window.location.origin + window.location.pathname

    const aiServiceAdapter = aiServiceRegistry.getAdapterForUrl(currentUrl);

    if (!aiServiceAdapter) {
        console.log(`[IncognifyGPT] No adapter found for ${currentUrl}`);
        return;
    }

    if (aiServiceAdapter.extractionSource === ExtractionSource.NETWORK) {
        console.log(`[IncognifyGPT] Adapter ${aiServiceAdapter.serviceType} is a network adapter`);

        const originalFetch = window.fetch;
        window.fetch = async function (...args) {
            const [url, config] = args;

            if (!aiServiceRegistry || typeof url !== 'string' || !config?.body) {
                console.log('[IncognifyGPT] Registry not initialized or invalid request, proceeding with original fetch.');
                console.log('[IncognifyGPT] Resource:', url);
                console.log('[IncognifyGPT] Config:', config);
                console.log('[IncognifyGPT] Registry:', aiServiceRegistry);
                return originalFetch.apply(this, args);
            }

            try {
                const requestId = Math.random().toString(36).substring(7);
                const extractionResult = aiServiceAdapter.extractUserMessage({ payload: config.body });

                if (!extractionResult?.userMessage) {
                    console.log(`[IncognifyGPT] No user message extracted for ${aiServiceAdapter.serviceType}`);
                    return originalFetch.apply(this, args);
                }

                console.log('[IncognifyGPT] Extracted user message:', extractionResult.userMessage);
                console.log('[IncognifyGPT] Original body:', config.body);
                console.log('[IncognifyGPT] Payload structure:', extractionResult.payload);
                console.log('[IncognifyGPT] Message path:', extractionResult.messagePath);

                const response = await new Promise((resolve) => {
                    let resolved = false;

                    const handler = (event: MessageEvent) => {
                        if (
                            event.source === window &&
                            event.data.type === 'INCOGNIFY_INTERCEPT_RESPONSE' &&
                            event.data.id === requestId
                        ) {
                            if (resolved) return;
                            resolved = true;
                            window.removeEventListener('message', handler);
                            resolve(event.data.result);
                        }
                    };

                    window.addEventListener('message', handler);

                    // Send the message after setting up the listener
                    window.postMessage({
                        type: 'GPT_INTERCEPT_REQUEST',
                        id: requestId,
                        text: extractionResult.userMessage,
                    }, '*');

                    // Timeout after 5 seconds
                    setTimeout(() => {
                        if (resolved) return;
                        resolved = true;
                        console.warn('[IncognifyGPT] Scan timeout - proceeding without anonymization');
                        window.removeEventListener('message', handler);
                        resolve(null);
                    }, 5000);
                }) as {
                    hasIssues: boolean;
                    anonymizedText: string;
                } | null;

                if (response && response.anonymizedText) {
                    const updatedPayload = aiServiceAdapter.updatePayload(
                        {
                            payload: {
                                payload: extractionResult.payload,
                                messagePath: extractionResult.messagePath
                            }
                        },
                        response.anonymizedText
                    );
                    config.body = JSON.stringify(updatedPayload);
                    console.log('[IncognifyGPT] Updated payload with anonymized text:', updatedPayload);
                    console.log('[IncognifyGPT] New body:', config.body);
                }

                console.log(`[IncognifyGPT] Intercepted ${aiServiceAdapter.serviceType} message`);

                window.postMessage({
                    type: 'GPT_INTERCEPT_REQUEST',
                    id: requestId,
                    text: extractionResult.userMessage,
                }, '*');


            } catch (e) {
                console.error('[IncognifyGPT] Error intercepting fetch:', e);
            }
            return originalFetch.apply(this, args)
            // Check if it's a ChatGPT conversation request
            // Targeting /conversation endpoint
            /*  if (
                  typeof resource === 'string' &&
                  resource.includes('/conversation') &&
                  config &&
                  config.method === 'POST' &&
                  config.body
              ) {
                  try {
                      const body = JSON.parse(config.body);
                      let userMessage = null;
                      let messagePath = null; // [messageIndex, partIndex]
      
                      // Find the user message in the payload
                      if (body.messages && Array.isArray(body.messages)) {
                          for (let i = 0; i < body.messages.length; i++) {
                              const msg = body.messages[i];
                              // filter for author role to be user to  avoid scanning non-user content
                              if (
                                  msg.content &&
                                  msg.content.parts &&
                                  Array.isArray(msg.content.parts) &&
                                  msg.content.parts.length > 0 &&
                                  (msg.role === 'user' || msg.author?.role === 'user')
                              ) {
                                  // First part is the text we care about (i hope) 
                                  if (typeof msg.content.parts[0] === 'string') {
                                      userMessage = msg.content.parts[0];
                                      messagePath = [i, 0];
                                      break;
                                  }
                              }
                          }
                      }
      
                      if (userMessage) {
                          console.log(
                              '[IncognifyGPT] Intercepted user message, requesting scan...'
                          );
                          const requestId = Math.random().toString(36).substring(7);
      
                          // Send to content script
                          window.postMessage(
                              {
                                  type: 'GPT_INTERCEPT_REQUEST',
                                  id: requestId,
                                  text: userMessage,
                              },
                              '*'
                          );
      
                          // Wait for response with a strict timeout
                          const response = await new Promise((resolve) => {
                              let resolved = false;
      
                              const handler = (event) => {
                                  if (
                                      event.source === window &&
                                      event.data.type === 'GPT_INTERCEPT_RESPONSE' &&
                                      event.data.id === requestId
                                  ) {
                                      if (resolved) return;
                                      resolved = true;
                                      window.removeEventListener('message', handler);
                                      resolve(event.data.result);
                                  }
                              };
      
                              window.addEventListener('message', handler);
      
                              // Shorter timeout to prevent perceived hanging
                              setTimeout(() => {
                                  if (resolved) return;
                                  resolved = true;
                                  console.warn(
                                      '[IncognifyGPT] Scan timeout - releasing request'
                                  );
                                  window.removeEventListener('message', handler);
                                  resolve(null);
                              }, 2500);
                          });
      
                          if (response && response.anonymizedText) {
                              // Update the payload with anonymized text
                              if (messagePath) {
                                  body.messages[messagePath[0]].content.parts[
                                      messagePath[1]
                                  ] = response.anonymizedText;
                                  config.body = JSON.stringify(body);
                                  console.log(
                                      '[IncognifyGPT] Payload updated with anonymized text'
                                  );
                              }
                          }
                      }
                  } catch (e) {
                      console.error('[IncognifyGPT] Error intercepting fetch:', e);
                      // Original fetch on error
                  }
              }
              return originalFetch.apply(this, args);*/
        };
    } else {
        console.log(`[IncognifyGPT] Adapter ${aiServiceAdapter.serviceType} is a DOM adapter`);

        // Track if we're currently processing a submission to prevent double-processing
        let isProcessingSubmission = false;
        let pendingSubmission: (() => void) | null = null;
        let isRetriggeringSubmission = false; // Flag to prevent intercepting our own re-triggered events

        // Function to extract, anonymize, and update message
        const processMessageSubmission = async (event?: Event): Promise<boolean> => {
            if (isProcessingSubmission) {
                console.log('[IncognifyGPT] Already processing a submission, skipping...');
                return false;
            }

            try {
                isProcessingSubmission = true;

                // Extract message from DOM
                const extractionResult = aiServiceAdapter.extractUserMessage({ payload: '' });

                if (!extractionResult?.userMessage) {
                    console.log(`[IncognifyGPT] No user message extracted from DOM for ${aiServiceAdapter.serviceType}`);
                    isProcessingSubmission = false;
                    return false;
                }

                console.log('[IncognifyGPT] Extracted user message from DOM:', extractionResult.userMessage);

                // Prevent default submission temporarily
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                const requestId = Math.random().toString(36).substring(7);

                // Request anonymization
                const response = await new Promise<{
                    hasIssues: boolean;
                    anonymizedText: string;
                } | null>((resolve) => {
                    let resolved = false;

                    const handler = (event: MessageEvent) => {
                        if (
                            event.source === window &&
                            event.data.type === 'INCOGNIFY_INTERCEPT_RESPONSE' &&
                            event.data.id === requestId
                        ) {
                            if (resolved) return;
                            resolved = true;
                            window.removeEventListener('message', handler);
                            resolve(event.data.result);
                        }
                    };

                    window.addEventListener('message', handler);

                    // Send the message after setting up the listener
                    window.postMessage({
                        type: 'GPT_INTERCEPT_REQUEST',
                        id: requestId,
                        text: extractionResult.userMessage,
                    }, '*');

                    // Timeout after 5 seconds
                    setTimeout(() => {
                        if (resolved) return;
                        resolved = true;
                        console.warn('[IncognifyGPT] Scan timeout - proceeding without anonymization');
                        window.removeEventListener('message', handler);
                        resolve(null);
                    }, 5000);
                });

                // Update DOM with anonymized text
                if (response && response.anonymizedText) {
                    aiServiceAdapter.updatePayload(
                        {
                            payload: extractionResult
                        },
                        response.anonymizedText
                    );
                    console.log('[IncognifyGPT] Updated DOM with anonymized text');
                } else {
                    console.log('[IncognifyGPT] No anonymization applied, using original text');
                }

                // Trigger the original submission after a short delay to ensure DOM is updated
                setTimeout(() => {
                    isProcessingSubmission = false;
                    if (pendingSubmission) {
                        const submitFn = pendingSubmission;
                        pendingSubmission = null;
                        isRetriggeringSubmission = true;
                        try {
                            submitFn();
                        } finally {
                            // Reset flag after a short delay to allow the event to complete
                            setTimeout(() => {
                                isRetriggeringSubmission = false;
                            }, 50);
                        }
                    }
                }, 100);

                return true;
            } catch (e) {
                console.error('[IncognifyGPT] Error processing DOM submission:', e);
                isProcessingSubmission = false;
                if (pendingSubmission) {
                    const submitFn = pendingSubmission;
                    pendingSubmission = null;
                    isRetriggeringSubmission = true;
                    try {
                        submitFn();
                    } finally {
                        setTimeout(() => {
                            isRetriggeringSubmission = false;
                        }, 50);
                    }
                }
                return false;
            }
        };

        // Intercept form submissions
        document.addEventListener('submit', async (event) => {
            // Skip if this is our own re-triggered submission
            if (isRetriggeringSubmission) {
                return;
            }

            const target = event.target as HTMLElement;
            if (!target || target.tagName !== 'FORM') {
                return;
            }

            // Check if this form contains the input we're monitoring
            const extractionResult = aiServiceAdapter.extractUserMessage({ payload: '' });
            if (!extractionResult?.userMessage) {
                return; // Not our form, let it proceed normally
            }

            const processed = await processMessageSubmission(event);
            if (processed) {
                pendingSubmission = () => {
                    // Re-trigger form submission
                    const form = target as HTMLFormElement;
                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                    form.dispatchEvent(submitEvent);
                    if (!submitEvent.defaultPrevented) {
                        form.submit();
                    }
                };
            }
        }, true); // Use capture phase to intercept early

        // Intercept button clicks (send button)
        document.addEventListener('click', async (event) => {
            // Skip if this is our own re-triggered submission
            if (isRetriggeringSubmission) {
                return;
            }

            const target = event.target as HTMLElement;
            if (!target) return;

            // Check if this is likely a send/submit button
            const isSendButton = 
                target.tagName === 'BUTTON' ||
                (target.closest('button') !== null) ||
                target.getAttribute('aria-label')?.toLowerCase().includes('send') ||
                target.getAttribute('aria-label')?.toLowerCase().includes('submit') ||
                target.textContent?.toLowerCase().includes('send') ||
                target.classList.toString().toLowerCase().includes('send') ||
                target.classList.toString().toLowerCase().includes('submit');

            if (!isSendButton) {
                return;
            }

            // Check if there's a message to extract
            const extractionResult = aiServiceAdapter.extractUserMessage({ payload: '' });
            if (!extractionResult?.userMessage || extractionResult.userMessage.trim().length === 0) {
                return; // No message, let it proceed normally
            }

            const processed = await processMessageSubmission(event);
            if (processed) {
                pendingSubmission = () => {
                    // Re-trigger button click
                    const button = target.closest('button') || target;
                    if (button instanceof HTMLElement) {
                        button.click();
                    }
                };
            }
        }, true); // Use capture phase

        // Intercept Enter key in input fields
        document.addEventListener('keydown', async (event) => {
            // Skip if this is our own re-triggered submission
            if (isRetriggeringSubmission) {
                return;
            }

            if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.metaKey) {
                return; // Only handle plain Enter key
            }

            const target = event.target as HTMLElement;
            if (!target) return;

            // Check if target is an input field (textarea, contenteditable, etc.)
            const isInputField = 
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLInputElement ||
                (target.isContentEditable && target.tagName !== 'BODY');

            if (!isInputField) {
                return;
            }

            // Check if there's a message to extract
            const extractionResult = aiServiceAdapter.extractUserMessage({ payload: '' });
            if (!extractionResult?.userMessage || extractionResult.userMessage.trim().length === 0) {
                return; // No message, let it proceed normally
            }

            const processed = await processMessageSubmission(event);
            if (processed) {
                pendingSubmission = () => {
                    // Re-trigger Enter key
                    const enterEvent = new KeyboardEvent('keydown', {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        which: 13,
                        bubbles: true,
                        cancelable: true
                    });
                    target.dispatchEvent(enterEvent);
                };
            }
        }, true); // Use capture phase

        console.log('[IncognifyGPT] DOM submission interceptor set up');
    }



})