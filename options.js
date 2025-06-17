// Options page script for Chrome extension settings
document.addEventListener('DOMContentLoaded', function() {
    const defaultApproachLangSelect = document.getElementById('defaultApproachLang');
    const defaultCodeLangSelect = document.getElementById('defaultCodeLang');
    const autoDetectCheckbox = document.getElementById('autoDetect');
    const showNotificationsCheckbox = document.getElementById('showNotifications');
    const saveButton = document.getElementById('saveSettings');
    const resetButton = document.getElementById('resetSettings');
    const statusDiv = document.getElementById('status');
    const statsDiv = document.getElementById('stats');

    // Load current settings
    loadSettings();
    loadStats();

    // Save button event listener
    saveButton.addEventListener('click', saveSettings);
    resetButton.addEventListener('click', resetSettings);

    function loadSettings() {
        chrome.storage.sync.get(['settings'], function(result) {
            const settings = result.settings || {
                defaultApproachLanguage: 'english',
                defaultCodeLanguage: 'cpp',
                autoDetectLanguage: true,
                showNotifications: true
            };

            defaultApproachLangSelect.value = settings.defaultApproachLanguage;
            defaultCodeLangSelect.value = settings.defaultCodeLanguage;
            autoDetectCheckbox.checked = settings.autoDetectLanguage;
            showNotificationsCheckbox.checked = settings.showNotifications;
        });
    }

    function saveSettings() {
        const settings = {
            defaultApproachLanguage: defaultApproachLangSelect.value,
            defaultCodeLanguage: defaultCodeLangSelect.value,
            autoDetectLanguage: autoDetectCheckbox.checked,
            showNotifications: showNotificationsCheckbox.checked
        };

        chrome.storage.sync.set({ settings }, function() {
            showStatus('Settings saved successfully!', 'success');
        });
    }

    function resetSettings() {
        const defaultSettings = {
            defaultApproachLanguage: 'english',
            defaultCodeLanguage: 'cpp',
            autoDetectLanguage: true,
            showNotifications: true
        };

        chrome.storage.sync.set({ settings: defaultSettings }, function() {
            loadSettings();
            showStatus('Settings reset to defaults!', 'info');
        });
    }

    function loadStats() {
        chrome.runtime.sendMessage({ action: 'getStats' }, function(stats) {
            if (stats) {
                const statsHTML = `
                    <div class="stat-item">
                        <span class="stat-label">Solutions Generated:</span>
                        <span class="stat-value">${stats.solutionsGenerated || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Problems Analyzed:</span>
                        <span class="stat-value">${stats.problemsSolved || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Last Used:</span>
                        <span class="stat-value">${stats.lastUsed ? new Date(stats.lastUsed).toLocaleDateString() : 'Never'}</span>
                    </div>
                `;
                statsDiv.innerHTML = statsHTML;
            }
        });
    }

    function showStatus(message, type = 'info') {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';

        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }

    // Add export/import settings functionality
    const exportButton = document.getElementById('exportSettings');
    const importButton = document.getElementById('importSettings');
    const importFile = document.getElementById('importFile');

    if (exportButton) {
        exportButton.addEventListener('click', exportSettings);
    }

    if (importButton) {
        importButton.addEventListener('click', () => importFile.click());
    }

    if (importFile) {
        importFile.addEventListener('change', importSettings);
    }

    function exportSettings() {
        chrome.storage.sync.get(['settings'], function(result) {
            const settings = result.settings || {};
            const dataStr = JSON.stringify(settings, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'cf-helper-settings.json';
            link.click();
            
            URL.revokeObjectURL(url);
            showStatus('Settings exported successfully!', 'success');
        });
    }

    function importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const settings = JSON.parse(e.target.result);
                chrome.storage.sync.set({ settings }, function() {
                    loadSettings();
                    showStatus('Settings imported successfully!', 'success');
                });
            } catch (error) {
                showStatus('Invalid settings file!', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'dark';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    if (themeToggle) {
        themeToggle.checked = currentTheme === 'light';
        
        themeToggle.addEventListener('change', () => {
            const theme = themeToggle.checked ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
    }
});