document.addEventListener('DOMContentLoaded', () => {
    const autofillLink = document.getElementById('autofillLink');
    const modal = createOrGetModal();
  
    autofillLink.addEventListener('click', async (e) => {
      e.preventDefault();
      showModal(modal);
      const groupedTabs = await findActiveTabs();
      renderTabsList(modal, groupedTabs);
    });
});

let selectedTabInfo = null;
  
function createOrGetModal() {
  let modal = document.getElementById('formTabsModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'formTabsModal';
  modal.className = 'modal';
  modal.innerHTML = `
  <div class="modal-content">
    <div class="text">Step 1: Select the tab which you want to autofill</div>
    <ul id="tabsList" class="tabList" style="padding: 0; margin: 0; list-style: none;"></ul>
    <button id="nextBtn" class="confirm-btn">Next</button>
  </div>
`;
  
  document.body.appendChild(modal);

  const nextBtn = modal.querySelector('#nextBtn');
  nextBtn.addEventListener('click', () => {
    if (!selectedTabInfo) {
      alert('Please select a tab first.');
      return;
    }

    modal.querySelector('.modal-content').innerHTML = `
       <div class="text">Step 2: Select the profile which you want to autofill</div>
      <div style="margin: 10px 0; padding: 10px; background: #f1f1f1; border-radius: 8px;">
       
      </div>
      <div class="container">
        <button id="backBtn" class="confirm-btn">Back</button>
        <button id="closeStep2" class="confirm-btn">Close</button>
      </div>
    `;

    const backBtn = modal.querySelector('#backBtn');
    backBtn.addEventListener('click', async () => {
      const groupedTabs = await findActiveTabs();
      renderStep1(modal, groupedTabs); // Restore step 1
    });

    const closeBtn = modal.querySelector('#closeStep2');
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  });

  return modal;
}
  
function showModal(modal) {
    modal.style.display = 'block';
}

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
 
function groupTabsByDomain(tabs) {
    const groups = {};
  
    tabs.forEach((tab) => {
      console.log('Tab URL:', tab.url); 
  
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

function renderTabsList(modal, groupedTabs) {
  const list = modal.querySelector('#tabsList');
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
      
      // Apply consistent card style
      tabEl.style.padding = '10px';
      tabEl.style.marginTop = '10px';
      tabEl.style.background = '#f1f1f1';
      tabEl.style.borderRadius = '8px';
      tabEl.style.cursor = 'pointer';
      tabEl.style.lineHeight = '1.4';
      tabEl.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.05)';
    
      tabEl.innerHTML = `
        <div style="font-weight: 500;"><strong>Title:</strong> ${tab.title}</div>
        <div style="font-size: 13px; color: #555;"><strong>URL:</strong> ${tab.url}</div>
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