import { storage } from "./storage.js";

document.addEventListener("DOMContentLoaded", async () => {
  const profileGridContainer = document.getElementById("profileGridContainer");
  const paginationDotsContainer = document.getElementById("paginationDots");

  const profileDisplayContainer = document.getElementById("profiles");
  const paginationDotsTwoContainer = document.getElementById("paginationDotsTwo");

  const homeLink = document.getElementById("homeLink");
  const profileLink = document.getElementById("profileLink");
  const homeSection = document.getElementById("homeSection");
  const profileSection = document.getElementById("profileSection");
  const runSavedMacroSection = document.getElementById("runSavedMacroSection");

  const addNewProfile = document.getElementById("addNewProfile");
  
  const container = document.getElementById("profileContainer");

  showSection(homeSection);
  homeLink.classList.add("active");

  const profiles = await storage.get("userProfiles") || [];
  const profilesPerPage = 3;

  let homePage = 0;
  let profilePage = 0;
  let profileToDelete = null;
  let macroPage = 0;
  const macrosPerPage = 5;
  let savedMacros = [];

  // Section toggling
  function showSection(sectionToShow) {
    const allSections = document.querySelectorAll(".section");
    allSections.forEach(section => {
      section.style.display = "none";
    });

    sectionToShow.style.display = "block";
  }

  homeLink.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(homeSection);
    homeLink.classList.add("active");
    profileLink.classList.remove("active");
  });
  
  profileLink.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(profileSection);
    profileLink.classList.add("active");
    homeLink.classList.remove("active");
  });  

  runSavedMacroLink.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(runSavedMacroSection);
    runSavedMacroLink.classList.add("active");
    homeLink.classList.remove("active");
  });

  addNewProfile.addEventListener("click", (e) => {
    console.log("Redirecting to profile page");
    window.location.href = "profile.html";
  });

  function createProfileBox(profile, isProfileSection = false) {
    const box = document.createElement("div");
    box.className = "dashboardBox";
  
    const fullName = document.createElement("h1");
    fullName.className = "createdFullname";
    fullName.textContent = profile.fullName || "Full Name";
  
    const email = document.createElement("p");
    email.className = "createdEmailaddress name";
    email.textContent = profile.email || "Email Address";
  
    if (isProfileSection) {
      const buttonContainer = document.createElement("div");
      buttonContainer.className = "button-container";
  
      const editButton = document.createElement("button");
      editButton.className = "edit-btn";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", async () => {
        console.log(`Edit profile: ${profile.fullName}`);
        await storage.set("editProfile", profile);
        window.location.href = "profile.html";
      });
  
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-btn";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", async () => {
        profileToDelete = profile; 
        const modal = document.getElementById("deleteModal");
        const profileName = document.getElementById("profileName");
        const confirmDelete = document.getElementById("confirmDelete");
        const cancelDelete = document.getElementById("cancelDelete");

        profileName.textContent = profile.fullName;
        modal.style.display = "block";

        cancelDelete.addEventListener("click", () => {
          modal.style.display = "none";
        });

        confirmDelete.addEventListener("click", async () => {
          const allProfiles = await storage.get("userProfiles") || [];
          const updatedProfiles = allProfiles.filter(p => p.email !== profileToDelete.email);
          await storage.set("userProfiles", updatedProfiles);

          location.reload();
        });
      });      
  
      buttonContainer.appendChild(editButton);
      buttonContainer.appendChild(deleteButton);
  
      box.appendChild(buttonContainer);
    }
  
    box.appendChild(fullName);
    box.appendChild(email);
  
    return box;
 }

  // HOME section rendering
  const renderHomeProfiles = (page) => {
    profileGridContainer.innerHTML = "";
  
    const start = page * profilesPerPage;
    const end = start + profilesPerPage;
    const visibleProfiles = profiles.slice(start, end);
  
    visibleProfiles.forEach((profile) => {
      profileGridContainer.appendChild(createProfileBox(profile));
    });
  };

  const renderHomePaginationDots = () => {
    paginationDotsContainer.innerHTML = "";
    const totalPages = Math.ceil(profiles.length / profilesPerPage);

    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement("div");
      dot.className = `dot ${i === homePage ? "active" : ""}`;
      dot.addEventListener("click", () => {
        homePage = i;
        renderHomeProfiles(homePage);
        renderHomePaginationDots();
      });
      paginationDotsContainer.appendChild(dot);
    }
  };

  // PROFILE section rendering
  const renderProfileSection = (page) => {
    profileDisplayContainer.innerHTML = "";
  
    const start = page * profilesPerPage;
    const end = start + profilesPerPage;
    const visibleProfiles = profiles.slice(start, end);
  
    visibleProfiles.forEach((profile) => {
      profileDisplayContainer.appendChild(createProfileBox(profile, true)); 
    });
  };

  const renderProfilePaginationDots = () => {
    paginationDotsTwoContainer.innerHTML = "";
    const totalPages = Math.ceil(profiles.length / profilesPerPage);

    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement("div");
      dot.className = `dot ${i === profilePage ? "active" : ""}`;
      dot.addEventListener("click", () => {
        profilePage = i;
        renderProfileSection(profilePage);
        renderProfilePaginationDots();
      });
      paginationDotsTwoContainer.appendChild(dot);
    }
  };

  // MACRO section rendering
  const renderMacroSection = (page) => {
  const macrosContainer = document.getElementById("macros");
  macrosContainer.innerHTML = "";

  const start = page * macrosPerPage;
  const end = start + macrosPerPage;
  const visibleMacros = savedMacros.slice(start, end);

  visibleMacros.forEach((macro, index) => {
    const macroBox = document.createElement("div"); // <-- fixed: don't use getElementById('div')
    macroBox.className = "profile-box";

    const formattedDate = macro.timestamp
      ? new Date(macro.timestamp).toLocaleString()
      : 'Unknown';

    macroBox.innerHTML = `
      <p><strong>Macro #${start + index + 1}</strong></p>
      <p>Actions: ${macro.actions.length}</p>
      <p><small style="color: #666;">Saved on: ${formattedDate}</small></p>
      <button class="runMacroBtn" data-index="${start + index}">Run Macro</button>
    `;

    macrosContainer.appendChild(macroBox);
  });

  attachRunMacroHandlers();
};

  const renderMacroPaginationDots = () => {
    const paginationDots = document.getElementById("paginationDotsTwo");
    paginationDots.innerHTML = "";

    const totalPages = Math.ceil(savedMacros.length / macrosPerPage);
    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement("div");
      dot.className = `dot ${i === macroPage ? "active" : ""}`;
      dot.addEventListener("click", () => {
        macroPage = i;
        renderMacroSection(macroPage);
        renderMacroPaginationDots();
      });
      paginationDots.appendChild(dot);
    }
  };

  const loadAndRenderMacros = async () => {
    const macros = await storage.get("macro_actions") || [];
    savedMacros = macros;
    macroPage = 0;
    renderMacroSection(macroPage);
    renderMacroPaginationDots();
  };

  const attachRunMacroHandlers = () => {
    const buttons = document.querySelectorAll('.runMacroBtn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const macro = savedMacros[index];
        if (macro) {
          runMacroOnActiveTab(macro.actions);
        }
      });
    });
  };

  const runMacroOnActiveTab = async (actions) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: "RUN_MACRO", actions });
      console.log("Macro sent to tab:", tab.id);
    } else {
      console.error("No active tab found");
    }
  };

  // Autofill History & Macro History Show On Recent Activities
  async function renderRecentActivities() {
    const recentBox = document.querySelector('.recentActivitiesBox');
    const deleteHistoryButton = document.getElementById('deleteHistory');

    if (!recentBox) {
        console.warn('⚠️ .recentActivitiesBox not found in DOM');
        return;
    }

    // Get both histories
    const autofillHistory = await storage.get('autofillHistory') || [];
    const macroHistory = await storage.get('macroHistory') || [];

    console.log('📦 Autofill History:', autofillHistory);
    console.log('🛠️ Macro History:', macroHistory);

    // Merge and sort by timestamp
    const combinedHistory = [...autofillHistory, ...macroHistory].sort((a, b) => b.timestamp - a.timestamp);

    if (combinedHistory.length === 0) {
        recentBox.innerHTML = `<div style="padding: 10px; color: #888;">No recent activities.</div>`;
        if (deleteHistoryButton) {
            deleteHistoryButton.style.display = 'none';
        }
        console.log('ℹ️ No recent activities found.');
        return;
    }

    if (deleteHistoryButton) {
        deleteHistoryButton.style.display = 'inline-block';
    }

    recentBox.innerHTML = ''; // clear

    combinedHistory.forEach((item, index) => {
        console.log(`🔄 Rendering activity #${index + 1}:`, item);

        const activityDiv = document.createElement('div');
        activityDiv.style.padding = '15px';
        activityDiv.style.marginBottom = '8px';
        activityDiv.style.fontSize = '14px';
        activityDiv.style.lineHeight = '1.4';

        let content = '';

        if (item.type === 'macro') {
            content = `
                <strong>Macro Recording Started</strong> on ${item.tabTitle}<br/>
                <small style="color:#999;">${new Date(item.timestamp).toLocaleString()}</small>
            `;
        } else {
            content = `
                <strong>${item.profileUsed}</strong> autofilled on ${item.tabTitle}<br/>
                <small style="color:#999;">${new Date(item.timestamp).toLocaleString()}</small>
            `;
        }

        activityDiv.innerHTML = content;
        recentBox.appendChild(activityDiv);
    });

    console.log('✅ Recent activities rendered.');
  }
  
  const deleteHistoryButton = document.getElementById('deleteHistory');
  deleteHistoryButton.addEventListener('click', async () => {
    await storage.set('autofillHistory', []); 
    await storage.set('macroHistory', []);
  
    const recentBox = document.querySelector('.recentActivitiesBox');
    if (recentBox) {
      recentBox.innerHTML = `<div style="padding: 10px; color: #888;">No recent activities.</div>`;
    }
  
    if (deleteHistoryButton) {
      deleteHistoryButton.style.display = 'none';
    }
  
    console.log('Autofill history deleted');
  });

  // Initial rendering
  try {
    if (profiles.length === 0) {
      profileGridContainer.innerHTML = "<p>No profiles found.</p>";
      profileDisplayContainer.innerHTML = "<p>No profiles found.</p>";
    } else {
      renderHomeProfiles(homePage);
      renderProfileSection(profilePage);

      if (profiles.length > profilesPerPage) {
        renderHomePaginationDots();
        renderProfilePaginationDots();
      }
    }
  } catch (error) {
    console.error("Failed to load user profile data:", error);
    profileGridContainer.innerHTML = "<p>Error loading profiles.</p>";
    profileDisplayContainer.innerHTML = "<p>Error loading profiles.</p>";
  }

  renderRecentActivities();

  setInterval(async () => {
    console.log("Auto refreshing recent activities");
    await renderRecentActivities();
  }, 3000)
});
