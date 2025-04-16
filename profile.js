document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("resumeUpload");
    const fileNameDisplay = document.getElementById("file-name");
    const saveProfileButton = document.getElementById("saveProfileButton");
    const form = document.querySelector('form');  // Add the form to validate all fields

    // Show the selected file name
    fileInput.addEventListener("change", () => {
        const fileName = fileInput.files.length > 0 ? fileInput.files[0].name : "No file chosen";
        fileNameDisplay.textContent = fileName;
    });

    // Add event listener to the save button
    if (saveProfileButton) {
        saveProfileButton.addEventListener("click", (event) => {
            // Prevent default form submission to check validity first
            event.preventDefault();

            // Check if all required fields are filled
            const requiredFields = document.querySelectorAll('input[required]');
            let allFieldsValid = true;

            requiredFields.forEach((field) => {
                if (!field.value.trim()) {
                    allFieldsValid = false;
                    field.classList.add('error');  // Add error class for styling
                } else {
                    field.classList.remove('error');
                }
            });

            // If all required fields are valid, go to the next page
            if (allFieldsValid) {
                window.location.href = "dashboard.html";
            } else {
                showCustomAlert('Please fill out all required fields.');
            }
        });
    }

    // Function to show custom alert
    function showCustomAlert(message) {
        // Create a custom alert div
        const alertDiv = document.createElement('div');
        alertDiv.classList.add('custom-alert');
        alertDiv.innerHTML = message;

        // Append the alert to the body or form
        document.body.appendChild(alertDiv);

        // Remove the alert after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
});
