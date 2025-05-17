import { storage } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
    const recordamacro = document.getElementById('recordAMacro');
    const modal = createOrGetModal();

    recordamacro.addEventListener('click', async (e) => {
        e.preventDefault();
        showModal(modal);
        const groupedTabs = await findActiveTabs();
        renderStep1(modal, groupedTabs);
    });
});

let selectedTabInfo = null;
let tabRefreshInterval = null;

function createOrGetModal() {
    let modal = document.getElementById('formTabsModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'formTabsModal';
    modal.className = 'modal';
    document.body.appendChild(modal);
    return modal;
}

function showModal(modal) {
    modal.style.display = 'block';
}

function clearAllIntervals() {
    if (tabRefreshInterval) {
        clearInterval(tabRefreshInterval);
        tabRefreshInterval = null;
    }
}

// --- Step 1: Render Tabs ---
function renderStep1(modal, groupedTabs) {
    clearAllIntervals();

    modal.querySelector('.modal-content')?.remove();
    modal.innerHTML = `
        <div class="modal-content">
            <div class="text">Step 1: Select the tab to record a macro</div>
            <ul id="tabsList" class="tabList" style="padding: 0; margin: 0; list-style: none;"></ul>
            <button id="confirmBtn" class="confirm-btn">Confirm</button>
        </div>
    `;

    renderTabsList(modal, groupedTabs);

    const confirmBtn = modal.querySelector('#confirmBtn');
    confirmBtn.addEventListener('click', async () => {
        if (!selectedTabInfo) {
            showErrorAlert('Please select a tab first.');
            return;
        }

        console.log('Tab selected for action:', selectedTabInfo);
        renderStep2(modal);
    });

    tabRefreshInterval = setInterval(async () => {
        console.log('Refreshing tabs at', new Date().toLocaleTimeString());
        const updatedTabs = await findActiveTabs();
        renderTabsList(modal, updatedTabs);
    }, 5000);
}

function renderStep2(modal) {
    clearAllIntervals();

    modal.innerHTML = `
        <div class="modal-content">
            <div class="text">Step 2: Are you ready to record macro on the selected tab?</div>
            <p class="description">Click the button below to initiate activity recording. All interactions you perform on the form will be captured step-by-step.</p>
            <button id="recordMacroBtn" class="confirm-btn">Record a Macro</button>
        </div>
    `;

    const recordBtn = modal.querySelector('#recordMacroBtn');
    recordBtn.addEventListener('click', async () => {
        console.log("🎬 Macro record initiated on:", selectedTabInfo);

        try {
            // ✅ Try injecting the script (safe even if already injected)
            await chrome.scripting.executeScript({
                target: { tabId: selectedTabInfo.id },
                files: ['contentScript.js']
            });

            // ✅ Wait until content script confirms readiness
            const response = await sendMessageToContentScript(selectedTabInfo.id, { type: 'START_RECORDING' });

            console.log("📽️", response.status);
            showSuccessAlert('Recording started. Perform your actions on the form.');
            renderStep3(modal);

        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            showErrorAlert('Could not start recording. Ensure the tab is active and supports script injection.');
        }
    });
}

function renderStep3(modal) {
    modal.querySelector('.modal-content')?.remove();
    modal.innerHTML = `
        <div class="modal-content">
            <div class="text">Recording...</div>
            <p class="description">When you're done, click below to stop recording.</p>
            <button id="stopRecordingBtn" class="confirm-btn">Stop Recording</button>
        </div>
    `;

    modal.querySelector('#stopRecordingBtn').addEventListener('click', async () => {
        try {
            const response = await sendMessageToContentScript(selectedTabInfo.id, { type: 'STOP_RECORDING' });

            console.log("📌 Recorded actions received from content script: ", response.actions);

            if (Array.isArray(response.actions)) {
                const existingMacros = (await storage.get('macro_actions')) || [];

                const newMacro = {
                    id: Date.now(),
                    name: `Macro ${existingMacros.length + 1}`,
                    createdAt: new Date().toISOString(),
                    actions: response.actions
                };

                existingMacros.push(newMacro);

                await storage.set('macro_actions', existingMacros);
                showSuccessAlert("Macro Saved Successfully!!");
            } else {
                showErrorAlert('No valid recorded actions received.');
            }
        } catch (error) {
            console.error('Error communicating with content script:', error);
            showErrorAlert('Failed to retrieve recorded actions. Ensure the tab is still open and active.');
        }
    });
}

// --- Find Tabs with Forms ---
async function findActiveTabs() {
    return new Promise((resolve) => {
        chrome.tabs.query({ currentWindow: true }, async (tabs) => {
            const filteredTabs = [];

            for (const tab of tabs) {
                if (!tab.url || !tab.url.startsWith('http')) continue;

                try {
                    const [result] = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => {
                            return !!document.querySelector('form');
                        },
                    });

                    if (result?.result) {
                        filteredTabs.push(tab);
                    }
                } catch (err) {
                    console.warn('Script injection failed for tab:', tab.url, err);
                }
            }

            const groupedTabs = groupTabsByDomain(filteredTabs);
            resolve(groupedTabs);
        });
    });
}

// --- Group Tabs by Domain ---
function groupTabsByDomain(tabs) {
    const groups = {};

    tabs.forEach((tab) => {
        if (tab.url && tab.url.startsWith('http')) {
            try {
                const url = new URL(tab.url);
                const domain = url.hostname;

                if (!groups[domain]) {
                    groups[domain] = [];
                }
                groups[domain].push(tab);
            } catch (error) {
                console.error('Invalid URL for tab:', tab.url, error);
            }
        }
    });

    return groups;
}

// --- Render Tabs List ---
function renderTabsList(modal, groupedTabs) {
    const list = modal.querySelector('#tabsList');
    if (!list) return;

    list.innerHTML = '';

    if (Object.keys(groupedTabs).length === 0) {
        list.innerHTML = '<li>No active tabs with forms found.</li>';
        return;
    }

    Object.keys(groupedTabs).forEach((domain) => {
        const groupEl = document.createElement('div');
        groupEl.className = 'group';
        groupEl.style.marginBottom = '15px';

        groupedTabs[domain].forEach((tab) => {
            const tabEl = document.createElement('div');
            tabEl.className = 'tab';
            tabEl.style.cssText = `
                padding: 10px;
                margin-top: 10px;
                background: #f1f1f1;
                border-radius: 8px;
                cursor: pointer;
                line-height: 1.4;
                box-shadow: 0 0 5px rgba(0, 0, 0, 0.05);
                overflow: hidden; 
                text-overflow: ellipsis; 
                white-space: nowrap;
            `;

            tabEl.innerHTML = `
                <div><strong>Title:</strong> ${tab.title}</div>
                <div style="font-size: 13px;"><strong>URL:</strong> ${tab.url}</div>
            `;

            tabEl.addEventListener('click', () => {
                list.querySelectorAll('.tab').forEach(el => {
                    el.style.backgroundColor = '#f1f1f1';
                });

                tabEl.style.backgroundColor = '#e0f0ff';
                selectedTabInfo = {
                    id: tab.id,
                    url: tab.url,
                    title: tab.title
                };
                console.log('Selected Tab:', selectedTabInfo);
            });

            groupEl.appendChild(tabEl);
        });

        list.appendChild(groupEl);
    });
}

async function sendMessageToContentScript(tabId, message, retries = 3, delay = 2000) {
    let attempt = 0;

    console.log("📡 Checking content script readiness...");

    const loadingInterval = setInterval(() => {
        console.log('⏳ Waiting for content script to be ready...');
    }, 1000);

    try {
        while (attempt < retries) {
            const [{ result: isReady } = {}] = await chrome.scripting.executeScript({
                target: { tabId },
                func: () => window.isContentScriptReady || false
            });

            if (isReady) {
                clearInterval(loadingInterval);
                console.log("✅ Content script is ready.");

                const response = await chrome.tabs.sendMessage(tabId, message);
                console.log("📨 Response from content script:", response);
                return response;
            }

            console.warn(`⏱️ Content script not ready. Retrying in ${delay / 1000}s... (${retries - attempt - 1} retries left)`);
            attempt++;
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        throw new Error('Content script not ready after maximum retries.');

    } catch (err) {
        console.error("❌ Failed to send message to content script:", err);
        throw err;

    } finally {
        clearInterval(loadingInterval);
    }
}

function showErrorAlert(message) {
    const alertDiv = document.createElement('div');
    alertDiv.classList.add('error-alert');
    alertDiv.innerHTML = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function showSuccessAlert(message) {
    const alertDiv = document.createElement('div');
    alertDiv.classList.add('success-alert');
    alertDiv.innerHTML = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}