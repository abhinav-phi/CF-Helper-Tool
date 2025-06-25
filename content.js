(function() {
    'use strict';

    console.log('CF Helper content script loaded');

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        console.log('Content script received message:', request);
        
        if (request.action === 'extractProblem') {
            const problem = extractProblemData();
            console.log('Extracted problem:', problem);
            sendResponse({
                success: problem !== null,
                problem: problem
            });
        }
        return true;
    });

    function extractProblemData() {
        try {
            if (!isCodeforcesProblemsPage()) {
                console.log('Not a Codeforces problem page');
                return null;
            }

            const title = extractProblemTitle();
            const statement = extractProblemStatement();
            const timeLimit = extractTimeLimit();
            const memoryLimit = extractMemoryLimit();
            const examples = extractExamples();

            if (!title) {
                console.log('No title found');
                return null;
            }

            return {
                title: title,
                statement: statement,
                timeLimit: timeLimit,
                memoryLimit: memoryLimit,
                examples: examples,
                url: window.location.href
            };

        } catch (error) {
            console.error('Error extracting problem data:', error);
            return null;
        }
    }

    function isCodeforcesProblemsPage() {
        const url = window.location.href;
        return url.includes('codeforces.com/problemset/problem') || 
               url.includes('codeforces.com/contest') ||
               url.includes('codeforces.com/gym');
    }

    function extractProblemTitle() {
        const titleSelectors = [
            '.problem-statement .title',
            '.problemindexholder .title',
            '.header .title',
            'div[class*="title"]',
            '.problem-statement .header .title'
        ];

        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }

        // Fallback to page title
        const pageTitle = document.title;
        if (pageTitle.includes('Problem') || pageTitle.includes('Codeforces')) {
            return pageTitle.split(' - ')[0].trim();
        }

        return null;
    }

    function extractProblemStatement() {
        const statementSelectors = [
            '.problem-statement',
            '.problemstatement',
            '.statement',
            'div[class*="statement"]'
        ];

        for (const selector of statementSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                // Clone to avoid modifying original
                const clone = element.cloneNode(true);
                
                // Remove unwanted elements
                const unwantedSelectors = [
                    '.title', '.header', '.input-specification', 
                    '.output-specification', '.sample-tests', '.note'
                ];
                
                unwantedSelectors.forEach(sel => {
                    const elements = clone.querySelectorAll(sel);
                    elements.forEach(el => el.remove());
                });
                
                const text = clone.textContent.trim();
                return text.length > 50 ? text : '';
            }
        }

        return '';
    }

    function extractTimeLimit() {
        const timeLimitSelectors = [
            '.time-limit',
            '.timelimit',
            'div:contains("time limit")',
            'div[class*="time"]'
        ];

        for (const selector of timeLimitSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.toLowerCase().includes('time')) {
                return element.textContent.trim();
            }
        }

        // Search in page text
        const text = document.body.textContent;
        const timeLimitMatch = text.match(/time limit[:\s]*(\d+(?:\.\d+)?)\s*second/i);
        if (timeLimitMatch) {
            return `${timeLimitMatch[1]} second(s)`;
        }

        return 'Not specified';
    }

    function extractMemoryLimit() {
        const memoryLimitSelectors = [
            '.memory-limit',
            '.memorylimit',
            'div:contains("memory limit")',
            'div[class*="memory"]'
        ];

        for (const selector of memoryLimitSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.toLowerCase().includes('memory')) {
                return element.textContent.trim();
            }
        }

        // Search in page text
        const text = document.body.textContent;
        const memoryLimitMatch = text.match(/memory limit[:\s]*(\d+)\s*megabyte/i);
        if (memoryLimitMatch) {
            return `${memoryLimitMatch[1]} megabytes`;
        }

        return 'Not specified';
    }

    function extractExamples() {
        const examples = [];
        
        try {
            // Try different selectors for sample tests
            const sampleSelectors = [
                '.sample-test',
                '.sample',
                '.example',
                'div[class*="sample"]'
            ];
            
            let sampleTests = [];
            for (const selector of sampleSelectors) {
                sampleTests = document.querySelectorAll(selector);
                if (sampleTests.length > 0) break;
            }
            
            sampleTests.forEach((sample, index) => {
                const inputSelectors = [
                    '.input pre', '.input code', '[class*="input"] pre',
                    '.input div', '[class*="input"] div'
                ];
                const outputSelectors = [
                    '.output pre', '.output code', '[class*="output"] pre',
                    '.output div', '[class*="output"] div'
                ];
                
                let inputElement = null;
                let outputElement = null;
                
                for (const sel of inputSelectors) {
                    inputElement = sample.querySelector(sel);
                    if (inputElement && inputElement.textContent.trim()) break;
                }
                
                for (const sel of outputSelectors) {
                    outputElement = sample.querySelector(sel);
                    if (outputElement && outputElement.textContent.trim()) break;
                }
                
                if (inputElement && outputElement) {
                    examples.push({
                        input: inputElement.textContent.trim(),
                        output: outputElement.textContent.trim(),
                        index: index + 1
                    });
                }
            });

            // Fallback: look for consecutive pre elements
            if (examples.length === 0) {
                const preElements = document.querySelectorAll('pre');
                for (let i = 0; i < preElements.length - 1; i++) {
                    const currentPre = preElements[i];
                    const nextPre = preElements[i + 1];
                    
                    const prevText = currentPre.previousElementSibling?.textContent?.toLowerCase() || '';
                    const nextText = nextPre.previousElementSibling?.textContent?.toLowerCase() || '';
                    
                    if ((prevText.includes('input') && nextText.includes('output')) ||
                        (currentPre.textContent.trim() && nextPre.textContent.trim())) {
                        examples.push({
                            input: currentPre.textContent.trim(),
                            output: nextPre.textContent.trim(),
                            index: examples.length + 1
                        });
                    }
                }
            }

        } catch (error) {
            console.error('Error extracting examples:', error);
        }
        
        return examples;
    }
    
    // Add visual indicator that extension is active
    function addExtensionIndicator() {
        if (document.getElementById('cf-helper-indicator')) {
            return;
        }

        const indicator = document.createElement('div');
        indicator.id = 'cf-helper-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            opacity: 0.9;
            pointer-events: none;
            transition: opacity 1s ease-out;
        `;
        indicator.textContent = '✨ CF Helper Active';
        
        document.body.appendChild(indicator);

        // Fade out after 3 seconds
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 1000);
        }, 3000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addExtensionIndicator);
    } else {
        addExtensionIndicator();
    }

})();
