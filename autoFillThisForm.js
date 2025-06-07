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
            <ul id="tabsList" class="tabList" style="
                padding: 0;
                margin: 0;
                list-style: none;
                max-height: 220px; /* ~5 items height */
                overflow-y: auto;
            "></ul>
            <div class="container" style="margin-top: 15px;">
                <button id="cancelBtn" class="confirm-btn">Cancel</button>
                <button id="nextBtn" class="confirm-btn">Next</button>
            </div>
        </div>
    `;

    renderTabsList(modal, groupedTabs);

    const nextBtn = modal.querySelector('#nextBtn');
    nextBtn.addEventListener('click', async () => {
        if (!selectedTabInfo) {
            showErrorAlert('Please select a tab first.');
            return;
        }

        const storedProfiles = await storage.get('userProfiles') || [];
        const profiles = Object.values(storedProfiles);

        renderStep2(modal, profiles);
    });

    cancelBtn.addEventListener('click', () => {
        console.log('Modal closed by user');
        modal.remove();
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
            <div id="profileList" style="
                margin-top: 15px;
                max-height: 250px; /* Adjust based on item height */
                overflow-y: auto;
            "></div>
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
        showErrorAlert('Please select a profile first');
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
          <div class="text">Step 3: Confirm and Autofill</div>
          <div class="profile-list" style="
            padding: 10px;
            margin-top: 10px;
            background: #f1f1f1;
            border-radius: 8px;
            cursor: default;
            line-height: 1.4;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.05);
            overflow: hidden; 
            text-overflow: ellipsis; 
            white-space: nowrap;
            text-align: left;
        ">
            <strong>Tab:</strong> ${selectedTabInfo?.title || 'N/A'}<br/>
            <strong>Profile:</strong> ${selectedProfile?.fullName || 'N/A'}
        </div>
          <div style="margin-top: 20px;">
              <button id="autofillNowBtn" class="confirm-btn">Autofill Now</button>
          </div>
      </div>
    `;

    const autofillNowBtn = modal.querySelector('#autofillNowBtn');
    autofillNowBtn.addEventListener('click', async () => {
        if (!selectedTabInfo || !selectedProfile) {
            showErrorAlert('Tab or Profile not selected');
            return;
        }

        try {
            modal.innerHTML = '';

            await chrome.scripting.executeScript({
                target: { tabId: selectedTabInfo.id },
                func: autofillForm,
                args: [selectedProfile]
            });

            console.log('✅ Autofill injected successfully');

            const autofillHistoryItem = {
                timestamp: new Date().toISOString(),
                website: selectedTabInfo.url,
                tabTitle: selectedTabInfo.title,
                profileUsed: selectedProfile.fullName || selectedProfile.name || 'Unknown Profile'
            };

            const existingHistory = await storage.get('autofillHistory') || [];
            existingHistory.push(autofillHistoryItem);
            await storage.set('autofillHistory', existingHistory);
            console.log('📜 Autofill history updated:', autofillHistoryItem);

            try {
                await renderAutofillHistory();
            } catch (err) {
                console.warn('⚠️ Failed to render autofill history:', err);
                // Continue even if history rendering fails
            }

            console.log('✅ Proceeding to success modal...');
            setTimeout(() => {
                renderStep4(modal);
            }, 2000);

        } catch (err) {
            console.error('❌ Unexpected Autofill Error:', err);
            showErrorAlert('Something went wrong during autofill.');
        }
    });
}

function renderStep4(modal) {
    modal.querySelector('.modal-content')?.remove();
    modal.innerHTML = `
      <div class="modal-content">
          <div class="text">Form Autofilled Successfully</div>
          <div style="margin-top: 20px;">
              <button id="finalCloseBtn" class="confirm-btn">Close</button>
          </div>
      </div>
    `;

    const finalCloseBtn = modal.querySelector('#finalCloseBtn');
    finalCloseBtn.addEventListener('click', () => {
        modal.remove();
    })
}

function autofillForm(profile) {
    const fieldMapping = {
      email: ['email', 'e-mail', 'your email'],
      fullName: ['name', 'full name', 'your name'],
      phoneNumber: ['phone', 'phone number', 'mobile', 'contact'],
      linkedinURL: ['linkedin', 'linkedin profile'],
      website: ['website', 'personal website', 'portfolio'],
      resumeFileName: ['resume', 'cv', 'upload resume']
    };
  
    function matchField(field, keywords) {
      const lowerField = field.toLowerCase();
      return keywords.some(keyword => lowerField.includes(keyword));
    }
  
    const inputs = document.querySelectorAll('input, textarea');
  
    inputs.forEach(input => {
      let label = '';
      if (input.labels && input.labels.length > 0) {
        label = input.labels[0].innerText || '';
      }
      
      const attributes = [
        input.name || '',
        input.id || '',
        input.placeholder || '',
        label
      ];
  
      for (const key in fieldMapping) {
        if (fieldMapping.hasOwnProperty(key)) {
          const keywords = fieldMapping[key];
          
          if (attributes.some(attr => matchField(attr, keywords))) {
            if (profile[key]) {
              input.value = profile[key];
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
            break; 
          }
        }
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

function showErrorAlert(message) {
    const alertDiv = document.createElement('div');
    alertDiv.classList.add('error-alert');
    alertDiv.innerHTML = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}