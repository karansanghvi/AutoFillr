let recordedActions = [];
let isRecording = false;

// ✅ Mark content script as ready for external checks
window.isContentScriptReady = false;

// Utility: Get a simple selector for an element
function getElementSelector(el) {
    if (el.id) return `#${el.id}`;
    if (el.name) return `[name="${el.name}"]`;
    let path = el.tagName.toLowerCase();
    if (el.className && typeof el.className === 'string') {
        path += '.' + el.className.trim().split(/\s+/).join('.');
    }
    return path;
}

// Handle change/input events
function handleInputChange(e) {
    if (!isRecording) return;
    const selector = getElementSelector(e.target);
    const type = e.target.type;

    const value = (type === 'checkbox' || type === 'radio')
        ? e.target.checked
        : e.target.value;

    recordedActions.push({
        type: 'input',
        selector,
        value,
        inputType: type,
        timestamp: Date.now(),
    });

    console.log(`📝 Recorded change on ${selector} (${type}):`, value);
}

// Setup listeners for inputs, selects, checkboxes, radios
function setupRecordingListeners() {
    document.querySelectorAll('input, textarea, select').forEach((el) => {
        if (!el.dataset.listenerAdded) {
            el.addEventListener('change', handleInputChange);
            el.dataset.listenerAdded = 'true'; // Prevent duplicate listeners
        }
    });

    document.addEventListener('click', (e) => {
        if (!isRecording) return;
        const selector = getElementSelector(e.target);
        recordedActions.push({
            type: 'click',
            selector,
            timestamp: Date.now(),
        });
        console.log('📌 Recorded click on:', selector);
    });
}

// Handle messages from background or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_RECORDING') {
        isRecording = true;
        recordedActions = [];
        console.log('✅ Recording started...');
        sendResponse({ status: 'Recording started' });
    } else if (message.type === 'STOP_RECORDING') {
        isRecording = false;
        console.log('🛑 Recording stopped. Sending data...');

        sessionStorage.setItem('recordedActions', JSON.stringify(recordedActions));
        console.log('📦 Recorded actions saved to sessionStorage:', recordedActions);

        sendResponse({ status: 'Recording stopped', actions: recordedActions });
    }
});

// Setup MutationObserver for dynamic content changes
function setupDynamicContentObserver() {
    const observer = new MutationObserver(() => {
        console.log('🔄 DOM changed dynamically. Reapplying listeners...');
        setupRecordingListeners();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

// Initialize content script
function initContentScript() {
    restoreRecordedActions();
    setupRecordingListeners();
    setupDynamicContentObserver();
    window.isContentScriptReady = true;
    chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' });
    console.log('✅ Content script is ready and listening for commands.');
}

// Re-initialize on page load
function onPageLoad() {
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initContentScript);
    } else {
        initContentScript();
    }
}

// SPA navigation support
window.addEventListener('popstate', () => {
    if (!window.isContentScriptReady) {
        console.log('🔄 Navigating to another page, reinitializing content script...');
        onPageLoad();
    }
});

// Before unload, save recorded actions
window.addEventListener('beforeunload', () => {
    if (window.isContentScriptReady) {
        sessionStorage.setItem('recordedActions', JSON.stringify(recordedActions));
        console.log('📦 Recorded actions saved before unload.');
    }
});

// Restore actions from sessionStorage
function restoreRecordedActions() {
    const savedActions = sessionStorage.getItem('recordedActions');
    if (savedActions) {
        try {
            recordedActions = JSON.parse(savedActions);
            console.log('📥 Restored recorded actions:', recordedActions);
        } catch (e) {
            console.error('❌ Error parsing recorded actions from sessionStorage', e);
        }
    } else {
        console.log('ℹ️ No recorded actions found in sessionStorage.');
    }
}

// Start everything
onPageLoad();
