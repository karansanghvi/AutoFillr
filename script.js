document.addEventListener("DOMContentLoaded", async () => {
    const getStartedBtn = document.getElementById("getStartedButton");
    if (getStartedBtn) {
        getStartedBtn.addEventListener("click", () => {
            const hasVisited = localStorage.getItem("hasVisited");

            if (hasVisited) {
                window.location.href = "dashboard.html";
            } else {
                localStorage.setItem("hasVisited", "true");
                window.location.href = "getStarted.html";
            }
        });
    }

    const startBtn = document.getElementById("startButton");
    if (startBtn) {
        startBtn.addEventListener("click", () => {
            console.log("start button clicked");
            window.location.href = "profile.html";
        });
    }

    const fileInput = document.getElementById("resumeUpload");
    const fileNameDisplay = document.getElementById("file-name");

    if (fileInput && fileNameDisplay) {
        fileInput.addEventListener("change", () => {
            const fileName = fileInput.files.length > 0 ? fileInput.files[0].name : "No file chosen";
            fileNameDisplay.textContent = fileName;
        });
    }
});