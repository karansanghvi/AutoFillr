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

  const addNewProfile = document.getElementById("addNewProfile");
  
  const container = document.getElementById("profileContainer");

  showSection(homeSection);
  homeLink.classList.add("active");

  const profiles = await storage.get("userProfiles") || [];
  const profilesPerPage = 3;

  let homePage = 0;
  let profilePage = 0;
  let profileToDelete = null;

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
});
