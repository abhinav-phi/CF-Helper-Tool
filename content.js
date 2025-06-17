// Content script for extracting Codeforces problem data
(function() {
    'use strict';

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'extractProblem') {
            const problem = extractProblemData();
            sendResponse({
                success: problem !== null,
                problem: problem
            });
        }
        return true; // Keep message channel open for async response
    });

    function extractProblemData() {
        try {
            // Check if we're on a Codeforces problem page
            if (!isCodeforcesProblemsPage()) {
                return null;
            }

            const title = extractProblemTitle();
            const statement = extractProblemStatement();
            const timeLimit = extractTimeLimit();
            const memoryLimit = extractMemoryLimit();
            const examples = extractExamples();

            if (!title) {
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
        // Try different selectors for problem title
        const titleSelectors = [
            '.problem-statement .title',
            '.problemindexholder .title',
            '.header .title',
            'div[class*="title"]'
        ];

        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.textContent.trim();
            }
        }

        // Fallback: extract from page title
        const pageTitle = document.title;
        if (pageTitle.includes('Problem') || pageTitle.includes('Codeforces')) {
            return pageTitle.split(' - ')[0].trim();
        }

        return null;
    }

    function extractProblemStatement() {
        // Try to extract the problem statement
        const statementSelectors = [
            '.problem-statement',
            '.problemstatement',
            '.statement',
            'div[class*="statement"]'
        ];

        for (const selector of statementSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                // Remove title and other non-essential parts
                const clone = element.cloneNode(true);
                
                // Remove title, input/output format sections
                const titleElements = clone.querySelectorAll('.title');
                const headerElements = clone.querySelectorAll('.header');
                
                titleElements.forEach(el => el.remove());
                headerElements.forEach(el => el.remove());
                
                return clone.textContent.trim();
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

        // Look for time limit in problem statement
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

        // Look for memory limit in problem statement
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
            // Look for input/output examples
            const sampleTests = document.querySelectorAll('.sample-test, .sample, .example');
            
            sampleTests.forEach((sample, index) => {
                const inputElement = sample.querySelector('.input pre, .input code, [class*="input"] pre');
                const outputElement = sample.querySelector('.output pre, .output code, [class*="output"] pre');
                
                if (inputElement && outputElement) {
                    examples.push({
                        input: inputElement.textContent.trim(),
                        output: outputElement.textContent.trim(),
                        index: index + 1
                    });
                }
            });

            // Alternative approach: look for Input/Output sections
            if (examples.length === 0) {
                const inputs = document.querySelectorAll('pre');
                for (let i = 0; i < inputs.length - 1; i++) {
                    const currentPre = inputs[i];
                    const nextPre = inputs[i + 1];
                    
                    // Check if this looks like an input/output pair
                    const prevText = currentPre.previousElementSibling?.textContent?.toLowerCase() || '';
                    const nextText = nextPre.previousElementSibling?.textContent?.toLowerCase() || '';
                    
                    if (prevText.includes('input') && nextText.includes('output')) {
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
            return; // Already added
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
        `;
        indicator.textContent = '✨ CF Helper Active';
        
        document.body.appendChild(indicator);

        // Fade out after 3 seconds
        setTimeout(() => {
            indicator.style.transition = 'opacity 1s ease-out';
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 1000);
        }, 3000);
    }

    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addExtensionIndicator);
    } else {
        addExtensionIndicator();
    }

})();