chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'generate-solution',
        title: 'Generate Solution with CF Helper',
        contexts: ['page']
    });

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

    console.log('Codeforces Helper Extension installed');
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'generate-solution') {
        if (tab.url.includes('codeforces.com')) {
            chrome.runtime.openOptionsPage();
        } else {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icons32px.png',
                title: 'CF Helper',
                message: 'Please use this on a Codeforces page.'
            });
        }
    }
});

chrome.action.onClicked.addListener((tab) => {
    if (tab.url.includes('codeforces.com')) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });
    }
});

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getProblemData') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'extractProblem' }, (response) => {
                    sendResponse(response);
                });
            }
        });
        return true;
    }

    if (request.action === 'openOptionsPage') {
        chrome.runtime.openOptionsPage();
    }

    if (request.action === 'updateStats') {
        updateUsageStats(request.statType);
    }

    if (request.action === 'getStats') {
        sendResponse(usageStats);
    }
});

const usageStats = {
    problemsSolved: 0,
    solutionsGenerated: 0,
    lastUsed: null
};

chrome.storage.local.get(['usageStats'], (result) => {
    if (result.usageStats) {
        Object.assign(usageStats, result.usageStats);
    }
});

function updateUsageStats(action) {
    if (action === 'solution_generated') usageStats.solutionsGenerated++;
    if (action === 'problem_solved') usageStats.problemsSolved++;
    usageStats.lastUsed = new Date().toISOString();
    chrome.storage.local.set({ usageStats });
}

function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icons48.png',
        title,
        message
    });
}

chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-extension') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url.includes('codeforces.com')) {
                chrome.action.openPopup();
            } else {
                showNotification('CF Helper', 'Please navigate to a Codeforces problem page first');
            }
        });
    }
});

const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;

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
        }
    });
}, CLEANUP_INTERVAL);
