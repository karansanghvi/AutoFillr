import { storage } from "./storage.js";

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("resumeUpload");
    const fileNameDisplay = document.getElementById("file-name");
    const saveProfileButton = document.getElementById("saveProfileButton");
    const cancelProfileButton = document.getElementById("cancelProfileButton");

    fileInput.addEventListener("change", () => {
        const fileName = fileInput.files.length > 0 ? fileInput.files[0].name : "No file chosen";
        fileNameDisplay.textContent = fileName;
    });

    (async () => {
        const editProfile = await storage.get("editProfile");
        if (editProfile) {
            document.getElementById("fullName").value = editProfile.fullName || "";
            document.getElementById("emailAddress").value = editProfile.email || "";
            document.getElementById("phoneNumber").value = editProfile.phoneNumber || "";
            document.getElementById("linkedinURL").value = editProfile.linkedinURL || "";
            document.getElementById("website").value = editProfile.website || "";

            if (editProfile.resumeFileName) {
                fileNameDisplay.textContent = editProfile.resumeFileName;
            }

            saveProfileButton.textContent = "Update";
        }
    })();

    if (saveProfileButton) {
        saveProfileButton.addEventListener("click", async (event) => {
            event.preventDefault();

            const requiredFields = document.querySelectorAll('input[required]');
            let allFieldsValid = true;

            requiredFields.forEach((field) => {
                if (!field.value.trim()) {
                    allFieldsValid = false;
                    field.classList.add('error');
                } else {
                    field.classList.remove('error');
                }
            });

            if (!allFieldsValid) {
                showErrorAlert('Please fill out all required fields.');
                return;
            }

            const profileData = {
                fullName: document.getElementById("fullName").value.trim(),
                email: document.getElementById("emailAddress").value.trim(),
                phoneNumber: document.getElementById("phoneNumber").value.trim(),
                linkedinURL: document.getElementById("linkedinURL").value.trim(),
                website: document.getElementById("website").value.trim(),
                resumeFileName: fileInput.files.length > 0 ? fileInput.files[0].name : fileNameDisplay.textContent || null,
            };

            try {
                const existingData = await storage.get("userProfiles") || [];
                const editProfile = await storage.get("editProfile");
                let updatedProfiles;

                if (editProfile) {
                    updatedProfiles = existingData.map(p =>
                        p.email === editProfile.email ? profileData : p
                    );
                    await storage.set("editProfile", null); 
                } else {
                    updatedProfiles = [...existingData, profileData];
                }

                await storage.set("userProfiles", updatedProfiles);

                console.log("Profile Saved: ", profileData);
                showSuccessAlert(editProfile ? "Profile Updated Successfully!" : "Profile Saved Successfully!");
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 1500);
            } catch (err) {
                console.error("Error saving profile:", err);
                showErrorAlert("Something went wrong while saving. Please try again.");
            }
        });
    }

    if (cancelProfileButton) {
        cancelProfileButton.addEventListener("click", async () => {
            await storage.set("editProfile", null);
            window.location.href = "index.html";
        });
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
});
