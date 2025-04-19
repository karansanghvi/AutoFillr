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
  
async function findActiveTabs() {
    return new Promise((resolve) => {
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        console.log('Tabs in current window:', tabs);  // Log all open tabs
        const groupedTabs = groupTabsByDomain(tabs);
        resolve(groupedTabs);
      });
    });
}
  
function groupTabsByDomain(tabs) {
    const groups = {};
  
    tabs.forEach((tab) => {
      console.log('Tab URL:', tab.url); // ✅ Log this to see what you’re working with
  
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
  
    // Loop through each domain and create a section for it
    Object.keys(groupedTabs).forEach((domain) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'group';
  
      const title = document.createElement('strong');
      title.innerText = domain + ` (${groupedTabs[domain].length})`;
      groupEl.appendChild(title);
  
      groupedTabs[domain].forEach((tab) => {
        const tabEl = document.createElement('div');
        tabEl.className = 'tab';
        tabEl.innerText = tab.title;
        tabEl.onclick = () => chrome.tabs.update(tab.id, { active: true });
        groupEl.appendChild(tabEl);
      });
  
      list.appendChild(groupEl);
    });
}  