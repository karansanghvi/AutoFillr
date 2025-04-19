document.addEventListener('DOMContentLoaded', () => {
    const autofillLink = document.getElementById('autofillLink');
    const modal = createOrGetModal();
  
    // !uncomment this
    // autofillLink.addEventListener('click', async (e) => {
    //   e.preventDefault();
    //   showModal(modal);
    //   const groupedTabs = await findActiveTabs();
    //   renderTabsList(modal, groupedTabs);
    // });
    autofillLink.addEventListener('click', async (e) => {
      e.preventDefault();
      showModal(modal);
      const { tabsWithForm, tabsWithoutForm } = await findActiveTabs();
      renderTabsList(modal, tabsWithForm, tabsWithoutForm);
    });    
});
  
function createOrGetModal() {
    let modal = document.getElementById('formTabsModal');
    if (modal) return modal;
  
    modal = document.createElement('div');
    modal.id = 'formTabsModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="text">Active Tabs:</div>
        <ul id="tabsList" style="margin-top: 20px; text-align: left;"></ul>
        <button onclick="document.getElementById('formTabsModal').style.display='none'" style="margin-top: 20px; padding: 10px 20px; border: none; background: #007bff; color: white; border-radius: 10px;">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
}
  
function showModal(modal) {
    modal.style.display = 'block';
}

// !uncomment this
// async function findActiveTabs() {
//   return new Promise((resolve) => {
//     chrome.tabs.query({ currentWindow: true }, async (tabs) => {
//       const filteredTabs = [];

//       for (const tab of tabs) {
//         if (!tab.url || !tab.url.startsWith('http')) continue;

//         try {
//           const [result] = await chrome.scripting.executeScript({
//             target: { tabId: tab.id },
//             func: () => {
//               return !!document.querySelector('form');
//             },
//           });

//           if (result?.result) {
//             filteredTabs.push(tab);
//           }
//         } catch (err) {
//           console.warn('Script injection failed for tab:', tab.url, err);
//         }
//       }

//       const groupedTabs = groupTabsByDomain(filteredTabs);
//       resolve(groupedTabs);
//     });
//   });
// }

async function findActiveTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({ currentWindow: true }, async (tabs) => {
      const tabsWithForm = [];
      const tabsWithoutForm = [];

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
            tabsWithForm.push(tab);
          } else {
            tabsWithoutForm.push(tab);
          }
        } catch (err) {
          console.warn('Script injection failed for:', tab.url, err);
        }
      }

      resolve({ tabsWithForm, tabsWithoutForm });
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
  
// !uncomment this
// function renderTabsList(modal, groupedTabs) {
//     const list = modal.querySelector('#tabsList');
//     list.innerHTML = '';
  
//     if (Object.keys(groupedTabs).length === 0) {
//       list.innerHTML = '<li>No active tabs found.</li>';
//       return;
//     }

//     Object.keys(groupedTabs).forEach((domain) => {
//       const groupEl = document.createElement('div');
//       groupEl.className = 'group';
  
//       const title = document.createElement('strong');
//       title.innerText = domain + ` (${groupedTabs[domain].length})`;
//       groupEl.appendChild(title);
  
//       groupedTabs[domain].forEach((tab) => {
//         const tabEl = document.createElement('div');
//         tabEl.className = 'tab';
//         tabEl.innerText = tab.title;
//         tabEl.onclick = () => chrome.tabs.update(tab.id, { active: true });
//         groupEl.appendChild(tabEl);
//       });
  
//       list.appendChild(groupEl);
//     });
//   }  

function renderTabsList(modal, tabsWithForm, tabsWithoutForm) {
  const list = modal.querySelector('#tabsList');
  list.innerHTML = '';

  const renderGroup = (titleText, tabsArray, color) => {
    const title = document.createElement('h3');
    title.innerText = `${titleText} (${tabsArray.length})`;
    title.style.margin = '10px 0';
    title.style.color = color;
    list.appendChild(title);

    if (tabsArray.length === 0) {
      const none = document.createElement('li');
      none.innerText = 'None found.';
      list.appendChild(none);
    } else {
      tabsArray.forEach((tab) => {
        const tabEl = document.createElement('div');
        tabEl.className = 'tab';
        tabEl.innerText = tab.title;
        tabEl.onclick = () => chrome.tabs.update(tab.id, { active: true });
        list.appendChild(tabEl);
      });
    }
  };

  renderGroup('✅ Tabs with Forms', tabsWithForm, 'green');
  renderGroup('❌ Tabs without Forms', tabsWithoutForm, 'red');
}