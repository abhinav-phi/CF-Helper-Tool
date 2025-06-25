document.addEventListener('DOMContentLoaded', function() {
    console.log('Options page loaded');
    
    const saveBtn = document.getElementById('saveSettings');
    const resetBtn = document.getElementById('resetSettings');
    const exportBtn = document.getElementById('exportSettings');
    const importBtn = document.getElementById('importSettings');
    const importFile = document.getElementById('importFile');
    const statusDiv = document.getElementById('status');
    const testBtn = document.getElementById('testConnection');
    
    // Load settings on page load
    loadSettings();
    loadStats();
    
    // Event listeners
    if (saveBtn) saveBtn.addEventListener('click', saveSettings);
    if (resetBtn) resetBtn.addEventListener('click', resetSettings);
    if (exportBtn) exportBtn.addEventListener('click', exportSettings);
    if (importBtn) importBtn.addEventListener('click', importSettings);
    if (testBtn) testBtn.addEventListener('click', testConnection);
    
    const selectedAISelect = document.getElementById('selectedAI');
    if (selectedAISelect) {
        selectedAISelect.addEventListener('change', updateSelectedAI);
    }
    
    function loadSettings() {
        chrome.storage.sync.get(['apiKeys', 'preferences'], function(result) {
            console.log('Loaded settings:', result);
            
            const apiKeys = result.apiKeys || {};
            const preferences = result.preferences || {};
            
            // Load API keys
            const openaiKeyInput = document.getElementById('openaiKey');
            const claudeKeyInput = document.getElementById('claudeKey');
            const geminiKeyInput = document.getElementById('geminiKey');
            const selectedAISelect = document.getElementById('selectedAI');
            
            if (openaiKeyInput) openaiKeyInput.value = apiKeys.openaiKey || '';
            if (claudeKeyInput) claudeKeyInput.value = apiKeys.claudeKey || '';
            if (geminiKeyInput) geminiKeyInput.value = apiKeys.geminiKey || '';
            if (selectedAISelect) selectedAISelect.value = apiKeys.selectedAI || 'openai';
            
            // Load preferences
            const defaultApproachLang = document.getElementById('defaultApproachLang');
            const defaultCodeLang = document.getElementById('defaultCodeLang');
            const autoDetect = document.getElementById('autoDetect');
            const showNotifications = document.getElementById('showNotifications');
            
            if (defaultApproachLang) defaultApproachLang.value = preferences.defaultApproachLang || 'english';
            if (defaultCodeLang) defaultCodeLang.value = preferences.defaultCodeLang || 'cpp';
            if (autoDetect) autoDetect.checked = preferences.autoDetect || false;
            if (showNotifications) showNotifications.checked = preferences.showNotifications !== false;
        });
    }
    
    function loadStats() {
        chrome.runtime.sendMessage({action: 'getStats'}, (response) => {
            if (response) {
                updateStatsDisplay(response);
            }
        });
    }
    
    function updateStatsDisplay(stats) {
        const statsContainer = document.getElementById('stats');
        if (!statsContainer) return;
        
        const statItems = statsContainer.querySelectorAll('.stat-item');
        if (statItems.length >= 3) {
            statItems[0].querySelector('.stat-value').textContent = stats.solutionsGenerated || 0;
            statItems[1].querySelector('.stat-value').textContent = stats.problemsSolved || 0;
            statItems[2].querySelector('.stat-value').textContent = stats.lastUsed 
                ? new Date(stats.lastUsed).toLocaleDateString() 
                : 'Never';
        }
    }
    
    function saveSettings() {
        console.log('Saving settings...');
        
        // Get API keys
        const apiKeys = {
            openaiKey: document.getElementById('openaiKey')?.value || '',
            claudeKey: document.getElementById('claudeKey')?.value || '',
            geminiKey: document.getElementById('geminiKey')?.value || '',
            selectedAI: document.getElementById('selectedAI')?.value || 'openai'
        };
        
        // Get preferences
        const preferences = {
            defaultApproachLang: document.getElementById('defaultApproachLang')?.value || 'english',
            defaultCodeLang: document.getElementById('defaultCodeLang')?.value || 'cpp',
            autoDetect: document.getElementById('autoDetect')?.checked || false,
            showNotifications: document.getElementById('showNotifications')?.checked !== false
        };
        
        console.log('Saving:', { 
            apiKeys: {
                ...apiKeys, 
                openaiKey: apiKeys.openaiKey ? '***' : '', 
                claudeKey: apiKeys.claudeKey ? '***' : '', 
                geminiKey: apiKeys.geminiKey ? '***' : ''
            }, 
            preferences 
        });
        
        chrome.storage.sync.set({
            apiKeys: apiKeys,
            preferences: preferences
        }, function() {
            if (chrome.runtime.lastError) {
                console.error('Save error:', chrome.runtime.lastError);
                showStatus('Failed to save settings: ' + chrome.runtime.lastError.message, 'error');
            } else {
                console.log('Settings saved successfully');
                showStatus('Settings saved successfully!', 'success');
            }
        });
    }
    
    function resetSettings() {
        if (confirm('Are you sure you want to reset all settings? This will clear your API keys.')) {
            chrome.storage.sync.clear(function() {
                if (chrome.runtime.lastError) {
                    showStatus('Failed to reset settings: ' + chrome.runtime.lastError.message, 'error');
                } else {
                    loadSettings();
                    showStatus('Settings reset to defaults!', 'info');
                }
            });
        }
    }
    
    function exportSettings() {
        chrome.storage.sync.get(['apiKeys', 'preferences'], function(result) {
            const data = {
                apiKeys: result.apiKeys || {},
                preferences: result.preferences || {},
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cf-helper-settings.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showStatus('Settings exported successfully!', 'success');
        });
    }
    
    function importSettings() {
        importFile.click();
    }
    
    function updateSelectedAI() {
        const selectedAI = document.getElementById('selectedAI')?.value;
        if (selectedAI) {
            chrome.storage.sync.get(['apiKeys'], function(result) {
                const apiKeys = result.apiKeys || {};
                apiKeys.selectedAI = selectedAI;
                chrome.storage.sync.set({apiKeys: apiKeys}, function() {
                    console.log('Selected AI updated to:', selectedAI);
                });
            });
        }
    }
    
    async function testConnection() {
        const selectedAI = document.getElementById('selectedAI')?.value || 'openai';
        const apiKeys = {
            openaiKey: document.getElementById('openaiKey')?.value || '',
            claudeKey: document.getElementById('claudeKey')?.value || '',
            geminiKey: document.getElementById('geminiKey')?.value || ''
        };
        
        if (!testBtn) return;
        
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';
        
        try {
            let success = false;
            
            if (selectedAI === 'openai' && apiKeys.openaiKey) {
                success = await testOpenAI(apiKeys.openaiKey);
            } else if (selectedAI === 'claude' && apiKeys.claudeKey) {
                success = await testClaude(apiKeys.claudeKey);
            } else if (selectedAI === 'gemini' && apiKeys.geminiKey) {
                success = await testGemini(apiKeys.geminiKey);
            } else {
                showStatus('Please enter an API key for the selected provider', 'error');
                return;
            }
            
            if (success) {
                showStatus('Connection successful! ✅', 'success');
            } else {
                showStatus('Connection failed. Please check your API key.', 'error');
            }
        } catch (error) {
            console.error('Connection test error:', error);
            showStatus(`Connection failed: ${error.message}`, 'error');
        } finally {
            testBtn.disabled = false;
            testBtn.textContent = '🔗 Test Connection';
        }
    }
    
    async function testOpenAI(apiKey) {
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            return response.ok;
        } catch (error) {
            console.error('OpenAI test error:', error);
            return false;
        }
    }
    
    async function testClaude(apiKey) {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'Hi' }]
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Claude test error:', error);
            return false;
        }
    }
    
    async function testGemini(apiKey) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Hi' }] }]
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Gemini test error:', error);
            return false;
        }
    }
    
    function showStatus(message, type) {
        if (!statusDiv) return;
        
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
    
    // Import file handler
    if (importFile) {
        importFile.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const data = JSON.parse(e.target.result);
                        chrome.storage.sync.set({
                            apiKeys: data.apiKeys || {},
                            preferences: data.preferences || {}
                        }, function() {
                            if (chrome.runtime.lastError) {
                                showStatus('Failed to import settings: ' + chrome.runtime.lastError.message, 'error');
                            } else {
                                loadSettings();
                                showStatus('Settings imported successfully!', 'success');
                            }
                        });
                    } catch (error) {
                        console.error('Import error:', error);
                        showStatus('Invalid settings file!', 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
    }
});
