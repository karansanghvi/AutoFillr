import { storage } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
    const autofillLink = document.getElementById('autofillLink');
    const modal = createOrGetModal();

    autofillLink.addEventListener('click', async (e) => {
        e.preventDefault();
        showModal(modal);
        const groupedTabs = await findActiveTabs();
        renderStep1(modal, groupedTabs);
    });
});

let selectedTabInfo = null;
let selectedProfile = null;
let tabRefreshInterval = null;
let profileRefreshInterval = null;

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
    if (profileRefreshInterval) {
        clearInterval(profileRefreshInterval);
        profileRefreshInterval = null;
    }
}

// --- Step 1: Render Tabs ---
function renderStep1(modal, groupedTabs) {
    clearAllIntervals(); 

    modal.querySelector('.modal-content')?.remove(); 
    modal.innerHTML = `
        <div class="modal-content">
            <div class="text">Step 1: Select the tab which you want to autofill</div>
            <ul id="tabsList" class="tabList" style="padding: 0; margin: 0; list-style: none;"></ul>
            <button id="nextBtn" class="confirm-btn">Next</button>
        </div>
    `;

    renderTabsList(modal, groupedTabs);

    const nextBtn = modal.querySelector('#nextBtn');
    nextBtn.addEventListener('click', async () => {
        if (!selectedTabInfo) {
            alert('Please select a tab first.');
            return;
        }

        const storedProfiles = await storage.get('userProfiles') || [];
        const profiles = Object.values(storedProfiles);

        renderStep2(modal, profiles);
    });

    tabRefreshInterval = setInterval(async () => {
        console.log('Refreshing tabs at', new Date().toLocaleTimeString());
        const groupedTabs = await findActiveTabs();
        renderTabsList(modal, groupedTabs);
    }, 5000);
}

// --- Step 2: Render Profiles ---
function renderStep2(modal, profiles) {
    clearAllIntervals();
    
    modal.querySelector('.modal-content')?.remove(); 
    modal.innerHTML = `
        <div class="modal-content">
            <div class="text">Step 2: Select the profile which you want to autofill</div>
            <div id="profileList" style="margin-top: 15px;"></div>
            <div class="container" style="margin-top: 15px;">
                <button id="backBtn" class="confirm-btn">Back</button>
                <button id="nextStep2" class="confirm-btn">Next</button>
            </div>
        </div>
    `;

    updateProfileList(modal, profiles);

    const backBtn = modal.querySelector('#backBtn');
    backBtn.addEventListener('click', async () => {
        const groupedTabs = await findActiveTabs();
        renderStep1(modal, groupedTabs);
    });

    const nextBtn2 = modal.querySelector('#nextStep2');
    nextBtn2.addEventListener('click', async () => {
      if (!selectedProfile) {
        alert('Please select a profile first');
        return;
      }

      renderStep3(modal);
    })

    profileRefreshInterval = setInterval(async () => {
        console.log('Refreshing profiles at', new Date().toLocaleTimeString());
        const storedProfiles = await storage.get('userProfiles') || [];
        const profiles = Object.values(storedProfiles);
        updateProfileList(modal, profiles);
    }, 5000);
}

function renderStep3(modal) {
  modal.querySelector('.modal-content')?.remove(); 
    modal.innerHTML = `
        <div class="modal-content">
            <div class="text">Step 3: Confirm And Autofill</div>
        </div>
    `;
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
        list.innerHTML = '<li>No active tabs found.</li>';
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
              <div style="font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><strong>URL:</strong> ${tab.url}</div>
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

// --- Update Profiles List ---
function updateProfileList(modal, profiles) {
    const profileList = modal.querySelector('#profileList');
    if (!profileList) return;

    profileList.innerHTML = '';

    if (profiles.length === 0) {
        profileList.innerHTML = '<div>No profiles found.</div>';
    } else {
        profiles.forEach((profile, index) => {
            const profileCard = document.createElement('div');
            profileCard.className = 'profile-card';
            profileCard.style.cssText = `
                padding: 10px;
                margin-bottom: 10px;
                background: rgb(241, 241, 241);
                border-radius: 8px;
                cursor: pointer;
                box-shadow: 0 0 5px rgba(0, 0, 0, 0.05);
                line-height: 1.4;
                text-align: left;
            `;

            profileCard.innerHTML = `
                <div><strong>Full Name:</strong> ${profile.fullName || profile.name || `Profile ${index + 1}`}</div>
                <div><strong>Email Address:</strong> ${profile.email || 'No email'}</div>
            `;

            profileCard.addEventListener('click', () => {
                document.querySelectorAll('.profile-card').forEach(el => {
                    el.style.backgroundColor = '#f1f1f1';
                });

                profileCard.style.backgroundColor = '#e0f0ff';
                selectedProfile = profile;
                console.log('Selected Profile:', profile);
            });

            profileList.appendChild(profileCard);
        });
    }
}
