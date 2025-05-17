// Listen for the extension icon click to open a new tab
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});

// Listen for tab activation (when the user switches tabs)
chrome.tabs.onActivated.addListener((activeInfo) => {
    const tabId = activeInfo.tabId;
    
    // Inject content script into the newly active tab if it's not already injected
    injectContentScript(tabId);
});

// Listen for tab updates (reload or navigate)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        console.log(`Tab ${tabId} loaded. Injecting content script...`);
        injectContentScript(tabId);
    }
});

// Function to inject content script into a tab
// function injectContentScript(tabId) {
//     chrome.scripting.executeScript({
//     target: { tabId },
//     files: ['contentScript.js'], // Replace with your actual content script file
//     });
// }
function injectContentScript(tabId) {
    chrome.tabs.get(tabId, (tab) => {
        if (!tab || !tab.url) return;

        // Skip chrome-extension:// URLs (like your own index.html)
        if (tab.url.startsWith("chrome-extension://")) {
            console.warn("⛔ Skipping injection into extension page:", tab.url);
            return;
        }

        // Optionally skip chrome:// and file:// URLs
        if (tab.url.startsWith("chrome://") || tab.url.startsWith("file://")) {
            console.warn("⛔ Skipping restricted page:", tab.url);
            return;
        }

        chrome.scripting.executeScript({
            target: { tabId },
            files: ['contentScript.js']
        }, () => {
            if (chrome.runtime.lastError) {
                console.error("❌ Script injection failed:", chrome.runtime.lastError.message);
            } else {
                console.log("✅ Content script injected into", tab.url);
            }
        });
    });
}

// Send a message to the content script to check its readiness
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CONTENT_SCRIPT_READY') {
        console.log('✅ Content script is ready.');
        sendResponse({ status: 'Content script ready' });
    }
});
