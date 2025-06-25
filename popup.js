document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Popup loaded');
    
    // Get DOM elements
    const generateBtn = document.getElementById('generateBtn');
    const loadingDiv = document.getElementById('loading');
    const resultsDiv = document.getElementById('results');
    const approachDiv = document.getElementById('approach');
    const codeDiv = document.getElementById('code');
    const copyApproachBtn = document.getElementById('copyApproach');
    const copyCodeBtn = document.getElementById('copyCode');
    const problemTitleElement = document.getElementById('problemTitle');
    
    // Verify elements exist
    console.log('Element check:', {
        generateBtn: !!generateBtn,
        loadingDiv: !!loadingDiv,
        resultsDiv: !!resultsDiv,
        approachDiv: !!approachDiv,
        codeDiv: !!codeDiv,
        problemTitleElement: !!problemTitleElement
    });
    
    let currentProblem = null;
    let selectedApproachLang = 'english';
    let selectedCodeLang = 'cpp';
    
    // Initialize dropdowns
    initializeDropdowns();
    
    // Load user preferences
    loadUserPreferences();
    
    // Load problem data
    loadProblemData();

    function initializeDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown');
        console.log('🎛️ Initializing dropdowns:', dropdowns.length);
        
        dropdowns.forEach(dropdown => {
            const button = dropdown.querySelector('.dropdown-button');
            const menu = dropdown.querySelector('.dropdown-menu');
            const items = dropdown.querySelectorAll('.dropdown-item');
            
            if (!button || !menu || items.length === 0) {
                console.error('Dropdown elements missing:', { button: !!button, menu: !!menu, items: items.length });
                return;
            }
            
            // Handle dropdown button click
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Close other dropdowns
                dropdowns.forEach(other => {
                    if (other !== dropdown) {
                        other.classList.remove('open');
                    }
                });
                
                // Toggle current dropdown
                dropdown.classList.toggle('open');
            });
            
            // Handle dropdown item selection
            items.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const value = item.dataset.value;
                    const text = item.textContent;
                    
                    // Update button text
                    const buttonText = button.querySelector('span');
                    if (buttonText) {
                        buttonText.textContent = text;
                    }
                    
                    // Store selected value
                    button.dataset.value = value;
                    
                    // Update global variables
                    if (dropdown.id === 'approachDropdown') {
                        selectedApproachLang = value;
                    } else if (dropdown.id === 'codeDropdown') {
                        selectedCodeLang = value;
                    }
                    
                    // Close dropdown
                    dropdown.classList.remove('open');
                    
                    console.log('Selected:', { dropdown: dropdown.id, value, text });
                });
            });
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                dropdowns.forEach(dropdown => {
                    dropdown.classList.remove('open');
                });
            }
        });
    }

    function loadUserPreferences() {
        chrome.storage.sync.get(['preferences'], (result) => {
            if (result.preferences) {
                const prefs = result.preferences;
                
                // Set approach language
                if (prefs.defaultApproachLang) {
                    selectedApproachLang = prefs.defaultApproachLang;
                    updateDropdownSelection('approachDropdown', prefs.defaultApproachLang);
                }
                
                // Set code language
                if (prefs.defaultCodeLang) {
                    selectedCodeLang = prefs.defaultCodeLang;
                    updateDropdownSelection('codeDropdown', prefs.defaultCodeLang);
                }
            }
        });
    }

    function updateDropdownSelection(dropdownId, value) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;
        
        const button = dropdown.querySelector('.dropdown-button');
        const item = dropdown.querySelector(`[data-value="${value}"]`);
        
        if (button && item) {
            const buttonText = button.querySelector('span');
            if (buttonText) {
                buttonText.textContent = item.textContent;
            }
            button.dataset.value = value;
        }
    }

    function loadProblemData() {
        // Check if we're on a Codeforces page
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (!tabs[0]?.url?.includes('codeforces.com')) {
                showError("Please use this extension on a Codeforces problem page");
                return;
            }
            
            // Request problem data from background script
            chrome.runtime.sendMessage(
                {action: 'getProblemData'},
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Runtime error:', chrome.runtime.lastError);
                        showError("Failed to communicate with extension");
                        return;
                    }
                    
                    if (!response || !response.success || !response.problem) {
                        console.error('Invalid response:', response);
                        showError("Failed to load problem data. Make sure you're on a problem page.");
                        return;
                    }
                    
                    currentProblem = response.problem;
                    console.log('📦 Problem loaded:', currentProblem);
                    updateUI();
                }
            );
        });
    }

    function updateUI() {
        if (currentProblem && problemTitleElement) {
            problemTitleElement.textContent = currentProblem.title || 'Problem loaded';
        }
        
        if (generateBtn && currentProblem) {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Solution';
        }
    }

    function showError(message) {
        console.error('❌ Error:', message);
        
        if (problemTitleElement) {
            problemTitleElement.textContent = message;
            problemTitleElement.style.color = '#ff6b6b';
        }
        
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.textContent = 'Error';
        }
    }

    // Generate solution button click handler
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            console.log('🎯 Generate button clicked');
            
            if (!currentProblem) {
                showError('No problem detected');
                return;
            }
            
            generateSolution();
        });
    }

    async function generateSolution() {
        if (!currentProblem?.title) {
            showError("No problem detected on this page");
            return;
        }

        console.log("⚡ Starting solution generation");
        console.log("Selected languages:", { approach: selectedApproachLang, code: selectedCodeLang });

        // Show loading state
        if (loadingDiv) {
            loadingDiv.style.display = 'block';
            loadingDiv.classList.add('show');
        }
        if (resultsDiv) {
            resultsDiv.classList.remove('show');
            resultsDiv.style.display = 'none';
        }
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.textContent = "Generating...";
        }

        try {
            const solution = await callAI(currentProblem, selectedApproachLang, selectedCodeLang);
            displayResults(solution.approach, solution.code, selectedCodeLang);
            
            // Update usage stats
            chrome.runtime.sendMessage({
                action: 'updateStats',
                statType: 'solution_generated'
            });
            
        } catch (error) {
            console.error("💥 Generation error:", error);
            showError("Failed to generate solution: " + error.message);
        } finally {
            // Hide loading state
            if (loadingDiv) {
                loadingDiv.style.display = 'none';
                loadingDiv.classList.remove('show');
            }
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.textContent = "Generate Solution";
            }
        }
    }

    async function callAI(problem, approachLang, codeLang) {
        // Get API keys from storage
        const result = await new Promise(resolve => {
            chrome.storage.sync.get(['apiKeys'], resolve);
        });
        
        const apiKeys = result.apiKeys || {};
        
        // Auto-select the first available API key
        let selectedAI = apiKeys.selectedAI;
        if (!selectedAI || !apiKeys[selectedAI + 'Key']) {
            if (apiKeys.openaiKey) {
                selectedAI = 'openai';
            } else if (apiKeys.claudeKey) {
                selectedAI = 'claude';
            } else if (apiKeys.geminiKey) {
                selectedAI = 'gemini';
            } else {
                throw new Error('No API keys configured. Please add your API keys in the options page.');
            }
        }
        
        console.log('🤖 Using AI provider:', selectedAI);

        // Create prompt
        const prompt = createPrompt(problem, approachLang, codeLang);
        console.log('📝 Generated prompt length:', prompt.length);

        // Call appropriate AI service
        try {
            if (selectedAI === 'openai' && apiKeys.openaiKey) {
                return await callOpenAI(prompt, apiKeys.openaiKey);
            } else if (selectedAI === 'claude' && apiKeys.claudeKey) {
                return await callClaude(prompt, apiKeys.claudeKey);
            } else if (selectedAI === 'gemini' && apiKeys.geminiKey) {
                return await callGemini(prompt, apiKeys.geminiKey);
            } else {
                throw new Error(`No API key found for ${selectedAI}. Please configure your API keys in the options page.`);
            }
        } catch (error) {
            console.error(`${selectedAI} API error:`, error);
            throw error;
        }
    }

    function createPrompt(problem, approachLang, codeLang) {
        const examplesText = problem.examples && problem.examples.length > 0 
            ? problem.examples.map(ex => `Input: ${ex.input}\nOutput: ${ex.output}`).join('\n\n')
            : 'No examples provided';

        return `Problem: ${problem.title}

Statement: ${problem.statement}

Time Limit: ${problem.timeLimit}
Memory Limit: ${problem.memoryLimit}

Examples:
${examplesText}

Please provide:
1. A solution approach in ${approachLang} language (be detailed and explain the algorithm step by step)
2. Clean, well-commented code in ${codeLang}

Format your response exactly as:
APPROACH:
[Your detailed approach here]

CODE:
[Your code here]`;
    }

    async function callOpenAI(prompt, apiKey) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ 
                    role: 'user', 
                    content: prompt 
                }],
                max_tokens: 2000,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        return parseAIResponse(data.choices[0].message.content);
    }

    async function callClaude(prompt, apiKey) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 2000,
                messages: [{ 
                    role: 'user', 
                    content: prompt 
                }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Claude API failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        return parseAIResponse(data.content[0].text);
    }

    async function callGemini(prompt, apiKey) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ text: prompt }] 
                }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Gemini API failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        return parseAIResponse(data.candidates[0].content.parts[0].text);
    }

    function parseAIResponse(response) {
        console.log('🔍 Parsing AI response...');
        
        const approachMatch = response.match(/APPROACH:\s*([\s\S]*?)(?=CODE:|$)/i);
        const codeMatch = response.match(/CODE:\s*([\s\S]*?)$/i);
        
        const approach = approachMatch ? approachMatch[1].trim() : 'No approach provided';
        const code = codeMatch ? codeMatch[1].trim() : 'No code provided';
        
        console.log('Parsed lengths:', { approach: approach.length, code: code.length });
        
        return { approach, code };
    }

    function displayResults(approach, code, language) {
        console.log('📊 Displaying results...');
        
        if (approachDiv) {
            approachDiv.innerHTML = `<pre class="whitespace-pre-wrap">${escapeHtml(approach)}</pre>`;
        }
        
        if (codeDiv) {
            codeDiv.innerHTML = `<pre><code>${escapeHtml(code)}</code></pre>`;
        }
        
        if (resultsDiv) {
            resultsDiv.style.display = 'block';
            resultsDiv.classList.add('show');
            
            // Scroll to results
            setTimeout(() => {
                resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
        
        console.log('✅ Results displayed successfully');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Copy button handlers
    if (copyApproachBtn) {
        copyApproachBtn.addEventListener('click', function() {
            const text = approachDiv ? approachDiv.textContent : '';
            copyToClipboard(text, copyApproachBtn);
        });
    }

    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', function() {
            const text = codeDiv ? codeDiv.textContent : '';
            copyToClipboard(text, copyCodeBtn);
        });
    }

    async function copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.style.background = 'rgba(76, 175, 80, 0.3)';
            
            console.log('📋 Text copied to clipboard');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 2000);
        } catch (err) {
            console.error('❌ Failed to copy text:', err);
            
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = 'Copy';
            }, 2000);
        }
    }
});
