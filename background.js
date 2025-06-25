// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Codeforces Helper Extension installed');
    
    // Create context menu
    chrome.contextMenus.create({
        id: 'generate-solution',
        title: 'Generate Solution with CF Helper',
        contexts: ['page']
    });

    // Set default settings
    const defaultSettings = {
        defaultApproachLanguage: 'english',
        defaultCodeLanguage: 'cpp',
        autoDetectLanguage: true,
        showNotifications: true
    };

    chrome.storage.sync.get(['settings'], (result) => {
        if (!result.settings) {
            chrome.storage.sync.set({ settings: defaultSettings });
        }
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'generate-solution') {
        if (tab.url && tab.url.includes('codeforces.com')) {
            chrome.runtime.openOptionsPage();
        } else {
            showNotification('CF Helper', 'Please use this on a Codeforces page.');
        }
    }
});

// Handle extension icon clicks
chrome.action.onClicked.addListener((tab) => {
    if (tab.url && tab.url.includes('codeforces.com')) {
        console.log('Extension clicked on Codeforces page');
    } else {
        showNotification('CF Helper', 'Please navigate to a Codeforces problem page first');
    }
});

// Update badge based on current tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        if (tab.url.includes('codeforces.com')) {
            chrome.action.enable(tabId);
            chrome.action.setBadgeText({ text: '✓', tabId });
            chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId });
        } else {
            chrome.action.disable(tabId);
            chrome.action.setBadgeText({ text: '', tabId });
        }
    }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    
    if (request.action === 'getProblemData') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'extractProblem' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error sending message to content script:', chrome.runtime.lastError);
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        sendResponse(response);
                    }
                });
            } else {
                sendResponse({ success: false, error: 'No active tab found' });
            }
        });
        return true; // Keep message channel open for async response
    }

    if (request.action === 'openOptionsPage') {
        chrome.runtime.openOptionsPage();
        sendResponse({ success: true });
    }

    if (request.action === 'updateStats') {
        updateUsageStats(request.statType);
        sendResponse({ success: true });
    }

    if (request.action === 'getStats') {
        chrome.storage.local.get(['usageStats'], (result) => {
            sendResponse(result.usageStats || getDefaultStats());
        });
        return true;
    }
});

// Usage statistics
function getDefaultStats() {
    return {
        problemsSolved: 0,
        solutionsGenerated: 0,
        lastUsed: null
    };
}

function updateUsageStats(action) {
    chrome.storage.local.get(['usageStats'], (result) => {
        const stats = result.usageStats || getDefaultStats();
        
        if (action === 'solution_generated') stats.solutionsGenerated++;
        if (action === 'problem_solved') stats.problemsSolved++;
        stats.lastUsed = new Date().toISOString();
        
        chrome.storage.local.set({ usageStats: stats });
    });
}

// Show notification helper
function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title,
        message
    });
}

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-extension') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url && tabs[0].url.includes('codeforces.com')) {
                console.log('Keyboard shortcut triggered');
            } else {
                showNotification('CF Helper', 'Please navigate to a Codeforces problem page first');
            }
        });
    }
});

// Cleanup old cache data
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

setInterval(() => {
    chrome.storage.local.get(null, (items) => {
        const now = Date.now();
        const keysToRemove = [];

        for (const [key, value] of Object.entries(items)) {
            if (key.startsWith('cache_') && value.timestamp && now - value.timestamp > 7 * 24 * 60 * 60 * 1000) {
                keysToRemove.push(key);
            }
        }

        if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove);
            console.log('Cleaned up', keysToRemove.length, 'old cache entries');
        }
    });
}, CLEANUP_INTERVAL);
