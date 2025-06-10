import { storage } from './storage.js';

const macrosContainer = document.getElementById('macros');
const paginationDotsContainer = document.getElementById('paginationDotsTwo');
const itemsSelect = document.getElementById('itemsPerPageSelect');

let macrosPerPage = 5;
let currentPage = 0;
let savedMacros = [];

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString();
}

function formatActionsForAlert(actions) {
  return actions.map(action => {
    if (action.type === 'input') {
      return `[${formatTimestamp(action.timestamp)}] INPUT on "${action.selector}" (type: ${action.inputType}) — value: "${action.value}"`;
    } else if (action.type === 'click') {
      return `[${formatTimestamp(action.timestamp)}] CLICK on "${action.selector}"`;
    } else {
      return `[${formatTimestamp(action.timestamp)}] ${action.type.toUpperCase()} on "${action.selector}"`;
    }
  }).join('\n');
}

function renderMacros(page = 0) {
  macrosContainer.innerHTML = '';

  if (!savedMacros || savedMacros.length === 0) {
    macrosContainer.innerHTML = '<p>No macros saved yet.</p>';
    paginationDotsContainer.innerHTML = '';
    return;
  }

  let visibleMacros;
  if (macrosPerPage === 'all') {
    visibleMacros = savedMacros;
  } else {
    const start = page * macrosPerPage;
    const end = start + macrosPerPage;
    visibleMacros = savedMacros.slice(start, end);
  }

  visibleMacros.forEach((macro, index) => {
    const macroDiv = document.createElement('div');
    macroDiv.className = 'savedMacro';
    macroDiv.style.marginBottom = '15px';

    macroDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
        <div style="flex-grow: 1;">
          <strong style="font-size: 22px;">${macro.name}</strong><br/>
          <p style="font-size: 18px;">Created: ${formatTimestamp(new Date(macro.createdAt))}</p>
        </div>
        <div style="margin-top: 10px; display: flex; gap: 10px;">
          <button class="macro-btn" data-action="data" data-index="${savedMacros.indexOf(macro)}">Run</button>
          <button class="macro-btn delete-btn" data-action="delete" data-index="${savedMacros.indexOf(macro)}">Delete</button>
        </div>
      </div>
    `;

    macrosContainer.appendChild(macroDiv);
  });

  macrosContainer.querySelectorAll('.macro-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      const index = parseInt(e.target.dataset.index);

      if (action === 'data') {
        const macro = savedMacros[index];
        const detailedText = formatActionsForAlert(macro.actions);
        openMacroDialog(`Actions for "${macro.name}"`, detailedText);
      } else if (action === 'delete') {
        savedMacros.splice(index, 1);
        storage.set('macro_actions', savedMacros);
        renderMacros(currentPage);
      }
    });
  });
}

async function loadAndRenderMacros() {
  try {
    const macros = await storage.get('macro_actions');
    savedMacros = Array.isArray(macros) ? macros : [];
    renderMacros(currentPage);
  } catch (error) {
    console.error('Failed to load macros from storage:', error);
    macrosContainer.innerHTML = '<p>Error loading macros.</p>';
  }
}

if (itemsSelect) {
  itemsSelect.addEventListener('change', (e) => {
    const value = e.target.value;
    macrosPerPage = value === 'all' ? 'all' : parseInt(value, 10);
    currentPage = 0;
    renderMacros(currentPage);
  });
}

// Inject styles
const style = document.createElement('style');
style.textContent = `
  .savedMacro {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    cursor: default;
    transition: all 0.3s ease;
    width: 90%;
    max-width: 1400px;
    text-align: left;
  }
  .macro-btn {
    all: unset;
    display: inline-block;
    border-radius: 10px;
    background-color: #007BFF;
    color: white;
    font-size: 20px;
    font-weight: 500;
    padding: 10px 20px;
    margin-bottom: 5px;
    border: none;
    outline: none;
    box-shadow: none;
    cursor: pointer;
    text-align: center;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    max-width: 200px;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .modal-content {
    background-color: white;
    margin: 8% auto;
    padding: 20px;
    width: 80%;
    max-width: 800px;
    text-align: center;
    border-radius: 20px;
  }

  #macroDialogClose {
    all: unset;
    display: inline-block;
    border-radius: 10px;
    background-color: #007BFF;
    color: white;
    font-size: 20px;
    font-weight: 500;
    padding: 10px 20px;
    margin-bottom: 5px;
    border: none;
    outline: none;
    box-shadow: none;
    cursor: pointer;
    text-align: center;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    max-width: 200px;
  }
`;
document.head.appendChild(style);

// Custom dialog logic
function openMacroDialog(title, body) {
  const dialog = document.getElementById('macroDialog');
  const dialogTitle = document.getElementById('macroDialogTitle');
  const dialogBody = document.getElementById('macroDialogBody');

  dialogTitle.textContent = title;
  dialogBody.textContent = body;
  dialog.style.display = 'flex';
}

document.getElementById('macroDialogClose').addEventListener('click', () => {
  document.getElementById('macroDialog').style.display = 'none';
});

// Init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAndRenderMacros);
} else {
  loadAndRenderMacros();
}
